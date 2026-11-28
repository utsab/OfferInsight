import {
  buildScreenCheckRequest,
  isScreenCheckDue,
  nextCheckOnShareStart,
  parseFrameTimes,
  parseImageDataUrl,
  parseScreenCheckResponse,
  runScreenCheck,
  screenCheckChatMessage,
  screenCheckTiming,
} from '../lib/deep-work/screen-checks';

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;
const text = (t: string) => ({ content: [{ type: 'text', text: t, citations: null }], stop_reason: 'end_turn' }) as never;

describe('screenCheckTiming', () => {
  it('checks every 30 minutes with a frame every 5', () => {
    expect(screenCheckTiming(env({ NODE_ENV: 'development' }))).toEqual({ checkIntervalMs: 1_800_000, frameIntervalMs: 300_000 });
  });

  it('honors the local override only outside production', () => {
    expect(screenCheckTiming(env({ NODE_ENV: 'development', DEEP_WORK_SCREEN_CHECK_MINUTES: '3' })).checkIntervalMs).toBe(180_000);
    expect(screenCheckTiming(env({ NODE_ENV: 'production', DEEP_WORK_SCREEN_CHECK_MINUTES: '3' })).checkIntervalMs).toBe(1_800_000);
    expect(screenCheckTiming(env({ NODE_ENV: 'development', DEEP_WORK_SCREEN_CHECK_MINUTES: 'abc' })).checkIntervalMs).toBe(1_800_000);
  });
});

describe('scheduling', () => {
  const timing = { checkIntervalMs: 1_800_000, frameIntervalMs: 300_000 };
  const now = new Date('2026-11-27T03:00:00Z');

  it('schedules the first check 30 minutes after sharing starts', () => {
    expect(nextCheckOnShareStart(null, timing, now).toISOString()).toBe('2026-11-27T03:30:00.000Z');
  });

  it('keeps an existing check so a refresh cannot skip it', () => {
    const existing = new Date('2026-11-27T03:10:00Z');
    expect(nextCheckOnShareStart(existing, timing, now)).toBe(existing);
  });

  it('counts a check as due up to 2 minutes early', () => {
    const next = new Date('2026-11-27T03:30:00Z');
    expect(isScreenCheckDue(next, new Date('2026-11-27T03:27:00Z'))).toBe(false);
    expect(isScreenCheckDue(next, new Date('2026-11-27T03:28:30Z'))).toBe(true);
    expect(isScreenCheckDue(null, now)).toBe(false);
  });
});

describe('input parsing', () => {
  it('accepts JPEG and PNG data URLs only', () => {
    expect(parseImageDataUrl('data:image/jpeg;base64,QUJD')).toMatchObject({ mediaType: 'image/jpeg', data: 'QUJD', bytes: 3 });
    expect(parseImageDataUrl('data:image/gif;base64,QUJD')).toBeNull();
    expect(parseImageDataUrl('https://example.com/a.jpg')).toBeNull();
    expect(parseImageDataUrl(42)).toBeNull();
  });

  it('accepts 1 to 6 valid frame times and sorts them', () => {
    expect(parseFrameTimes(['2026-11-27T03:05:00Z', '2026-11-27T03:00:00Z'])?.map((d) => d.toISOString())).toEqual([
      '2026-11-27T03:00:00.000Z',
      '2026-11-27T03:05:00.000Z',
    ]);
    expect(parseFrameTimes([])).toBeNull();
    expect(parseFrameTimes(new Array(7).fill('2026-11-27T03:00:00Z'))).toBeNull();
    expect(parseFrameTimes(['not a date'])).toBeNull();
  });
});

describe('the vision request', () => {
  it('sends the image, the plan and the frame times', () => {
    const req = buildScreenCheckRequest({
      plan: 'Send 5 applications',
      image: { mediaType: 'image/jpeg', data: 'QUJD' },
      frameTimes: [new Date('2026-11-27T03:00:00Z'), new Date('2026-11-27T03:05:00Z')],
    });
    expect(req.model).toBe('claude-opus-5-5');
    expect(req.output_config?.format?.type).toBe('json_schema');
    const content = req.messages[0].content as Array<{ type: string; text?: string }>;
    expect(content[0].type).toBe('image');
    expect(content[1].text).toContain('"Send 5 applications"');
    expect(content[1].text).toMatch(/7:00\sPM, 7:05\sPM/);
  });
});

describe('parseScreenCheckResponse', () => {
  it('reads the verdict', () => {
    expect(parseScreenCheckResponse(text('{"on_track":false,"note":"Same file for 30 min","message":"Looks stuck."}'))).toEqual({
      onTrack: false,
      note: 'Same file for 30 min',
      message: 'Looks stuck.',
    });
  });

  it('treats refusals and bad JSON as unclear and on track', () => {
    expect(parseScreenCheckResponse({ content: [], stop_reason: 'refusal' } as never).onTrack).toBe(true);
    expect(parseScreenCheckResponse(text('nope')).note).toMatch(/could not be read/);
    expect(parseScreenCheckResponse(text('{"on_track":"yes","note":"x","message":"y"}')).note).toMatch(/could not be read/);
  });
});

describe('screenCheckChatMessage', () => {
  it('offers the choice either way, optional when they drifted', () => {
    expect(screenCheckChatMessage({ onTrack: true, note: '', message: 'Nice progress.' }, 1_800_000)).toMatch(
      /keep tracking your screen, or turn screen sharing off\?$/
    );
    expect(screenCheckChatMessage({ onTrack: false, note: '', message: 'You seem off task.' }, 1_800_000)).toContain(
      "keep sharing your screen for another 30 minutes and I'll check again. It's up to you."
    );
  });
});

it('runScreenCheck calls the API and parses the answer', async () => {
  const create = jest.fn().mockResolvedValue(text('{"on_track":true,"note":"Editing resume","message":"Good."}'));
  const result = await runScreenCheck(
    { plan: 'Resume', image: { mediaType: 'image/png', data: 'QUJD' }, frameTimes: [new Date()] },
    { beta: { messages: { create } } } as never
  );
  expect(result.onTrack).toBe(true);
  expect(create).toHaveBeenCalledTimes(1);
});

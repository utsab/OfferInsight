import { buildHostRequest, parseHostResponse, phaseNote, runHostTurn, type HostContext } from '../lib/deep-work/ai-host';

const ctx: HostContext = {
  phase: 'planning',
  studentName: 'Sam',
  sessionLabel: 'Monday 7-9 PM',
  plan: null,
  scheduledEnd: new Date('2026-12-01T05:00:00Z'),
  now: new Date('2026-12-01T03:30:00Z'),
  history: [
    { role: 'AI', content: 'What do you plan to get done?' },
    { role: 'STUDENT', content: 'Send 5 applications' },
  ],
};

const textResponse = (text: string) => ({ content: [{ type: 'text', text, citations: null }], stop_reason: 'end_turn' }) as never;

describe('buildHostRequest', () => {
  it('starts with a user turn, maps roles, and ends with the phase note', () => {
    const req = buildHostRequest(ctx);
    expect(req.model).toBe('claude-opus-5-5');
    expect(req.fallbacks).toBe('default');
    expect(req.output_config?.format?.type).toBe('json_schema');
    expect(req.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'system']);
    expect(req.messages.at(-1)?.content).toContain('Phase: PLANNING');
  });

  it('puts the time left and saved plan in the phase note', () => {
    const note = phaseNote({ ...ctx, phase: 'summary', plan: 'Send 5 applications' });
    expect(note).toContain('Phase: SUMMARY');
    expect(note).toContain('90 minutes left');
    expect(note).toContain('Saved plan: "Send 5 applications"');
  });
});

describe('parseHostResponse', () => {
  it('reads reply, plan and summary, treating empty strings as nothing', () => {
    expect(parseHostResponse(textResponse('{"reply":"Go for it.","plan":"Send 5 applications","summary":""}'))).toEqual({
      reply: 'Go for it.',
      plan: 'Send 5 applications',
      summary: null,
    });
  });

  it('falls back on refusals and bad JSON', () => {
    expect(parseHostResponse({ content: [], stop_reason: 'refusal' } as never).plan).toBeNull();
    expect(parseHostResponse(textResponse('not json')).reply).toMatch(/couldn't/);
    expect(parseHostResponse(textResponse('{"reply":"","plan":"x","summary":""}')).plan).toBeNull();
  });
});

describe('runHostTurn', () => {
  it('sends the built request and parses the answer', async () => {
    const create = jest.fn().mockResolvedValue(textResponse('{"reply":"Nice.","plan":"","summary":"Sent 4 of 5."}'));
    const api = { beta: { messages: { create } } } as never;
    const turn = await runHostTurn({ ...ctx, phase: 'summary' }, api);
    expect(turn).toEqual({ reply: 'Nice.', plan: null, summary: 'Sent 4 of 5.' });
    expect(create.mock.calls[0][0].messages.at(-1).content).toContain('Phase: SUMMARY');
  });
});

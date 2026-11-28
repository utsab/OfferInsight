/**
 * Screen checks: every 5 minutes the browser keeps a small frame from its own screen
 * share (in memory only). Every 30 minutes it tiles those frames into one contact sheet
 * and sends it here; one Claude vision call compares the timeline with the session plan.
 * The image is discarded right after; only { onTrack, note } is stored.
 */
import Anthropic from '@anthropic-ai/sdk';
import { DEEP_WORK_AI_MODEL, anthropicClient } from '@/app/lib/deep-work/ai-host';
import { pacificClockTime } from '@/app/lib/deep-work/sessions';

export const SCREEN_CHECK_INTERVAL_MINUTES = 30;
export const FRAMES_PER_CHECK = 6;
/** Contact sheets bigger than this are refused (a 3x2 sheet of 640px frames is ~300 KB). */
export const MAX_CONTACT_SHEET_BYTES = 4 * 1024 * 1024;
/** A check that arrives a little early (timer drift, clock skew) still counts. */
const EARLY_GRACE_MS = 2 * 60_000;

export type ScreenCheckTiming = {
  checkIntervalMs: number;
  frameIntervalMs: number;
};

/**
 * 30-minute checks with a frame every 5 minutes. For local testing,
 * DEEP_WORK_SCREEN_CHECK_MINUTES (ignored in production) shortens the interval.
 */
export function screenCheckTiming(env: NodeJS.ProcessEnv = process.env): ScreenCheckTiming {
  const override = Number(env.DEEP_WORK_SCREEN_CHECK_MINUTES);
  const minutes =
    env.NODE_ENV !== 'production' && Number.isFinite(override) && override > 0
      ? override
      : SCREEN_CHECK_INTERVAL_MINUTES;
  const checkIntervalMs = Math.round(minutes * 60_000);
  return { checkIntervalMs, frameIntervalMs: Math.round(checkIntervalMs / FRAMES_PER_CHECK) };
}

/** When sharing starts: keep an already scheduled check (a refresh can't skip it), else schedule one. */
export function nextCheckOnShareStart(
  existing: Date | null,
  timing: ScreenCheckTiming,
  now = new Date()
): Date {
  return existing ?? new Date(now.getTime() + timing.checkIntervalMs);
}

export function isScreenCheckDue(nextScreenCheckAt: Date | null, now = new Date()): boolean {
  return nextScreenCheckAt !== null && now.getTime() >= nextScreenCheckAt.getTime() - EARLY_GRACE_MS;
}

/** "data:image/jpeg;base64,..." → the base64 part, or null if it isn't a JPEG/PNG data URL. */
export function parseImageDataUrl(
  dataUrl: unknown
): { mediaType: 'image/jpeg' | 'image/png'; data: string; bytes: number } | null {
  if (typeof dataUrl !== 'string') return null;
  const match = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  const data = match[2];
  const bytes = Math.floor((data.length * 3) / 4);
  return { mediaType: match[1] as 'image/jpeg' | 'image/png', data, bytes };
}

/** Frame capture times, oldest first, at most FRAMES_PER_CHECK valid dates. */
export function parseFrameTimes(value: unknown): Date[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > FRAMES_PER_CHECK) return null;
  const dates = value.map((v) => (typeof v === 'string' ? new Date(v) : new Date(NaN)));
  if (dates.some((d) => Number.isNaN(d.getTime()))) return null;
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

const SYSTEM_PROMPT = `You review screen-share snapshots for OfferInsight Deep Work sessions, where students work on job applications, networking, open source contributions, interview prep and LeetCode. You get one contact sheet: up to 6 screenshots of the student's screen taken about 5 minutes apart over the last half hour, labelled with times and ordered left to right, top to bottom. You also get the plan the student stated for this session.

Judge two things together:
1. Relevance: is what's on screen plausibly part of the plan? Research, docs, email or LinkedIn for outreach, and short breaks are fine when they serve the plan.
2. Progress over time: does the work move across the frames? The same file or page with no visible change across most frames means the student looks stalled, even if it is relevant. Lots of switching between unrelated things means they look distracted.

They are on track when the screen is mostly on the plan and the work moves. Otherwise they are off track. When the screenshots are unreadable or blank, call it on track and say you couldn't tell.

Answer in JSON:
- "on_track": true or false.
- "note": one line for the session record describing what you saw, e.g. "Editing resume.tex, bullets changing across frames". No personal data such as names, emails or messages you can read on screen.
- "message": what the student sees in chat. One or two short, warm sentences, plain text. On track: say what looks good, specifically. Off track: say kindly that they seem off their stated task (or stuck on the same thing), name the plan, and suggest one next step. Don't ask a question; the app adds one when needed.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    on_track: { type: 'boolean' },
    note: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['on_track', 'note', 'message'],
  additionalProperties: false,
} as const;

export type ScreenCheckInput = {
  plan: string;
  image: { mediaType: 'image/jpeg' | 'image/png'; data: string };
  frameTimes: Date[];
};

export type ScreenCheckResult = { onTrack: boolean; note: string; message: string };

export function buildScreenCheckRequest(input: ScreenCheckInput): Anthropic.Beta.MessageCreateParamsNonStreaming {
  const times = input.frameTimes.map((t) => pacificClockTime(t)).join(', ');
  return {
    model: DEEP_WORK_AI_MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM_PROMPT,
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: input.image.mediaType, data: input.image.data } },
          {
            type: 'text',
            text: `The student's plan for this session: "${input.plan}"\n\nThe contact sheet has ${input.frameTimes.length} screenshot(s), taken at ${times} Pacific time.`,
          },
        ],
      },
    ],
  };
}

const UNCLEAR: ScreenCheckResult = {
  onTrack: true,
  note: 'Screen check could not be read.',
  message: "I couldn't make out your screen this time, so I'll look again later. Keep going.",
};

export function parseScreenCheckResponse(
  response: Pick<Anthropic.Beta.BetaMessage, 'content' | 'stop_reason'>
): ScreenCheckResult {
  if (response.stop_reason === 'refusal') return UNCLEAR;
  const text = response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
  try {
    const parsed = JSON.parse(text) as { on_track?: unknown; note?: unknown; message?: unknown };
    if (typeof parsed.on_track !== 'boolean') throw new Error('missing on_track');
    const note = typeof parsed.note === 'string' && parsed.note.trim() ? parsed.note.trim() : UNCLEAR.note;
    const message = typeof parsed.message === 'string' && parsed.message.trim() ? parsed.message.trim() : null;
    if (!message) throw new Error('missing message');
    return { onTrack: parsed.on_track, note: note.slice(0, 500), message };
  } catch {
    return UNCLEAR;
  }
}

/** The chat message after a check: on track adds the keep/turn-off question. */
export function screenCheckChatMessage(result: ScreenCheckResult, checkIntervalMs: number): string {
  const minutes = Math.round(checkIntervalMs / 60_000);
  return result.onTrack
    ? `${result.message} Do you want me to keep tracking your screen, or turn screen sharing off?`
    : `${result.message} Your screen stays shared, and I'll check in again in ${minutes} minutes.`;
}

export async function runScreenCheck(
  input: ScreenCheckInput,
  api: Anthropic = anthropicClient()
): Promise<ScreenCheckResult> {
  const response = await api.beta.messages.create(buildScreenCheckRequest(input));
  return parseScreenCheckResponse(response);
}

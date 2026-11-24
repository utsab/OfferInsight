/**
 * The AI host of a Deep Work session: one Claude call per student message. The server
 * rebuilds the conversation from the database each time, so no AI process sits in the
 * LiveKit room. Claude answers in JSON so the server can save the plan and summary.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { DeepWorkMessageRole, DeepWorkPhase } from '@/app/lib/deep-work/sessions';
import { pacificClockTime } from '@/app/lib/deep-work/sessions';

export const DEEP_WORK_AI_MODEL = 'claude-opus-5-5';

const SYSTEM_PROMPT = `You host Deep Work sessions for OfferInsight, a program that helps students land software engineering jobs. Students work on job applications, networking outreach, open source contributions, interview prep, and LeetCode. A session is 2 hours of focused, solo work; you are the accountability partner in a chat panel beside their screen share.

How you talk:
- Warm, direct, and brief: one to three short sentences. The student is here to work, not to chat with you.
- Plain text only, no markdown, no lists.
- Never do the student's work for them in this chat (no writing their cover letters or solving their LeetCode problems). You can point them in a direction in a sentence.

Every request ends with a system note telling you the session's phase. Follow it.

You always answer with JSON: "reply" is the message the student sees. "plan" and "summary" are how you save things to the session record; use an empty string when you are not saving anything this turn.`;

const PHASE_INSTRUCTIONS: Record<Exclude<DeepWorkPhase, 'done'>, string> = {
  planning:
    'Phase: PLANNING. You are waiting for the student\'s plan for this session. If their message gives a concrete plan (what they will do, ideally something they can finish in the time left), save a one or two sentence restatement of it in "plan", in their words where possible, and reply with a short go-ahead. If it is vague ("work on stuff"), ask one question to make it concrete and leave "plan" empty. Leave "summary" empty.',
  working:
    'Phase: WORKING. The student has a plan and is working. Answer briefly and nudge them back to it. If they clearly change their plan, save the new plan in "plan"; otherwise leave it empty. Leave "summary" empty.',
  summary:
    'Phase: SUMMARY. The session is ending and you asked how it went. If their message says what they got done (even "not much, I got stuck on X" counts), save a one to three sentence summary in "summary", comparing it with the plan when there was one, and reply with a short, specific closing line. If they did not answer the question, ask once more and leave "summary" empty. Leave "plan" empty.',
};

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    plan: { type: 'string' },
    summary: { type: 'string' },
  },
  required: ['reply', 'plan', 'summary'],
  additionalProperties: false,
} as const;

export type HostTurn = {
  reply: string;
  /** Set when this turn captured (or changed) the plan */
  plan: string | null;
  /** Set when this turn captured the end-of-session summary */
  summary: string | null;
};

export type HostContext = {
  phase: Exclude<DeepWorkPhase, 'done'>;
  studentName: string | null;
  sessionLabel: string;
  plan: string | null;
  scheduledEnd: Date;
  /** Full chat so far, oldest first, ending with the student's new message */
  history: { role: DeepWorkMessageRole; content: string }[];
  now?: Date;
};

const FALLBACK_REPLY =
  "Sorry, I couldn't come up with a reply just now. Keep going, and try me again in a minute.";

/** The per-turn system note: phase rules plus the facts that change between turns. */
export function phaseNote(ctx: HostContext): string {
  const now = ctx.now ?? new Date();
  const minutesLeft = Math.max(0, Math.round((ctx.scheduledEnd.getTime() - now.getTime()) / 60000));
  const facts = [
    `Student: ${ctx.studentName ?? 'unknown name'}.`,
    `Session: ${ctx.sessionLabel}, ends at ${pacificClockTime(ctx.scheduledEnd)} PT (${minutesLeft} minutes left).`,
    ctx.plan ? `Saved plan: "${ctx.plan}".` : 'No plan saved yet.',
  ];
  return `${PHASE_INSTRUCTIONS[ctx.phase]}\n\n${facts.join(' ')}`;
}

/** The Messages API request body for one host turn. */
export function buildHostRequest(ctx: HostContext): Anthropic.Beta.MessageCreateParamsNonStreaming {
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    // The API needs a user turn first; the session's opening AI message follows it.
    { role: 'user', content: '(The student joined the Deep Work session.)' },
    ...ctx.history.map(
      (m): Anthropic.Beta.BetaMessageParam => ({
        role: m.role === 'AI' ? 'assistant' : 'user',
        content: m.content,
      })
    ),
    { role: 'system', content: phaseNote(ctx) },
  ];
  return {
    model: DEEP_WORK_AI_MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM_PROMPT,
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
    },
    messages,
  };
}

/** Reads Claude's JSON answer; anything unusable becomes a safe fallback reply. */
export function parseHostResponse(response: Pick<Anthropic.Beta.BetaMessage, 'content' | 'stop_reason'>): HostTurn {
  if (response.stop_reason === 'refusal') {
    return { reply: FALLBACK_REPLY, plan: null, summary: null };
  }
  const text = response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
  try {
    const parsed = JSON.parse(text) as { reply?: unknown; plan?: unknown; summary?: unknown };
    const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const reply = clean(parsed.reply);
    if (!reply) throw new Error('empty reply');
    return { reply, plan: clean(parsed.plan), summary: clean(parsed.summary) };
  } catch {
    return { reply: FALLBACK_REPLY, plan: null, summary: null };
  }
}

let defaultClient: Anthropic | null = null;
function client(): Anthropic {
  defaultClient ??= new Anthropic();
  return defaultClient;
}

export function anthropicConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.ANTHROPIC_API_KEY?.trim());
}

/** One host turn. Throws on API errors so the route can report them. */
export async function runHostTurn(ctx: HostContext, api: Anthropic = client()): Promise<HostTurn> {
  const response = await api.beta.messages.create(buildHostRequest(ctx));
  return parseHostResponse(response);
}

"use client"

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Brain, Loader2, MonitorUp, MonitorX, Send, Square } from 'lucide-react';
import { Room, RoomEvent, Track, type LocalTrackPublication } from 'livekit-client';
import type { DeepWorkSessionPayload } from '@/app/lib/deep-work/sessions';
import { MAX_STUDENT_MESSAGE_CHARS, shareReminderDelayMs } from '@/app/lib/deep-work/sessions';
import {
  buildContactSheet,
  captureFrame,
  playDriftAlarm,
  playEndFanfare,
  unlockAlertSound,
  type CapturedFrame,
} from '@/components/deep-work-screen-frames';

const FRAMES_PER_CHECK = 6;

function formatRemaining(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m left` : `${minutes}m left`;
}

function pacificTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

async function readJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  return data as Partial<DeepWorkSessionPayload> & { error?: string };
}

/** The Deep Work room: screen share on the left, the AI host's chat on the right. */
export default function DeepWorkRoom({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<DeepWorkSessionPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [sharing, setSharing] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const autoEndSent = useRef(false);

  // Screen checks: frames stay in memory only and are dropped after each check.
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const framesRef = useRef<CapturedFrame[]>([]);
  const lastCaptureRef = useRef(0);
  const checkInFlightRef = useRef(false);
  const dataRef = useRef<DeepWorkSessionPayload | null>(null);
  const [choiceBusy, setChoiceBusy] = useState(false);

  const apply = useCallback((payload: Partial<DeepWorkSessionPayload>) => {
    if (payload.session && payload.messages) {
      dataRef.current = payload as DeepWorkSessionPayload;
      setData(payload as DeepWorkSessionPayload);
    }
  }, []);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/deep-work/sessions/${encodeURIComponent(sessionId)}`);
    if (res.ok) apply(await readJson(res));
  }, [sessionId, apply]);

  const postShareAction = useCallback(
    async (action: 'started' | 'stopped' | 'keep' | 'turn_off') => {
      const res = await fetch(`/api/deep-work/sessions/${encodeURIComponent(sessionId)}/screen-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = await readJson(res);
      apply(payload);
      if (!res.ok) throw new Error(payload.error || 'Could not update screen sharing.');
    },
    [sessionId, apply]
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/deep-work/sessions/${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        const payload = await readJson(res);
        if (!res.ok) throw new Error(payload.error || 'Could not load this session.');
        if (!cancelled) apply(payload);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load this session.');
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, apply]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [data?.messages.length, sending]);

  const stopSharing = useCallback(
    async (notifyServer = true) => {
      const room = roomRef.current;
      roomRef.current = null;
      trackRef.current = null;
      framesRef.current = [];
      setSharing(false);
      if (videoRef.current) videoRef.current.srcObject = null;
      if (room) await room.disconnect();
      if (room && notifyServer) await postShareAction('stopped').catch(() => {});
    },
    [postShareAction]
  );

  // Leave the LiveKit room when the page closes, and tell the server sharing stopped
  // (a beacon still gets sent while the page unloads).
  useEffect(() => {
    const onPageHide = () => {
      if (!roomRef.current) return;
      navigator.sendBeacon(
        `/api/deep-work/sessions/${encodeURIComponent(sessionId)}/screen-share`,
        new Blob([JSON.stringify({ action: 'stopped' })], { type: 'application/json' })
      );
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      void roomRef.current?.disconnect();
    };
  }, [sessionId]);

  const phase = data?.session.phase;
  const finished = phase === 'done';

  useEffect(() => {
    if (finished && roomRef.current) void stopSharing(false);
  }, [finished, stopSharing]);

  async function startSharing() {
    unlockAlertSound(); // this click lets the off-track alert play later
    setShareBusy(true);
    setShareError(null);
    try {
      const res = await fetch(`/api/deep-work/sessions/${encodeURIComponent(sessionId)}/token`, { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as { token?: string; url?: string; error?: string };
      if (!res.ok || !body.token || !body.url) throw new Error(body.error || 'Could not start screen sharing.');

      const room = new Room();
      await room.connect(body.url, body.token);
      roomRef.current = room;
      // The browser's own "Stop sharing" bar unpublishes the track; reflect that here.
      room.on(RoomEvent.LocalTrackUnpublished, (pub: LocalTrackPublication) => {
        if (pub.source === Track.Source.ScreenShare) void stopSharing();
      });
      const publication = await room.localParticipant.setScreenShareEnabled(true);
      if (!publication?.track) throw new Error('Screen sharing was cancelled.');
      if (videoRef.current) publication.track.attach(videoRef.current);
      trackRef.current = publication.track.mediaStreamTrack;
      framesRef.current = [];
      lastCaptureRef.current = 0;
      setSharing(true);
      await postShareAction('started');
    } catch (err) {
      // Don't stay connected to the room without a screen share.
      const room = roomRef.current;
      roomRef.current = null;
      if (room) await room.disconnect();
      const blocked = err instanceof Error && (err.name === 'NotAllowedError' || /permission/i.test(err.message));
      setShareError(
        blocked
          ? 'Screen sharing was cancelled or blocked by the browser. Click Share screen to try again.'
          : err instanceof Error
            ? err.message
            : 'Could not start screen sharing.'
      );
    } finally {
      setShareBusy(false);
    }
  }

  // Every few seconds while sharing: keep a frame every frameIntervalMs (at most 6), and
  // when the server's nextScreenCheckAt has passed, send them as one contact sheet.
  const runScreenCheck = useCallback(async () => {
    if (checkInFlightRef.current) return;
    const frames = framesRef.current;
    const image = buildContactSheet(frames);
    if (!image) return;
    checkInFlightRef.current = true;
    try {
      const res = await fetch(`/api/deep-work/sessions/${encodeURIComponent(sessionId)}/screen-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, frameTimes: frames.map((f) => f.capturedAt.toISOString()) }),
      });
      const payload = await readJson(res);
      framesRef.current = [];
      if (res.ok) {
        apply(payload);
        if ((payload as { onTrack?: boolean }).onTrack === false) playDriftAlarm();
      }
      else await reload(); // e.g. another tab already ran it: pick up the new schedule
    } catch (err) {
      console.error('Screen check failed', err);
    } finally {
      checkInFlightRef.current = false;
    }
  }, [sessionId, apply, reload]);

  useEffect(() => {
    if (!sharing || !data) return;
    const { frameIntervalMs } = data.screenCheck;
    const tickMs = Math.max(5_000, Math.min(30_000, Math.floor(frameIntervalMs / 2)));
    const tick = async () => {
      const current = dataRef.current;
      if (!current || current.session.status !== 'ACTIVE' || checkInFlightRef.current) return;
      const t = Date.now();
      const next = current.session.nextScreenCheckAt ? Date.parse(current.session.nextScreenCheckAt) : null;
      const due = next !== null && t >= next;
      const sinceLast = t - lastCaptureRef.current;
      if (sinceLast >= frameIntervalMs || (due && sinceLast > 15_000)) {
        const frame = await captureFrame(trackRef.current, videoRef.current);
        if (frame) {
          lastCaptureRef.current = t;
          framesRef.current = [...framesRef.current, frame].slice(-FRAMES_PER_CHECK);
        }
      }
      if (due && framesRef.current.length > 0) await runScreenCheck();
    };
    void tick();
    const timer = setInterval(() => void tick(), tickMs);
    return () => clearInterval(timer);
    // Restart only when sharing toggles or the interval changes, not on every chat update.
  }, [sharing, data?.screenCheck.frameIntervalMs, runScreenCheck]);

  async function answerShareChoice(action: 'keep' | 'turn_off') {
    setChoiceBusy(true);
    setChatError(null);
    try {
      await postShareAction(action);
      if (action === 'turn_off') await stopSharing(false);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Could not update screen sharing.');
    } finally {
      setChoiceBusy(false);
    }
  }

  // Sound needs a click first: any click on the page unlocks the chime for later.
  useEffect(() => {
    const unlock = () => unlockAlertSound();
    document.addEventListener('pointerdown', unlock);
    return () => document.removeEventListener('pointerdown', unlock);
  }, []);

  // Chime once if they still haven't shared 5 minutes after joining. The Join click on the
  // Overview tab usually lets sound play here; after a page reload, a click on the page does.
  const shareReminderPlayed = useRef(false);
  const reminderDelay = data ? shareReminderDelayMs(data.session, sharing) : null;
  useEffect(() => {
    unlockAlertSound();
  }, []);
  useEffect(() => {
    if (reminderDelay === null || shareReminderPlayed.current) return;
    const timer = setTimeout(() => {
      const current = dataRef.current;
      if (current && shareReminderDelayMs(current.session, roomRef.current !== null) !== null) {
        shareReminderPlayed.current = true;
        playDriftAlarm();
      }
    }, reminderDelay);
    return () => clearTimeout(timer);
  }, [reminderDelay === null, sharing]); // reschedule only when it starts/stops applying

  // Chime when the host asks for the summary (End clicked, or time ran out).
  const lastStatusRef = useRef<string | null>(null);
  const status = data?.session.status ?? null;
  useEffect(() => {
    if (lastStatusRef.current === 'ACTIVE' && status === 'WRAPPING_UP') playEndFanfare();
    lastStatusRef.current = status;
  }, [status]);

  const endSession = useCallback(async () => {
    setEnding(true);
    setChatError(null);
    try {
      const res = await fetch(`/api/deep-work/sessions/${encodeURIComponent(sessionId)}/end`, { method: 'POST' });
      const payload = await readJson(res);
      if (!res.ok) throw new Error(payload.error || 'Could not end the session.');
      apply(payload);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Could not end the session.');
    } finally {
      setEnding(false);
    }
  }, [sessionId, apply]);

  // When the 2 hours run out, the host asks for the summary on its own.
  const remainingMs = data ? Date.parse(data.session.scheduledEnd) - now : 0;
  useEffect(() => {
    if (data?.session.status === 'ACTIVE' && remainingMs <= 0 && !autoEndSent.current) {
      autoEndSent.current = true;
      void endSession();
    }
  }, [data?.session.status, remainingMs, endSession]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setChatError(null);
    try {
      const res = await fetch(`/api/deep-work/sessions/${encodeURIComponent(sessionId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const payload = await readJson(res);
      apply(payload);
      // 502 means the message was saved but the host didn't answer; don't keep a copy to resend.
      if (res.ok || res.status === 502) setDraft('');
      if (!res.ok) throw new Error(payload.error || 'Could not send your message.');
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Could not send your message.');
    } finally {
      setSending(false);
    }
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-700">{loadError}</p>
        <Link href="/dashboard" className="inline-block mt-4 text-electric-blue font-semibold">
          Back to dashboard
        </Link>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-electric-blue" />
      </div>
    );
  }

  const { session, messages, livekitConfigured } = data;
  // Required sharing: until a check finds them on track, the chat waits for a screen share.
  const chatLocked = session.shareRequired && session.status === 'ACTIVE' && livekitConfigured && !sharing;
  const placeholder =
    phase === 'planning'
      ? 'What will you get done this session?'
      : phase === 'summary'
        ? 'What did you get done?'
        : 'Message your Deep Work host';

  return (
    <div className="min-h-[calc(100dvh-var(--navbar-height))] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900" aria-label="Back to dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Brain className="w-6 h-6 text-electric-blue shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">Deep Work: {session.label}</h1>
              <p className="text-sm text-gray-500">
                {pacificTime(session.scheduledStart)} to {pacificTime(session.scheduledEnd)} PT
                {session.status === 'ACTIVE' && <> · {formatRemaining(remainingMs)}</>}
                {session.status === 'WRAPPING_UP' && <> · Wrapping up</>}
                {finished && <> · Finished</>}
              </p>
            </div>
          </div>
          {session.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={endSession}
              disabled={ending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 disabled:opacity-50"
            >
              {ending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
              End session
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-4">
          <section className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col min-h-[320px]">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="font-semibold text-gray-900">Your screen</h2>
              {!finished &&
                livekitConfigured &&
                (sharing ? (
                  <button
                    type="button"
                    onClick={() => void stopSharing(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-300 hover:bg-gray-100"
                  >
                    <MonitorX className="w-4 h-4" /> Stop sharing
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startSharing}
                    disabled={shareBusy}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-electric-blue text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {shareBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MonitorUp className="w-4 h-4" />}
                    Share screen
                  </button>
                ))}
            </div>
            {shareError && !finished && (
              <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{shareError}</p>
            )}
            <div className="relative flex-1 rounded-lg bg-gray-900 overflow-hidden flex items-center justify-center">
              <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-contain ${sharing ? '' : 'hidden'}`} />
              {!sharing && (
                <p className="px-6 text-center text-sm text-gray-300">
                  {finished
                    ? 'This session is finished.'
                    : livekitConfigured
                      ? 'Share your screen so your session is accountable. Every 30 minutes the host looks at a few snapshots to see how your plan is going. Snapshots are never saved, and nothing is recorded.'
                      : 'Screen sharing is not set up on this server yet. You can still work with the host in the chat.'}
                </p>
              )}
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg flex flex-col h-[70vh] lg:h-[calc(100dvh-var(--navbar-height)-120px)]">
            {(session.plan || session.summary) && (
              <div className="border-b border-gray-200 px-4 py-3 text-sm space-y-1">
                {session.plan && (
                  <p>
                    <span className="font-semibold text-gray-900">Plan:</span> <span className="text-gray-700">{session.plan}</span>
                  </p>
                )}
                {session.summary && (
                  <p>
                    <span className="font-semibold text-gray-900">Summary:</span>{' '}
                    <span className="text-gray-700">{session.summary}</span>
                  </p>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto show-scrollbar px-4 py-3 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'STUDENT' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === 'STUDENT' ? 'bg-electric-blue text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-3 py-2 bg-gray-100 text-gray-500 text-sm inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {session.pendingShareChoice && session.status === 'ACTIVE' && (
              <div className="mx-4 mb-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => answerShareChoice('keep')}
                  disabled={choiceBusy}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-electric-blue text-white hover:opacity-90 disabled:opacity-50"
                >
                  Keep sharing for another {Math.round(data.screenCheck.checkIntervalMs / 60_000)} minutes
                </button>
                <button
                  type="button"
                  onClick={() => answerShareChoice('turn_off')}
                  disabled={choiceBusy}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                >
                  Turn screen sharing off
                </button>
              </div>
            )}
            {chatError && (
              <p className="mx-4 mb-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{chatError}</p>
            )}
            {finished ? (
              <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
                Session finished. Nice work.{' '}
                <Link href="/dashboard" className="font-semibold text-electric-blue">
                  Back to dashboard
                </Link>
              </div>
            ) : chatLocked ? (
              <div className="border-t border-gray-200 px-4 py-4 text-sm bg-blue-50">
                <p className="font-semibold text-gray-900">
                  {session.nextScreenCheckAt ? 'Share your screen to continue' : 'Share your screen to start'}
                </p>
                <p className="text-gray-600 mt-1">
                  The app requires screen-sharing for the first 30 minutes.
                </p>
                <button
                  type="button"
                  onClick={startSharing}
                  disabled={shareBusy}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-electric-blue text-white hover:opacity-90 disabled:opacity-50"
                >
                  {shareBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MonitorUp className="w-4 h-4" />}
                  Share screen
                </button>
              </div>
            ) : (
              <form onSubmit={sendMessage} className="border-t border-gray-200 p-3 flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  maxLength={MAX_STUDENT_MESSAGE_CHARS}
                  rows={2}
                  placeholder={placeholder}
                  disabled={sending}
                  className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-electric-blue focus:ring-electric-blue"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  aria-label="Send"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-electric-blue text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

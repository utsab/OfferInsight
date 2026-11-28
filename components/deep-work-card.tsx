"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, Loader2 } from 'lucide-react';
import { canJoinNow, DEEP_WORK_SLOTS_PER_WEEK, type DeepWorkSchedule } from '@/app/lib/deep-work/slots';
import { slotListLabel } from '@/components/deep-work-scheduler';

/** Overview-tab card: the student's weekly Deep Work sessions, or a prompt to pick them. */
export default function DeepWorkCard({ instructorViewUserId }: { instructorViewUserId?: string | null }) {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<DeepWorkSchedule | null>(null);
  const [failed, setFailed] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const router = useRouter();

  // Re-check every 30s so "Join session" appears 10 minutes before start without a reload.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  async function join(practice = false) {
    setJoining(true);
    setJoinError(null);
    try {
      const res = await fetch('/api/deep-work/sessions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(practice ? { practice: true } : {}),
      });
      const data = (await res.json().catch(() => ({}))) as { sessionId?: string; error?: string };
      if (!res.ok || !data.sessionId) throw new Error(data.error || 'Could not join the session.');
      router.push(`/deep-work/${data.sessionId}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join the session.');
      setJoining(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    const url = instructorViewUserId
      ? `/api/deep-work/schedule?userId=${encodeURIComponent(instructorViewUserId)}`
      : '/api/deep-work/schedule';
    fetch(url)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load Deep Work sessions');
        if (!cancelled) setSchedule(data as DeepWorkSchedule);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [instructorViewUserId]);

  const slotKeys = schedule?.slotKeys ?? [];
  const hasSlots = slotKeys.length > 0;
  const joinable = Boolean(schedule?.nextSession && canJoinNow(schedule.nextSession, now));
  const showActions = !instructorViewUserId && !loading && !failed;

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <Brain className="w-5 h-5 text-electric-blue shrink-0 mt-0.5" />
        <div className="min-w-0">
          {loading ? (
            <p className="text-sm text-gray-400">Loading Deep Work sessions…</p>
          ) : failed ? (
            <p className="text-sm text-gray-500">Couldn&apos;t load Deep Work sessions.</p>
          ) : hasSlots ? (
            <>
              <p className="text-sm text-gray-900">
                Deep Work sessions:{' '}
                <span className="font-semibold">{slotListLabel(slotKeys)}</span>{' '}
                <span className="text-gray-400">(Pacific time)</span>
              </p>
              {schedule?.nextSession && (
                <p className="text-sm text-gray-600 mt-1">
                  {schedule.nextSession.inProgress ? 'In progress now: ' : 'Next session: '}
                  <span className="font-medium text-gray-900">{schedule.nextSession.label}</span>
                </p>
              )}
              {joinError && <p className="text-sm text-red-700 mt-1">{joinError}</p>}
            </>
          ) : (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {instructorViewUserId
                ? "This student hasn't picked their weekly Deep Work sessions."
                : `You haven't picked your ${DEEP_WORK_SLOTS_PER_WEEK} weekly Deep Work sessions.`}{' '}
              Deep Work sessions are 2 hours of focused work on your goals, hosted by an AI.
              {instructorViewUserId ? '' : ' Please pick yours.'}
            </p>
          )}
        </div>
      </div>
      {showActions && (
        <div className="shrink-0 flex flex-wrap items-center gap-2">
          {schedule?.practiceMode && !joinable && (
            <button
              type="button"
              onClick={() => join(true)}
              disabled={joining}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg border border-electric-blue text-electric-blue hover:bg-blue-50 disabled:opacity-50"
            >
              Start practice session
            </button>
          )}
          {joinable ? (
            <button
              type="button"
              onClick={() => join()}
              disabled={joining}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-electric-blue text-white hover:opacity-90 disabled:opacity-50"
            >
              {joining && <Loader2 className="w-4 h-4 animate-spin" />}
              Join session
            </button>
          ) : (
            <Link
              href="/account#deep-work"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-electric-blue text-white hover:opacity-90 transition-opacity"
            >
              {hasSlots ? 'Change sessions' : 'Pick sessions'}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

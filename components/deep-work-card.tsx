"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Brain } from 'lucide-react';
import { DEEP_WORK_SLOTS_PER_WEEK, type DeepWorkSchedule } from '@/app/lib/deep-work/slots';
import { slotListLabel } from '@/components/deep-work-scheduler';

/** Overview-tab card: the student's weekly Deep Work sessions, or a prompt to pick them. */
export default function DeepWorkCard({ instructorViewUserId }: { instructorViewUserId?: string | null }) {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<DeepWorkSchedule | null>(null);
  const [failed, setFailed] = useState(false);

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
      {!instructorViewUserId && !loading && !failed && (
        <Link
          href="/account#deep-work"
          className="shrink-0 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-electric-blue text-white hover:opacity-90 transition-opacity"
        >
          {hasSlots ? 'Change sessions' : 'Pick sessions'}
        </Link>
      )}
    </div>
  );
}

"use client"

import { useCallback, useEffect, useState } from 'react';
import { Brain, Check, Loader2 } from 'lucide-react';
import {
  DEEP_WORK_JOIN_EARLY_MINUTES,
  DEEP_WORK_SESSION_MINUTES,
  DEEP_WORK_SLOTS,
  DEEP_WORK_SLOTS_PER_WEEK,
  getDeepWorkSlot,
  slotLabel,
  slotTimeRange,
  type DeepWorkSchedule,
} from '@/app/lib/deep-work/slots';
import { DAY_LABELS } from '@/app/lib/calendar/constants';

/** "Monday 7-9 PM and Thursday 6-8 PM" */
export function slotListLabel(slotKeys: string[]): string {
  return slotKeys
    .map((key) => getDeepWorkSlot(key))
    .filter((slot) => slot !== undefined)
    .map((slot) => slotLabel(slot))
    .join(' and ');
}

/** Account-page picker for the student's 2 weekly Deep Work sessions. */
export default function DeepWorkScheduler() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<DeepWorkSchedule | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/deep-work/schedule');
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as DeepWorkSchedule;
      setSchedule(data);
      setSelected(data.slotKeys);
      setOpen(data.slotKeys.length === 0);
    } catch (err) {
      console.error('Deep Work schedule load failed', err);
      setError('Could not load Deep Work sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The account page renders a spinner first, so the browser can't jump to
  // /account#deep-work on its own. Scroll once our section is on screen.
  useEffect(() => {
    if (loading || window.location.hash !== '#deep-work') return;
    document.getElementById('deep-work')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading]);

  function toggle(key: string) {
    setMessage(null);
    setSelected((current) => {
      if (current.includes(key)) return current.filter((k) => k !== key);
      if (current.length >= DEEP_WORK_SLOTS_PER_WEEK) return current;
      return [...current, key];
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/deep-work/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotKeys: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save your sessions.');
      setSchedule(data as DeepWorkSchedule);
      setSelected((data as DeepWorkSchedule).slotKeys);
      setOpen(false);
      setMessage('Saved. Your Deep Work sessions repeat every week.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your sessions.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setSelected(schedule?.slotKeys ?? []);
    setOpen(false);
  }

  const saved = schedule?.slotKeys ?? [];
  const unchanged =
    selected.length === saved.length && selected.every((key) => saved.includes(key));
  const hours = DEEP_WORK_SESSION_MINUTES / 60;

  return (
    <div>
      <div className="flex items-start gap-3 mb-4">
        <Brain className="w-6 h-6 text-electric-blue shrink-0 mt-0.5" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Deep Work sessions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Pick {DEEP_WORK_SLOTS_PER_WEEK} sessions a week. Each one is {hours} hours of focused
            work on your goals, hosted by an AI that checks in on your plan and progress. Your
            picks repeat every week until you change them. You can join up to{' '}
            {DEEP_WORK_JOIN_EARLY_MINUTES} minutes early.
          </p>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            error
              ? 'border-red-300 bg-red-50 text-red-800'
              : 'border-green-300 bg-green-50 text-green-800'
          }`}
        >
          {error || message}
        </div>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading sessions…
        </p>
      ) : saved.length > 0 ? (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <div>
            Every week: <span className="font-semibold text-gray-900">{slotListLabel(saved)}</span>{' '}
            <span className="text-gray-400">(Pacific time)</span>
          </div>
          {schedule?.nextSession && (
            <div className="mt-1.5 text-gray-900">
              {schedule.nextSession.inProgress ? 'In progress now: ' : 'Next session: '}
              <span className="font-semibold">{schedule.nextSession.label}</span>
            </div>
          )}
        </div>
      ) : (
        !error && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You haven&apos;t picked your {DEEP_WORK_SLOTS_PER_WEEK} weekly Deep Work sessions yet.
          </div>
        )
      )}

      {!loading && !open && !error && (
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold border border-electric-blue text-electric-blue hover:bg-blue-50"
        >
          {saved.length > 0 ? 'Change sessions' : 'Pick sessions'}
        </button>
      )}

      {!loading && open && (
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Choose {DEEP_WORK_SLOTS_PER_WEEK} sessions{' '}
            <span className="font-normal text-gray-500">
              ({selected.length} of {DEEP_WORK_SLOTS_PER_WEEK} picked, all times Pacific)
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {DEEP_WORK_SLOTS.map((slot) => {
              const isSelected = selected.includes(slot.key);
              const disabled = !isSelected && selected.length >= DEEP_WORK_SLOTS_PER_WEEK;
              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => toggle(slot.key)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={`text-left rounded-lg border-2 p-4 transition-colors ${
                    isSelected
                      ? 'border-electric-blue bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-electric-blue'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-900">{DAY_LABELS[slot.dayOfWeek]}</span>
                    {isSelected && <Check className="w-5 h-5 text-electric-blue" />}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{slotTimeRange(slot)}</div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || selected.length !== DEEP_WORK_SLOTS_PER_WEEK || unchanged}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold bg-electric-blue text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save sessions
            </button>
            {saved.length > 0 && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

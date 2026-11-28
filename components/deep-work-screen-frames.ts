/**
 * Browser-only helpers for screen checks: grab a small frame from the student's own
 * screen-share track, and tile the last few frames into one labelled contact sheet.
 * Frames live only in memory and are dropped after each check.
 */

export const FRAME_WIDTH = 640;
export const FRAME_HEIGHT = 360;
const SHEET_COLUMNS = 3;

export type CapturedFrame = { canvas: HTMLCanvasElement; capturedAt: Date };

type ImageCaptureLike = { grabFrame(): Promise<ImageBitmap> };
type ImageCaptureCtor = new (track: MediaStreamTrack) => ImageCaptureLike;

/** Draw a source into a FRAME_WIDTH x FRAME_HEIGHT canvas, letterboxed. */
function toFrameCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement | null {
  if (!width || !height) return null;
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_WIDTH;
  canvas.height = FRAME_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
  const scale = Math.min(FRAME_WIDTH / width, FRAME_HEIGHT / height);
  const w = width * scale;
  const h = height * scale;
  ctx.drawImage(source, (FRAME_WIDTH - w) / 2, (FRAME_HEIGHT - h) / 2, w, h);
  return canvas;
}

/**
 * One frame from the screen-share track. ImageCapture (Chrome, Edge) keeps working while
 * the tab is in the background; other browsers fall back to the preview <video>.
 */
export async function captureFrame(
  track: MediaStreamTrack | null | undefined,
  video: HTMLVideoElement | null
): Promise<CapturedFrame | null> {
  const capturedAt = new Date();
  const ImageCapture = (globalThis as unknown as { ImageCapture?: ImageCaptureCtor }).ImageCapture;
  if (track && track.readyState === 'live' && ImageCapture) {
    try {
      const bitmap = await new ImageCapture(track).grabFrame();
      const canvas = toFrameCanvas(bitmap, bitmap.width, bitmap.height);
      bitmap.close();
      if (canvas) return { canvas, capturedAt };
    } catch {
      // fall through to the <video> element
    }
  }
  if (video && video.readyState >= 2) {
    const canvas = toFrameCanvas(video, video.videoWidth, video.videoHeight);
    if (canvas) return { canvas, capturedAt };
  }
  return null;
}

function timeLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** Tile frames left to right, top to bottom, each labelled with its time; returns a JPEG data URL. */
export function buildContactSheet(frames: CapturedFrame[]): string | null {
  if (frames.length === 0) return null;
  const columns = Math.min(SHEET_COLUMNS, frames.length);
  const rows = Math.ceil(frames.length / SHEET_COLUMNS);
  const sheet = document.createElement('canvas');
  sheet.width = columns * FRAME_WIDTH;
  sheet.height = rows * FRAME_HEIGHT;
  const ctx = sheet.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  frames.forEach((frame, i) => {
    const x = (i % SHEET_COLUMNS) * FRAME_WIDTH;
    const y = Math.floor(i / SHEET_COLUMNS) * FRAME_HEIGHT;
    ctx.drawImage(frame.canvas, x, y);
    const label = `${i + 1} · ${timeLabel(frame.capturedAt)}`;
    ctx.font = 'bold 20px sans-serif';
    const width = ctx.measureText(label).width + 16;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x + 8, y + 8, width, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + 16, y + 30);
  });
  return sheet.toDataURL('image/jpeg', 0.7);
}

/**
 * A short alert, synthesized with Web Audio so there's no sound file to ship.
 * Browsers only let a page play sound after a click, so call unlockAlertSound() from a
 * click handler (Share screen) first; later alerts then play even with the tab in the background.
 */
let alertContext: AudioContext | null = null;

export function unlockAlertSound(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    alertContext ??= new Ctx();
    void alertContext.resume();
  } catch {
    // no audio available: alerts stay silent
  }
}

/** One brass-like note: two detuned sawtooth waves through a filter that opens on the attack. */
function trumpetNote(ctx: AudioContext, frequency: number, t: number, length: number): void {
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(0.28, t + 0.03);
  out.gain.setValueAtTime(0.24, t + Math.max(0.05, length - 0.06));
  out.gain.exponentialRampToValueAtTime(0.0001, t + length);

  // Brass gets brighter as it's blown harder: sweep the filter open, then settle.
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 1.5;
  filter.frequency.setValueAtTime(frequency * 1.5, t);
  filter.frequency.exponentialRampToValueAtTime(frequency * 6, t + 0.05);
  filter.frequency.exponentialRampToValueAtTime(frequency * 4, t + length);
  filter.connect(out).connect(ctx.destination);

  // A little vibrato on longer notes.
  const vibrato = ctx.createOscillator();
  const vibratoDepth = ctx.createGain();
  vibrato.frequency.value = 5.5;
  vibratoDepth.gain.value = length > 0.3 ? frequency * 0.006 : 0;

  for (const detune of [-6, 6]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = frequency;
    osc.detune.value = detune;
    vibrato.connect(vibratoDepth).connect(osc.frequency);
    osc.connect(filter);
    osc.start(t);
    osc.stop(t + length + 0.02);
  }
  vibrato.start(t);
  vibrato.stop(t + length + 0.02);
}

export function playAlertChime(): void {
  const ctx = alertContext;
  if (!ctx) return;
  void ctx.resume();
  // A short, upbeat trumpet fanfare: G4, C5, E5, then a held G5 ("ta-ta-ta-taaa").
  const start = ctx.currentTime + 0.05;
  const notes: [number, number][] = [
    [392.0, 0.13],
    [523.25, 0.13],
    [659.25, 0.13],
    [783.99, 0.55],
  ];
  let t = start;
  for (const [frequency, length] of notes) {
    trumpetNote(ctx, frequency, t, length);
    t += length + 0.03;
  }
}

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

export function playAlertChime(): void {
  const ctx = alertContext;
  if (!ctx) return;
  void ctx.resume();
  // An alarm-clock style alert: two bursts of four sharp beeps, alternating pitch.
  // Square waves cut through background noise far better than the earlier sine chime.
  const start = ctx.currentTime + 0.05;
  const beep = 0.11;
  const gap = 0.06;
  const burstGap = 0.35;
  const frequencies = [1046, 1318, 1046, 1318];
  for (let burst = 0; burst < 2; burst++) {
    frequencies.forEach((frequency, i) => {
      const t = start + burst * (frequencies.length * (beep + gap) + burstGap) + i * (beep + gap);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
      gain.gain.setValueAtTime(0.35, t + beep - 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + beep);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + beep + 0.02);
    });
  }
}

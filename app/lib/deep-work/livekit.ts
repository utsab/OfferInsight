import { AccessToken, TrackSource } from 'livekit-server-sdk';

export type LivekitConfig = { url: string; apiKey: string; apiSecret: string };

/** LiveKit settings from env, or null when any of them is missing. */
export function livekitConfig(env: NodeJS.ProcessEnv = process.env): LivekitConfig | null {
  const url = env.LIVEKIT_URL?.trim();
  const apiKey = env.LIVEKIT_API_KEY?.trim();
  const apiSecret = env.LIVEKIT_API_SECRET?.trim();
  if (!url || !apiKey || !apiSecret) return null;
  return { url, apiKey, apiSecret };
}

/**
 * A token that lets one student into their session's room and publish only a screen
 * share (no camera or microphone in v1). It expires 30 minutes after the session's end.
 */
export async function createRoomToken(
  config: LivekitConfig,
  params: { room: string; identity: string; name: string | null; scheduledEnd: Date },
  now = new Date()
): Promise<string> {
  const secondsLeft = Math.floor((params.scheduledEnd.getTime() - now.getTime()) / 1000);
  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity: params.identity,
    name: params.name ?? undefined,
    ttl: Math.max(secondsLeft, 0) + 30 * 60,
  });
  token.addGrant({
    roomJoin: true,
    room: params.room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: false,
    canPublishSources: [TrackSource.SCREEN_SHARE],
  });
  return token.toJwt();
}

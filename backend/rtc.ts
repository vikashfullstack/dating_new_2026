import crypto from 'node:crypto';
import dotenv from 'dotenv';

// Server-only generated credentials; deployed environment variables take precedence.
dotenv.config({ path: '.turn/backend.env', quiet: true });

export function rtcConfiguration(userId: string, env: NodeJS.ProcessEnv = process.env, now = Date.now()) {
  const iceServers: { urls: string | string[]; username?: string; credential?: string }[] = [
    { urls: 'stun:stun.l.google.com:19302' },
  ];
  const urls = (env.TURN_URLS || '').split(',').map(url => url.trim()).filter(Boolean);
  if (urls.length) {
    if (urls.some(url => !/^turns?:[^\s]+$/i.test(url))) throw new Error('Invalid TURN_URLS');
    if (!env.TURN_SHARED_SECRET) throw new Error('TURN_SHARED_SECRET is required');
    const expires = Math.floor(now / 1000) + 3600;
    const username = `${expires}:${userId}`;
    const credential = crypto.createHmac('sha1', env.TURN_SHARED_SECRET).update(username).digest('base64');
    iceServers.push({ urls, username, credential });
  }
  return { iceServers, relayConfigured: urls.length > 0 };
}

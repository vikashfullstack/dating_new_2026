// Vite embeds this public URL when the frontend is built.
const backendUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export function apiUrl(path: string): string {
  return `${backendUrl}${path}`;
}

export function websocketUrl(): string {
  const url = new URL(apiUrl('/ws'), window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

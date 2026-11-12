import { apiUrl } from './api';

export async function loadRtcConfiguration(): Promise<RTCConfiguration> {
  const response = await fetch(apiUrl('/api/rtc/config'), {
    headers: { Authorization: `Bearer ${localStorage.getItem('cipherdate_session_token')}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  if (response.ok) {
    const config = await response.json();
    if (!Array.isArray(config.iceServers) || !config.iceServers.length) throw new Error('Call connection settings are unavailable. Please try again.');
    return { iceServers: config.iceServers };
  }
  // Keep older deployments compatible while the backend is upgraded.
  if (response.status !== 404) throw new Error('Call connection settings are unavailable. Please try again.');
  const configured = import.meta.env.VITE_RTC_ICE_SERVERS;
  return { iceServers: configured ? JSON.parse(configured) : [{ urls: 'stun:stun.l.google.com:19302' }] };
}


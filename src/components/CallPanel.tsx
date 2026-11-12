import { loadRtcConfiguration } from '../services/rtc';
import { OutgoingIceQueue } from '../services/iceSignaling';
import React, { useEffect, useRef, useState } from 'react';
import { SingleProfile, UserCurrentProfile } from '../types';
import { notificationSounds } from '../services/notificationSounds';
import { wsService, SignalEvent } from '../services/websocketService';

export function CallPanel({ currentUser, profiles }: { currentUser: UserCurrentProfile; profiles: SingleProfile[] }) {
  const [call, setCall] = useState<{ id: string; peer: string; name: string; type: 'audio' | 'video'; status: string } | null>(null);
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const state = useRef(call); state.current = call;
  const pc = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const remote = useRef<HTMLVideoElement>(null);
  const local = useRef<HTMLVideoElement>(null);
  const profileRef = useRef(profiles); profileRef.current = profiles;
  const offer = useRef<SignalEvent | null>(null);
  const candidates = useRef<RTCIceCandidateInit[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const outgoingIce = useRef<OutgoingIceQueue | null>(null);
  const initiated = useRef(false);
  const retried = useRef(false);

  function signal(type: string, extra: Partial<SignalEvent> = {}) {
    const c = state.current;
    if (c) wsService.sendSignal({ type, senderId: currentUser.id, recipientId: c.peer, chatId: c.id, ...extra });
  }
  function end(notify = true) {
    if (notify) signal('signal:call-hangup');
    notificationSounds.stopRinging();
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
    if (pc.current) { pc.current.onconnectionstatechange = null; pc.current.close(); }
    pc.current = null; outgoingIce.current?.reset(); outgoingIce.current = null; retried.current = false; initiated.current = false;
    stream.current?.getTracks().forEach(t => t.stop()); stream.current = null;
    remoteStream.current = null; candidates.current = []; offer.current = null;
    state.current = null; setCall(null); setMuted(false); setVideoOff(false);
  }
  function fail(e: unknown) {
    setError(e instanceof Error ? e.message : 'Call failed. Please try again.'); end();
  }
  function armTimeout() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fail(new Error('Call was not answered or could not connect.')), 45000);
  }
  async function prepare() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Calls require HTTPS and microphone/camera access.');
    const version = generation.current;
    const config = await loadRtcConfiguration();
    if (version !== generation.current || !state.current) return null;
    const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: state.current?.type === 'video' });
    if (version !== generation.current || !state.current) { media.getTracks().forEach(t => t.stop()); return null; }
    stream.current = media;
    const connection = new RTCPeerConnection(config); pc.current = connection;
    const iceQueue = new OutgoingIceQueue(candidate => {
      if (pc.current === connection) signal('signal:ice-candidate', { candidate });
    });
    outgoingIce.current = iceQueue;
    media.getTracks().forEach(track => connection.addTrack(track, media));
    if (local.current) local.current.srcObject = media;
    connection.onicecandidate = e => { if (e.candidate) iceQueue.add(e.candidate.toJSON()); };
    connection.ontrack = e => {
      if (pc.current !== connection) return;
      remoteStream.current = e.streams[0] || remoteStream.current || new MediaStream();
      if (!e.streams[0]) remoteStream.current.addTrack(e.track);
      if (remote.current) { remote.current.srcObject = remoteStream.current; void remote.current.play().catch(() => {}); }
    };
    connection.onconnectionstatechange = () => {
      if (pc.current !== connection) return;
      if (connection.connectionState === 'connected') {
        if (timer.current) clearTimeout(timer.current);
        setCall(c => c ? { ...c, status: 'Connected' } : c);
      } else if (connection.connectionState === 'failed') {
        if (initiated.current && !retried.current) {
          retried.current = true;
          setCall(c => c ? { ...c, status: 'Reconnecting…' } : c);
          armTimeout();
          iceQueue.reset();
          void (async () => {
            try {
              const restartOffer = await connection.createOffer({ iceRestart: true });
              if (pc.current !== connection) return;
              await connection.setLocalDescription(restartOffer);
              if (pc.current !== connection) return;
              signal('signal:call-offer', { callType: state.current?.type, sdp: connection.localDescription });
              iceQueue.descriptionSent();
            } catch (error) { if (pc.current === connection) fail(error); }
          })();
        } else if (initiated.current) {
          fail(new Error('Could not connect this call. The call relay may be unavailable. Please try again or switch networks.'));
          return;
        }
        if (!initiated.current) {
          setCall(c => c ? { ...c, status: 'Reconnecting…' } : c);
          armTimeout();
        }
        // The receiving peer waits for the caller's ICE restart offer.
      }
    };
    return connection;
  }
  async function accept() {
    const incoming = offer.current;
    if (!incoming) return;
    const version = generation.current;
    notificationSounds.stopRinging();
    setCall(c => c ? { ...c, status: 'Connecting…' } : c);
    try {
      const connection = await prepare(); if (!connection) return;
      await connection.setRemoteDescription(incoming.sdp);
      for (const candidate of candidates.current.splice(0)) await connection.addIceCandidate(candidate);
      await connection.setLocalDescription(await connection.createAnswer());
      if (pc.current !== connection) return;
      signal('signal:call-answer', { sdp: connection.localDescription });
      outgoingIce.current?.descriptionSent();
    } catch(e) { if (version === generation.current) fail(e); }
  }
  useEffect(() => {
    const start = async (event: Event) => {
      if (state.current) return;
      setError('');
      if (wsService.getStatus() !== 'connected') { setError('Calls are unavailable while chat is disconnected.'); return; }
      const { partner, type } = (event as CustomEvent).detail;
      const next = { id: `call_${crypto.randomUUID()}`, peer: partner.id, name: partner.name, type, status: 'Calling…' };
      initiated.current = true;
      state.current = next; setCall(next); armTimeout();
      const version = generation.current;
      try {
        const connection = await prepare(); if (!connection) return;
        await connection.setLocalDescription(await connection.createOffer());
        if (pc.current !== connection) return;
        signal('signal:call-offer', { callType: type, sdp: connection.localDescription });
        outgoingIce.current?.descriptionSent();
      } catch(e) { if (version === generation.current) fail(e); }
    };
    window.addEventListener('cipherdate:start-call', start);
    const unsubscribe = wsService.onSignal(async incoming => {
      if (!incoming.type.startsWith('signal:call-') && incoming.type !== 'signal:ice-candidate') return;
      if (incoming.recipientId !== currentUser.id) return;
      const version = generation.current;
      try {
        if (incoming.type === 'signal:call-offer') {
          if (state.current?.id === incoming.chatId && state.current?.peer === incoming.senderId && pc.current) {
            const connection = pc.current;
            outgoingIce.current?.reset();
            await connection.setRemoteDescription(incoming.sdp);
            for (const candidate of candidates.current.splice(0)) await connection.addIceCandidate(candidate);
            await connection.setLocalDescription(await connection.createAnswer());
            if (pc.current !== connection) return;
            signal('signal:call-answer', { sdp: connection.localDescription });
            outgoingIce.current?.descriptionSent();
            return;
          }
          if (state.current) {
            wsService.sendSignal({ type: 'signal:call-hangup', senderId: currentUser.id, recipientId: incoming.senderId, chatId: incoming.chatId }); return;
          }
          const next = { id: incoming.chatId!, peer: incoming.senderId!, name: profileRef.current.find(p => p.id === incoming.senderId)?.name || 'Incoming caller', type: incoming.callType || 'audio', status: 'Incoming call' };
          state.current = next; setCall(next); setError(''); offer.current = incoming; armTimeout();
          notificationSounds.startRinging();
          // Keep candidates queued until the receiver accepts and installs SDP.
        } else if (incoming.chatId === state.current?.id && incoming.senderId === state.current?.peer) {
          if (incoming.type === 'signal:call-hangup') end(false);
          if (incoming.type === 'signal:call-answer' && pc.current) {
            const connection = pc.current;
            await connection.setRemoteDescription(incoming.sdp);
            if (pc.current !== connection) return;
            for (const candidate of candidates.current.splice(0)) await connection.addIceCandidate(candidate);
          }
          if (incoming.type === 'signal:ice-candidate' && incoming.candidate) {
            if (pc.current?.remoteDescription) await pc.current.addIceCandidate(incoming.candidate);
            else candidates.current.push(incoming.candidate);
          }
        }
      } catch(e) { if (version === generation.current) fail(e); }
    });
    return () => { window.removeEventListener('cipherdate:start-call', start); unsubscribe(); end(); };
  }, [currentUser.id]);
  useEffect(() => {
    if (local.current) local.current.srcObject = stream.current;
    if (remote.current) remote.current.srcObject = remoteStream.current;
  }, [call?.id]);
  return <>
    {error && <div role="alert" className="fixed bottom-24 left-4 right-4 z-50 bg-slate-900 border border-rose-500 p-4 rounded-xl">{error}<button className="ml-4 underline" onClick={()=>setError('')}>Dismiss</button></div>}
    {call && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"><div role="dialog" aria-label="Call" className="bg-slate-900 p-6 rounded-2xl space-y-4 w-full max-w-lg">
      <h2>{call.name} · {call.type} call</h2>
      {call.status === 'Incoming call' && !notificationSounds.isEnabled() && <button className="underline text-emerald-300" onClick={()=>{ void notificationSounds.enable().catch(e=>setError(e.message)); }}>Enable ringtone</button>}<p role="status">{call.status}</p>
      <video ref={remote} autoPlay playsInline controls className={call.type === 'video' ? 'w-full rounded-xl' : 'h-12 w-full'} />
      {call.type === 'video' && <video ref={local} autoPlay muted playsInline className="w-32 rounded-xl" />}
      <div className="flex flex-wrap gap-3">
        {call.status === 'Incoming call' ? <button className="bg-emerald-600 p-3 rounded" onClick={accept}>Accept</button> : <>
          <button onClick={()=>{stream.current?.getAudioTracks().forEach(t=>t.enabled=muted);setMuted(!muted);}}>{muted ? 'Unmute' : 'Mute'}</button>
          {call.type === 'video' && <button onClick={()=>{stream.current?.getVideoTracks().forEach(t=>t.enabled=videoOff);setVideoOff(!videoOff);}}>{videoOff ? 'Camera on' : 'Camera off'}</button>}
        </>}
        <button className="bg-rose-600 p-3 rounded" onClick={()=>end()}>{call.status === 'Incoming call' ? 'Decline' : 'End call'}</button>
      </div>
    </div></div>}
  </>;
}

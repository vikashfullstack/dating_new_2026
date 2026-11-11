import React, { useState, useSyncExternalStore } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { notificationSounds } from '../services/notificationSounds';

export function SoundAlerts() {
  const enabled = useSyncExternalStore(notificationSounds.subscribe, notificationSounds.isEnabled, () => false);
  const [error, setError] = useState('');
  return <div className="border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs flex flex-wrap justify-center items-center gap-3">
    <span>{enabled ? 'Message sounds and incoming-call ringing are on.' : 'Enable sounds to hear new messages and incoming calls while this site is open.'}</span>
    <button type="button" aria-pressed={enabled} className="flex items-center gap-1 rounded-lg px-3 py-1.5 bg-slate-800 text-emerald-300" onClick={async () => {
      setError('');
      if (enabled) notificationSounds.disable();
      else try { await notificationSounds.enable(); } catch(e) { setError(e instanceof Error ? e.message : 'Could not enable sounds.'); }
    }}>{enabled ? <VolumeX size={14}/> : <Volume2 size={14}/>} {enabled ? 'Mute alerts' : 'Enable sounds'}</button>
    {error && <span role="alert" className="text-rose-300">{error}</span>}
  </div>;
}

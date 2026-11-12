import React, { useRef, useState } from 'react';
import { Camera, Video, Trash2 } from 'lucide-react';
import { UserCurrentProfile } from '../types';
import { PHOTO_TYPES, VIDEO_TYPES, PHOTO_BYTES, VIDEO_BYTES, PHOTO_LIMIT, VIDEO_LIMIT, validateProfileMedia, readMediaFile } from '../utils/profileMedia';

interface Props {
  currentUser: UserCurrentProfile;
  onUpdateProfile: (updated: Partial<UserCurrentProfile>) => Promise<boolean>;
  isLoggedIn?: boolean;
}

export function ProfileMediaEditor({ currentUser, onUpdateProfile, isLoggedIn }: Props) {
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const photos = currentUser.photos;
  const videos = currentUser.videos || [];

  async function save(nextPhotos: string[], nextVideos: string[]) {
    const invalid = validateProfileMedia(nextPhotos, nextVideos);
    if (invalid) throw new Error(invalid);
    if (!await onUpdateProfile({ photos: nextPhotos, videos: nextVideos })) throw new Error('Media could not be saved. Please try again.');
    setMessage('Profile media saved.');
  }

  async function run(action: () => Promise<void>) {
    if (busy.current || !isLoggedIn) return;
    busy.current = true;
    setSaving(true); setError(''); setMessage('');
    try { await action(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update media.'); }
    finally { busy.current = false; setSaving(false); }
  }

  function upload(event: React.ChangeEvent<HTMLInputElement>, kind: 'photo' | 'video') {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    void run(async () => {
      const isPhoto = kind === 'photo';
      const existing = isPhoto ? photos : videos;
      if (existing.length + files.length > (isPhoto ? PHOTO_LIMIT : VIDEO_LIMIT)) throw new Error(isPhoto ? 'You can add up to 8 photos.' : 'You can add up to 3 videos.');
      for (const file of files) {
        if (!(isPhoto ? PHOTO_TYPES : VIDEO_TYPES).includes(file.type)) throw new Error(`Unsupported file: ${file.name}. Choose ${isPhoto ? 'JPG, PNG, WebP or GIF' : 'MP4, WebM or MOV'}.`);
        if (!file.size || file.size > (isPhoto ? PHOTO_BYTES : VIDEO_BYTES)) throw new Error(`${file.name} must be ${isPhoto ? 'under 2 MB' : 'under 8 MB'} and cannot be empty.`);
      }
      const sources = await Promise.all(files.map(readMediaFile));
      await save(isPhoto ? [...photos, ...sources] : photos, isPhoto ? videos : [...videos, ...sources]);
    });
  }

  const disabled = saving || !isLoggedIn;
  return (
    <section id="profile-media" aria-labelledby="profile-media-title" aria-busy={saving} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 scroll-mt-24">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h2 id="profile-media-title" className="text-lg font-bold text-white font-display">Your photos & videos</h2>
          <p className="text-xs text-slate-400 mt-1">Share more of you. Your first photo is your profile cover.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={disabled || photos.length >= PHOTO_LIMIT} onClick={() => photoInput.current?.click()} className="rounded-xl px-4 py-2 text-xs font-semibold text-emerald-400 flex items-center gap-2"><Camera className="w-4 h-4" />Add photos</button>
          <button type="button" disabled={disabled || videos.length >= VIDEO_LIMIT} onClick={() => videoInput.current?.click()} className="rounded-xl px-4 py-2 text-xs font-semibold text-emerald-400 flex items-center gap-2"><Video className="w-4 h-4" />Add videos</button>
        </div>
      </div>
      <input ref={photoInput} type="file" multiple accept={PHOTO_TYPES.join(',')} aria-label="Upload profile photos" className="hidden" onChange={e => upload(e, 'photo')} />
      <input ref={videoInput} type="file" multiple accept={VIDEO_TYPES.join(',')} aria-label="Upload profile videos" className="hidden" onChange={e => upload(e, 'video')} />
      <p className="text-xs text-slate-400">{photos.length}/8 photos · {videos.length}/3 videos. Photos: up to 2 MB each. Videos: up to 8 MB each. Total: 20 MB.</p>
      {!isLoggedIn && <p className="text-xs text-rose-400">Sign in to add and manage your profile media.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {photos.map((source, index) => (
          <div key={`${index}-${source.slice(-24)}`} className="relative rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
            <img src={source} alt={`Your profile photo ${index + 1}`} className="w-full aspect-square object-cover" />
            <div className="absolute bottom-2 left-2 right-2 flex items-center pointer-events-none">
              {index === 0 ? <span className="media-cover-badge rounded-lg px-2 py-1.5 text-[11px] font-semibold">Cover photo</span> : <button type="button" disabled={disabled} onClick={() => void run(() => save([source, ...photos.filter((_, i) => i !== index)], videos))} className="media-overlay-control pointer-events-auto rounded-lg px-2 py-1.5 text-[11px] font-semibold">Make cover</button>}
            </div>
            <button type="button" disabled={disabled || photos.length === 1} aria-label={`Remove photo ${index + 1}`} title={photos.length === 1 ? 'Keep at least one profile photo' : 'Remove photo'} onClick={() => void run(() => save(photos.filter((_, i) => i !== index), videos))} className="media-overlay-control absolute top-2 right-2 rounded-lg w-10 h-10 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {videos.map((source, index) => (
          <div key={`${index}-${source.slice(-24)}`} className="relative rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
            <video src={source} controls playsInline preload="metadata" aria-label={`Your profile video ${index + 1}`} className="w-full aspect-square object-contain" />
            <button type="button" disabled={disabled} aria-label={`Remove video ${index + 1}`} onClick={() => void run(() => save(photos, videos.filter((_, i) => i !== index)))} className="media-overlay-control absolute top-2 right-2 rounded-lg w-10 h-10 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      {saving && <p role="status" className="text-xs text-slate-400">Saving media…</p>}
      {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
      {message && <p role="status" className="text-xs text-emerald-400">{message}</p>}
    </section>
  );
}

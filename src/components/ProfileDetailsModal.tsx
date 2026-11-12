import React, { useState } from 'react';
import { X, ShieldCheck, MapPin, Briefcase, GraduationCap, Heart, MessageSquare, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { SingleProfile } from '../types';

interface ProfileDetailsModalProps {
  profile: SingleProfile | null;
  onClose: () => void;
  onLike: (profile: SingleProfile) => void;
  onStartChat: (profile: SingleProfile) => void;
  isLiked?: boolean;
  onTagClick?: (tag: string) => void;
}

export const ProfileDetailsModal: React.FC<ProfileDetailsModalProps> = ({
  profile,
  onClose,
  onLike,
  onStartChat,
  isLiked,
  onTagClick,
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!profile) return null;

  const normalizeTag = (tag: string) => (tag.startsWith('#') ? tag : `#${tag}`);

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % profile.photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-100 flex flex-col my-auto max-h-[calc(100dvh-2rem)]">
        
        {/* Top bar with close */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">{profile.name}, {profile.age}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">Locality: {profile.locality || profile.neighborhood}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-400">{(profile.distanceKm || profile.distanceMiles * 1.6).toFixed(1)} km away</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto">
          {/* Photo Gallery with Carousel */}
          <div className="relative w-full h-80 sm:h-96 bg-slate-950 overflow-hidden group">
            <img
              src={profile.photos[photoIndex]}
              alt={`${profile.name} - photo ${photoIndex + 1}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            
            {/* Scrim overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

            {/* Photo indicators */}
            {profile.photos.length > 1 && (
              <>
                <div className="absolute top-3 left-4 right-4 flex gap-1.5">
                  {profile.photos.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full flex-1 transition-all ${
                        idx === photoIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Bottom info on photo */}
            <div className="photo-caption absolute bottom-4 left-6 right-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white font-display">
                  {profile.name}, {profile.age}
                </h2>
                <div 
                  className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40"
                  title="Cryptographically Authenticated Identity"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-sm text-slate-300 mt-0.5">{profile.tagline}</p>
            </div>
          </div>

          {Boolean(profile.videos?.length) && (
            <section aria-label={`${profile.name}'s videos`} className="p-6 space-y-3">
              <h3 className="text-base font-bold text-white font-display">Videos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.videos?.map((source, index) => (
                  <video key={`${profile.id}-${index}`} src={source} controls playsInline preload="metadata" aria-label={`${profile.name}'s video ${index + 1}`} className="w-full aspect-video rounded-xl bg-slate-950 object-contain" />
                ))}
              </div>
            </section>
          )}

          {/* Detailed Content */}
          <div className="p-6 space-y-6">

            {/* Quick stats & intent */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400 border-b border-slate-800 pb-4">
              <span className="flex items-center gap-1.5 text-slate-200">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Locality: <strong className="text-white">{profile.locality || profile.neighborhood}</strong> ({(profile.distanceKm || profile.distanceMiles * 1.6).toFixed(1)} km)</span>
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Briefcase className="w-4 h-4 text-slate-500" />
                {profile.occupation} {profile.companyOrStudio ? `at ${profile.companyOrStudio}` : ''}
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <GraduationCap className="w-4 h-4 text-slate-500" />
                {profile.education}
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="text-emerald-400 font-medium">Looking for: {profile.intent}</span>
            </div>

            {/* Bio Section */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-display">
                About {profile.name}
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                {profile.bio}
              </p>
            </div>

            {/* Passions & Interests (Interactive Hashtag Tags) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-display">
                  Passions & Hobby Tags
                </h3>
                <span className="text-[11px] text-slate-500">tap tag to filter Discovery</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {profile.passions.map((passion) => {
                  const tag = normalizeTag(passion);
                  return (
                    <button
                      key={passion}
                      type="button"
                      onClick={() => {
                        onTagClick?.(tag);
                        onClose();
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800/90 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-500/50 font-medium transition-all active:scale-95 flex items-center gap-1"
                      title={`Filter all local singles with ${tag}`}
                    >
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lifestyle */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-display">
                Lifestyle & Rhythms
              </h3>
              <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                {profile.lifestyle.map((item, idx) => (
                  <React.Fragment key={item}>
                    <span className="text-slate-300">{item}</span>
                    {idx < profile.lifestyle.length - 1 && <span aria-hidden="true" className="text-slate-700">/</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Cryptographic Proof Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-display">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Tamper-Proof Identity Certificate</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400/90 font-medium">
                  Trust Score: {profile.verification.trustScore}%
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {profile.name} completed real-time 3D facial liveness biometric scanning and official government documentation verification. Zero-knowledge cryptography ensures true human authenticity without exposing private documents.
              </p>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-500 block">ZK-Proof Certificate:</span>
                  <span className="text-slate-300 truncate block">{profile.verification.zkProofToken}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">SHA-256 ID Digest:</span>
                  <span className="text-slate-300 truncate block">{profile.verification.hash}</span>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-4 sticky bottom-0">
          <button
            onClick={() => onLike(profile)}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              isLiked
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-400 text-rose-400' : 'text-slate-300'}`} />
            {isLiked ? 'Matched & Liked' : 'Like Profile'}
          </button>

          <button
            onClick={() => {
              onStartChat(profile);
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            <MessageSquare className="w-4 h-4" />
            Start Chat
          </button>
        </div>

      </div>
    </div>
  );
};

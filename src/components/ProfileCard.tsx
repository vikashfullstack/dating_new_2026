import React from 'react';
import { ShieldCheck, MapPin, Heart, X, MessageSquare, Info, Sparkles, Hash } from 'lucide-react';
import { SingleProfile } from '../types';

interface ProfileCardProps {
  profile: SingleProfile;
  onLike: (profile: SingleProfile) => void;
  onPass?: (profile: SingleProfile) => void;
  onOpenDetails: (profile: SingleProfile) => void;
  onStartChat: (profile: SingleProfile) => void;
  isLiked?: boolean;
  variant?: 'grid' | 'deck';
  selectedInterestTags?: string[];
  onTagClick?: (tag: string) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onLike,
  onPass,
  onOpenDetails,
  onStartChat,
  isLiked,
  variant = 'grid',
  selectedInterestTags = [],
  onTagClick,
}) => {
  const normalizeTag = (tag: string) => (tag.startsWith('#') ? tag : `#${tag}`);

  return (
    <div
      onClick={() => onOpenDetails(profile)}
      className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Photo Container */}
      <div className={`relative w-full ${variant === 'deck' ? 'h-96' : 'h-72'} overflow-hidden bg-slate-950`}>
        <img
          src={profile.photos[0]}
          alt={profile.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/20 pointer-events-none" />

        {/* Top Badges (Floating subtle trust indicator) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Identity Verification Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">ZK Verified</span>
          </div>

          {/* Compatibility score */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-slate-200 text-xs font-medium font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{profile.matchCompatibility}% Match</span>
          </div>
        </div>

        {/* Bottom Info on Image */}
        <div className="photo-caption absolute bottom-3 left-4 right-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-white font-display flex items-center gap-1.5">
              <span>{profile.name}</span>
              <span className="text-slate-300 font-normal text-lg">{profile.age}</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-medium">
              {(profile.distanceKm || profile.distanceMiles * 1.6).toFixed(1)} km
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium text-slate-200">{profile.locality || profile.neighborhood}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-slate-900">
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {profile.tagline || profile.bio}
        </p>

        {/* Interactive Interest Tags (Hobbies) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3 text-emerald-400" />
              <span>Interests & Hobbies</span>
            </span>
            <span className="text-[10px] text-slate-500 normal-case">tap tag to filter</span>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {profile.passions.slice(0, 4).map((rawTag) => {
              const formattedTag = normalizeTag(rawTag);
              const isSelected = selectedInterestTags.some(
                (t) => normalizeTag(t).toLowerCase() === formattedTag.toLowerCase()
              );

              return (
                <button
                  key={rawTag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(formattedTag);
                  }}
                  className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                      : 'bg-slate-800/90 hover:bg-emerald-500/15 text-slate-300 hover:text-emerald-300 border-slate-700/60 hover:border-emerald-500/40'
                  }`}
                  title={`Filter local singles with ${formattedTag}`}
                >
                  {formattedTag}
                </button>
              );
            })}
            {profile.passions.length > 4 && (
              <span className="px-1.5 py-0.5 text-slate-400 text-[11px] self-center">
                +{profile.passions.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Strip */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          {onPass && (
            <button
              onClick={() => onPass(profile)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors"
              title="Pass"
              aria-label="Pass on profile"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onOpenDetails(profile)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/50 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>View Profile</span>
          </button>

          <button
            onClick={() => onStartChat(profile)}
            className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
            title="Start Chat"
            aria-label="Start chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => onLike(profile)}
            className={`p-2.5 rounded-xl transition-all border ${
              isLiked
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-slate-800/80 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border-slate-700/50 hover:border-rose-500/30'
            }`}
            title="Like Profile"
            aria-label="Like profile"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

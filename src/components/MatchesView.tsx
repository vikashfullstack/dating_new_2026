import React from 'react';
import { Heart, MessageSquare, ShieldCheck, MapPin, Sparkles, Compass } from 'lucide-react';
import { SingleProfile } from '../types';

interface MatchesViewProps {
  likedProfiles: SingleProfile[];
  onStartChat: (profile: SingleProfile) => void;
  onOpenDetails: (profile: SingleProfile) => void;
  onNavigateToDiscover: () => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  likedProfiles,
  onStartChat,
  onOpenDetails,
  onNavigateToDiscover,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono mb-1">
            <Heart className="w-4 h-4 fill-emerald-400 text-emerald-400" />
            <span>MUTUAL CHEMISTRY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
            Your Local Matches ({likedProfiles.length})
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Singles in your neighborhood with mutual interest and cryptographically authenticated identity.
          </p>
        </div>

        <button
          onClick={onNavigateToDiscover}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-2 self-start sm:self-center border border-slate-700/60"
        >
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>Discover More Singles</span>
        </button>
      </div>

      {/* Grid of Matches */}
      {likedProfiles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7 text-rose-400/60" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">No Mutual Matches Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Start liking local verified singles in your area. As soon as there's a mutual connection, they will appear here ready for end-to-end encrypted messaging.
          </p>
          <button
            onClick={onNavigateToDiscover}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
          >
            Start Exploring Profiles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {likedProfiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => onOpenDetails(profile)}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col cursor-pointer group"
            >
              <div className="relative h-64 overflow-hidden bg-slate-950">
                <img
                  src={profile.photos[0]}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30 pointer-events-none" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ZK Verified</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-slate-200 text-[11px] font-mono">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{profile.matchCompatibility}%</span>
                  </div>
                </div>

                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-xl font-bold text-white font-display">
                    {profile.name}, {profile.age}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{profile.locality || profile.neighborhood} · {profile.distanceKm !== undefined ? `${profile.distanceKm.toFixed(1)} km` : `${profile.distanceMiles.toFixed(1)} km`}</span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">· Locality Only</span>
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-slate-900">
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {profile.tagline || profile.bio}
                </p>

                {/* Interest Tags */}
                {profile.passions && profile.passions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.passions.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                      >
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                    {profile.passions.length > 3 && (
                      <span className="text-[10px] font-mono text-slate-500 py-0.5">
                        +{profile.passions.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onOpenDetails(profile)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => onStartChat(profile)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat (E2EE)</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

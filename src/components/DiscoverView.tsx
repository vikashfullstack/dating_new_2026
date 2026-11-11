import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  SlidersHorizontal, 
  ShieldCheck, 
  LocateFixed, 
  Sparkles, 
  Filter, 
  Search, 
  Hash, 
  X, 
  Check, 
  Tag
} from 'lucide-react';
import { SingleProfile, UserCurrentProfile } from '../types';
import { ProfileCard } from './ProfileCard';
import { JAMSHEDPUR_LOCALITIES, findNearestLocality, calculateDistanceKm } from '../data/mockProfiles';

interface DiscoverViewProps {
  currentUser: UserCurrentProfile;
  profiles: SingleProfile[];
  likedProfileIds: string[];
  onLike: (profile: SingleProfile) => void;
  onPass: (profile: SingleProfile) => void;
  onOpenDetails: (profile: SingleProfile) => void;
  onStartChat: (profile: SingleProfile) => void;
  onLocationChange: (neighborhood: string, city: string) => void;
  initialSelectedTag?: string | null;
  onClearInitialTag?: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  currentUser,
  profiles,
  likedProfileIds,
  onLike,
  onPass,
  onOpenDetails,
  onStartChat,
  onLocationChange,
  initialSelectedTag,
  onClearInitialTag,
}) => {
  const [maxDistance, setMaxDistance] = useState<number>(currentUser.maxDistanceRadiusKm || 25);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(true);
  const [selectedIntent, setSelectedIntent] = useState<string>('all');
  const [selectedLocalityFilter, setSelectedLocalityFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialSelectedTag ? [initialSelectedTag] : []
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'deck'>('grid');
  const [deckIndex, setDeckIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Sync if initialSelectedTag arrives from ProfileView
  React.useEffect(() => {
    if (initialSelectedTag && !selectedTags.includes(initialSelectedTag)) {
      setSelectedTags((prev) => [...prev, initialSelectedTag]);
    }
  }, [initialSelectedTag]);

  const normalizeTag = (tag: string) => (tag.startsWith('#') ? tag : `#${tag}`);

  // Extract all unique interest tags across all local profiles and tally their counts
  const popularInterestTags = useMemo(() => {
    const countMap: Record<string, number> = {};
    profiles.forEach((p) => {
      p.passions.forEach((passion) => {
        const norm = normalizeTag(passion);
        countMap[norm] = (countMap[norm] || 0) + 1;
      });
    });

    return Object.entries(countMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [profiles]);

  // Toggle selection of an interest tag
  const handleToggleTag = (tag: string) => {
    const normalized = normalizeTag(tag);
    setSelectedTags((prev) =>
      prev.includes(normalized) ? prev.filter((t) => t !== normalized) : [...prev, normalized]
    );
  };

  const handleClearAllTags = () => {
    setSelectedTags([]);
    setSearchQuery('');
    setSelectedLocalityFilter('all');
    onClearInitialTag?.();
  };

  // Filter profiles based on distance radius, locality filter, verified status, intent, search query, and hobby tags
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // 1. Specific Locality Filter (if selected)
      if (selectedLocalityFilter !== 'all') {
        const pLoc = (p.locality || p.neighborhood || '').toLowerCase();
        if (pLoc !== selectedLocalityFilter.toLowerCase()) return false;
      }

      // 2. Distance filter in Kilometers
      const pDistKm = p.distanceKm || (p.distanceMiles * 1.6);
      if (pDistKm > maxDistance) return false;

      // 3. Verified status filter
      if (verifiedOnly && p.verification.status !== 'verified') return false;

      // 4. Intent filter
      if (selectedIntent !== 'all' && p.intent !== selectedIntent) return false;

      // 5. Selected interest tags filter
      if (selectedTags.length > 0) {
        const profileTagsNormalized = p.passions.map((tag) => normalizeTag(tag).toLowerCase());
        const matchesAnyTag = selectedTags.some((selected) =>
          profileTagsNormalized.includes(normalizeTag(selected).toLowerCase())
        );
        if (!matchesAnyTag) return false;
      }

      // 6. Search query (search through tags, name, bio, occupation, locality)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tagMatch = p.passions.some((t) => t.toLowerCase().includes(q));
        const nameMatch = p.name.toLowerCase().includes(q);
        const bioMatch = p.bio.toLowerCase().includes(q);
        const occupationMatch = p.occupation.toLowerCase().includes(q);
        const localityMatch = (p.locality || p.neighborhood || '').toLowerCase().includes(q);

        if (!tagMatch && !nameMatch && !bioMatch && !occupationMatch && !localityMatch) {
          return false;
        }
      }

      return true;
    });
  }, [profiles, maxDistance, selectedLocalityFilter, verifiedOnly, selectedIntent, selectedTags, searchQuery]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      return;
    }
    setIsDetectingLocation(true);
    setLocationStatus('Querying Chrome browser GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingLocation(false);
        // Map Chrome GPS coordinates to the nearest Jamshedpur locality
        const nearest = findNearestLocality(pos.coords.latitude, pos.coords.longitude);
        setLocationStatus(`Chrome GPS Locked: Locality set to ${nearest.name} (Coordinates hidden for privacy)`);
        onLocationChange(nearest.name, 'Jamshedpur');
        setTimeout(() => setLocationStatus(null), 4500);
      },
      () => {
        setIsDetectingLocation(false);
        const defaultLoc = JAMSHEDPUR_LOCALITIES.find(l => l.name === 'Kadma') || JAMSHEDPUR_LOCALITIES[0];
        setLocationStatus(`Chrome GPS not shared. Calibrated to ${defaultLoc.name} locality.`);
        onLocationChange(defaultLoc.name, 'Jamshedpur');
        setTimeout(() => setLocationStatus(null), 4000);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const currentDeckProfile = filteredProfiles[deckIndex % (filteredProfiles.length || 1)];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Location Bar & Quick Distance Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Active Locality Display */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Your Active Locality</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  Locality Only
                </span>
                {locationStatus && (
                  <span className="text-[11px] text-emerald-300 font-mono animate-fade-in">
                    {locationStatus}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <select
                  value={currentUser.locality || currentUser.neighborhood || 'Kadma'}
                  onChange={(e) => {
                    const found = JAMSHEDPUR_LOCALITIES.find(n => n.name === e.target.value);
                    if (found) onLocationChange(found.name, found.city);
                  }}
                  className="bg-slate-950 border border-slate-800 text-white font-semibold text-sm rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {JAMSHEDPUR_LOCALITIES.map((n) => (
                    <option key={n.name} value={n.name}>
                      {n.name}, {n.city}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5 border border-slate-700/60"
                  title="Detect location using Chrome browser GPS"
                >
                  <LocateFixed className={`w-3.5 h-3.5 text-emerald-400 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Chrome GPS Location</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Distance Radius Slider in Kilometers (km) */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-2.5">
            <div className="flex flex-col min-w-[130px]">
              <span className="text-[11px] text-slate-400">Match Radius</span>
              <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                Within {maxDistance} km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-32 sm:w-48 accent-emerald-400 cursor-pointer"
              aria-label="Match distance radius slider in kilometers"
            />
          </div>

          {/* Filter Toggle & View Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`py-2 px-3.5 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                showFilters || selectedIntent !== 'all' || !verifiedOnly || selectedTags.length > 0
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-semibold'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-300'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {selectedTags.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-bold flex items-center justify-center font-mono">
                  {selectedTags.length}
                </span>
              )}
            </button>

            <div className="flex p-0.5 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Grid ({filteredProfiles.length})
              </button>
              <button
                onClick={() => setViewMode('deck')}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'deck'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Focus Deck
              </button>
            </div>
          </div>
        </div>

        {/* Localities Filter Strip (Adityapur, Sonari, Kadma, Mango, Chandil, etc.) */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Filter by Locality (Jamshedpur):</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">
              Only Locality Visible · Full Address Protected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedLocalityFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                selectedLocalityFilter === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 font-semibold'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              All Localities
            </button>
            {JAMSHEDPUR_LOCALITIES.map((loc) => {
              const isSelected = selectedLocalityFilter.toLowerCase() === loc.name.toLowerCase();
              const countInLocality = profiles.filter(
                (p) => (p.locality || p.neighborhood || '').toLowerCase() === loc.name.toLowerCase()
              ).length;

              return (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => setSelectedLocalityFilter(isSelected ? 'all' : loc.name)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)] font-semibold'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <span>{loc.name}</span>
                  <span className="text-[10px] font-mono opacity-60">({countInLocality})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search by Hobby / Keyword Input & Active Tag Bar */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search local singles by hobby, passion or keyword (e.g. #CoffeeLover, #AnalogPhotography, ceramics)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Interactive Interest Tags Filter Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                <span>Filter by Popular Hobbies & Passions:</span>
              </span>

              {selectedTags.length > 0 && (
                <button
                  onClick={handleClearAllTags}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors font-medium"
                >
                  <X className="w-3 h-3" />
                  <span>Clear hobby filter ({selectedTags.length})</span>
                </button>
              )}
            </div>

            {/* Horizontal Tag Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {popularInterestTags.map(({ tag, count }) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-150 flex items-center gap-1.5 active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-semibold'
                        : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{tag}</span>
                    <span className="text-[10px] font-mono opacity-60">({count})</span>
                    {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Collapsible Secondary Filter Panel */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-fade-in">
            {/* Verified Only Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold text-slate-200 block">Biometric Verified Only</span>
                  <span className="text-[11px] text-slate-400">Hide unverified profiles</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Relationship Intent Filter */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">Relationship Intent</label>
              <select
                value={selectedIntent}
                onChange={(e) => setSelectedIntent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Any Intent</option>
                <option value="Meaningful Dating">Meaningful Dating</option>
                <option value="Long-term Partnership">Long-term Partnership</option>
                <option value="Coffee & Conversation">Coffee & Conversation</option>
              </select>
            </div>

            {/* Encryption & Safety info snippet */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">End-to-End Encrypted</span>
                <span className="text-[11px] text-slate-400">All chats use AES-256-GCM hardware keys</span>
              </div>
              <span className="text-emerald-400 font-mono text-[11px] font-bold">Active</span>
            </div>
          </div>
        )}

      </div>

      {/* Profiles View (Grid vs Deck) */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">No verified singles match your filters</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {selectedTags.length > 0
              ? `No local singles in your radius currently share ${selectedTags.join(', ')}. Try selecting different hobby tags or expanding your radius.`
              : `Try expanding your search distance slider beyond ${maxDistance} miles or clearing keywords to explore more local singles nearby.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {selectedTags.length > 0 && (
              <button
                onClick={handleClearAllTags}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                Clear Hobby Tags
              </button>
            )}
            <button
              onClick={() => {
                setMaxDistance(30);
                setSelectedIntent('all');
                setVerifiedOnly(false);
                setSelectedTags([]);
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
            >
              Reset All Filters (30 mi radius)
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onLike={onLike}
              onPass={onPass}
              onOpenDetails={onOpenDetails}
              onStartChat={onStartChat}
              isLiked={likedProfileIds.includes(profile.id)}
              variant="grid"
              selectedInterestTags={selectedTags}
              onTagClick={handleToggleTag}
            />
          ))}
        </div>
      ) : (
        /* Deck Mode */
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Profile {(deckIndex % filteredProfiles.length) + 1} of {filteredProfiles.length}</span>
            <span className="font-mono text-emerald-400">{currentDeckProfile.distanceMiles.toFixed(1)} miles away</span>
          </div>

          <ProfileCard
            profile={currentDeckProfile}
            onLike={(p) => {
              onLike(p);
              setDeckIndex((prev) => prev + 1);
            }}
            onPass={(p) => {
              onPass(p);
              setDeckIndex((prev) => prev + 1);
            }}
            onOpenDetails={onOpenDetails}
            onStartChat={onStartChat}
            isLiked={likedProfileIds.includes(currentDeckProfile.id)}
            variant="deck"
            selectedInterestTags={selectedTags}
            onTagClick={handleToggleTag}
          />

          <div className="text-center text-xs text-slate-500">
            Swipe or use the action buttons to discover the next local single
          </div>
        </div>
      )}

    </div>
  );
};

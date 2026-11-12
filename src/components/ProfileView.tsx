import { ProfileMediaEditor } from './ProfileMediaEditor';
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Sliders, 
  Lock, 
  Key, 
  Award, 
  User, 
  Save, 
  CheckCircle2,
  RefreshCw,
  Hash,
  Plus,
  X,
  Search,
  Sparkles,
  ArrowRight,
  Crown,
  Zap,
  Check,
  Coins,
  LogIn,
  LogOut,
  Camera
} from 'lucide-react';
import { SingleProfile, UserCurrentProfile, VerificationBadge } from '../types';
import { SUBSCRIPTION_PACKAGES } from '../data/mockProfiles';

interface ProfileViewProps {
  currentUser: UserCurrentProfile;
  profiles: SingleProfile[];
  onUpdateProfile: (updated: Partial<UserCurrentProfile>) => Promise<boolean>;
  onOpenVerificationModal: () => void;
  onSearchByHobby?: (tag: string) => void;
  onOpenSubscriptionModal: () => void;
  onOpenTokensModal?: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
  onLogout?: () => void;
  isLoggedIn?: boolean;
}

const TRENDING_LOCAL_HOBBIES = [
  '#CoffeeLover',
  '#AnalogPhotography',
  '#Ceramics',
  '#Bouldering',
  '#ItalianCooking',
  '#UrbanEcology',
  '#VinylCollecting',
  '#MatchaCeremony',
  '#CleanTech',
  '#DocumentaryCinema',
  '#JazzVinyl',
  '#SourdoughBaking',
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  profiles,
  onUpdateProfile,
  onOpenVerificationModal,
  onSearchByHobby,
  onOpenSubscriptionModal,
  onOpenTokensModal,
  onOpenAuthModal,
  onLogout,
  isLoggedIn,
}) => {
  const [bio, setBio] = useState(currentUser.bio);
  const [occupation, setOccupation] = useState(currentUser.occupation);
  const [intent, setIntent] = useState(currentUser.intent);
  const [maxDistance, setMaxDistance] = useState(currentUser.maxDistanceRadiusMiles);
  const [passions, setPassions] = useState<string[]>(currentUser.passions || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedTagForDetail, setSelectedTagForDetail] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const normalizeTag = (tag: string) => {
    const trimmed = tag.trim().replace(/\s+/g, '');
    if (!trimmed) return '';
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  };

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const formatted = normalizeTag(newTagInput);
    if (!formatted) return;

    if (!passions.some((t) => t.toLowerCase() === formatted.toLowerCase())) {
      const updated = [...passions, formatted];
      setPassions(updated);
      onUpdateProfile({ passions: updated });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = passions.filter((t) => t !== tagToRemove);
    setPassions(updated);
    onUpdateProfile({ passions: updated });
    if (selectedTagForDetail === tagToRemove) {
      setSelectedTagForDetail(null);
    }
  };

  const handleAddSuggestedTag = (suggested: string) => {
    if (!passions.some((t) => t.toLowerCase() === suggested.toLowerCase())) {
      const updated = [...passions, suggested];
      setPassions(updated);
      onUpdateProfile({ passions: updated });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      bio,
      occupation,
      intent,
      maxDistanceRadiusMiles: maxDistance,
      passions,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Calculate how many local singles share each passion
  const matchCountByHobby = useMemo(() => {
    const map: Record<string, number> = {};
    passions.forEach((tag) => {
      const norm = normalizeTag(tag).toLowerCase();
      const count = profiles.filter((single) =>
        single.passions.some((p) => normalizeTag(p).toLowerCase() === norm)
      ).length;
      map[tag] = count;
    });
    return map;
  }, [passions, profiles]);

  // Total unique singles sharing at least one hobby
  const totalSinglesSharingHobbies = useMemo(() => {
    const userNorm = passions.map((p) => normalizeTag(p).toLowerCase());
    return profiles.filter((single) =>
      single.passions.some((p) => userNorm.includes(normalizeTag(p).toLowerCase()))
    ).length;
  }, [passions, profiles]);


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Profile Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative shrink-0 group">
          <img
            src={currentUser.photos[0]}
            alt={currentUser.name}
            referrerPolicy="no-referrer"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-slate-700 shadow-md group-hover:border-rose-400 transition-colors"
          />
          <div 
            className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-emerald-500 text-slate-950 shadow-md"
            title="Biometrically Authenticated Human"
          >
            <ShieldCheck className="w-4 h-4" />
          </div>

          <a href="#profile-media" aria-label="Manage profile photos and videos" className="absolute -top-2 -left-2 p-2 rounded-xl bg-rose-500 shadow-lg text-white" title="Manage photos and videos">
            <Camera className="w-4 h-4" />
          </a>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white font-display">
              {currentUser.name}, {currentUser.age}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              ZK Authenticated
            </span>
            <button
              type="button"
              onClick={onOpenTokensModal}
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold hover:bg-amber-500/25 transition-colors cursor-pointer"
              title="500 default tokens granted. Tap to open Token Vault"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentUser.tokens ?? 500} Tokens</span>
            </button>
            <button
              type="button"
              onClick={onOpenSubscriptionModal}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 text-xs font-mono hover:border-amber-400 transition-colors"
              title="Click to manage subscription plan"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="capitalize">{currentUser.membershipTier || 'plus'} Member</span>
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800/80 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs transition-colors"
                title="Switch account or sign out"
              >
                <LogOut className="w-3 h-3" />
                <span>Switch / Sign Out</span>
              </button>
            )}
          </div>

          <p className="text-xs text-slate-300 font-medium flex items-center gap-2 flex-wrap">
            <span>{currentUser.occupation} · {currentUser.locality || currentUser.neighborhood}, {currentUser.city}</span>
            {currentUser.email && (
              <>
                <span className="text-slate-600">|</span>
                <span className="font-mono text-slate-400 text-[11px]">{currentUser.email}</span>
              </>
            )}
          </p>

          <p className="text-xs text-slate-400 pt-0.5 leading-relaxed">
            {currentUser.bio}
          </p>

          {/* Quick interactive tags preview */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
            {passions.map((tag) => (
              <button
                key={tag}
                onClick={() => onSearchByHobby?.(tag)}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700 text-xs font-medium transition-all"
                title={`Search local singles with ${tag}`}
              >
                {normalizeTag(tag)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ProfileMediaEditor currentUser={currentUser} onUpdateProfile={onUpdateProfile} isLoggedIn={isLoggedIn} />

      {/* Interactive Interest & Hobbies Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono mb-1">
              <Hash className="w-4 h-4" />
              <span>INTERACTIVE HOBBY & PASSION TAGS</span>
            </div>
            <h2 className="text-lg font-bold text-white font-display">
              Your Interests & Matching Hobbies
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tap any hobby tag to search local singles who share it, or add new tags to refine your compatibility.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex items-center gap-2.5 shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white font-mono">{totalSinglesSharingHobbies} local singles</span>
              <span className="text-[11px] text-slate-400 block">share your hobbies in your area</span>
            </div>
          </div>
        </div>

        {/* Current User's Active Hobby Tags */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>Your Profile Hobbies ({passions.length}):</span>
            <span className="text-slate-400 text-[11px]">Click tag to search matches</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {passions.map((tag) => {
              const count = matchCountByHobby[tag] || 0;
              const isSelected = selectedTagForDetail === tag;

              return (
                <div
                  key={tag}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTagForDetail(isSelected ? null : tag);
                    }}
                    className="text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>{normalizeTag(tag)}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 group-hover:text-emerald-400">
                      {count} matches
                    </span>
                  </button>

                  {/* Direct search CTA */}
                  <button
                    type="button"
                    onClick={() => onSearchByHobby?.(tag)}
                    className="p-1 rounded text-slate-400 hover:text-emerald-400 transition-colors ml-0.5"
                    title={`Search Discovery for ${tag}`}
                  >
                    <Search className="w-3 h-3" />
                  </button>

                  {/* Remove tag */}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove interest tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick Selected Tag Info Banner */}
          {selectedTagForDetail && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between gap-4 animate-fade-in text-xs">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  <strong className="text-white">{selectedTagForDetail}</strong> is shared by{' '}
                  <span className="text-emerald-400 font-mono font-bold">
                    {matchCountByHobby[selectedTagForDetail] || 0} verified singles
                  </span>{' '}
                  in your neighborhood.
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSearchByHobby?.(selectedTagForDetail)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span>Find Matches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Add New Tag Input */}
        <form onSubmit={handleAddTag} className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
          <div className="relative flex-1">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="Add custom hobby (e.g. #CoffeeLover, #AnalogPhotography, VinylJazz)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={!newTagInput.trim()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 disabled:opacity-40 text-slate-200 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tag</span>
          </button>
        </form>

        {/* Suggested Trending Local Tags */}
        <div className="space-y-2">
          <span className="text-[11px] text-slate-400 font-medium block">
            Suggested hobbies among local singles in your neighborhood (tap to add):
          </span>

          <div className="flex flex-wrap gap-2">
            {TRENDING_LOCAL_HOBBIES.filter(
              (t) => !passions.some((p) => p.toLowerCase() === t.toLowerCase())
            ).map((suggested) => (
              <button
                key={suggested}
                type="button"
                onClick={() => handleAddSuggestedTag(suggested)}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-emerald-400" />
                <span>{suggested}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Cryptographic Identity Credentials Audit Section */}
      <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Your Verifiable Identity Credential</h3>
              <p className="text-xs text-slate-400">Zero-Knowledge Biometric Proof Audit</p>
            </div>
          </div>

          <button
            onClick={onOpenVerificationModal}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            <span>Re-Verify / Audit</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block text-[11px]">Verification Hash:</span>
            <span className="text-emerald-400 break-all">{currentUser.verification.hash}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block text-[11px]">Zero-Knowledge Proof Token:</span>
            <span className="text-slate-200 break-all">{currentUser.verification.zkProofToken}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block text-[11px]">Trust Metric:</span>
            <span className="text-emerald-400 font-bold">{currentUser.verification.trustScore}% Verified Single</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block text-[11px]">Verification Protocol:</span>
            <span className="text-slate-300">Biometric 3D Liveness + Gov ID Check</span>
          </div>
        </div>
      </div>

      {/* Subscription & Membership Models (Rupees ₹500, ₹1,200, ₹2,500) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 font-mono mb-1">
              <Crown className="w-4 h-4" />
              <span>MEMBERSHIP TIERS & PRICING</span>
            </div>
            <h3 className="text-lg font-bold text-white font-display">
              Subscription Packages (Starting at ₹500)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Unlock verified profile discovery, unlimited encrypted chat, and priority matching.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenSubscriptionModal}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 self-start sm:self-center shadow-md shadow-emerald-500/10"
          >
            <Crown className="w-4 h-4" />
            <span>Manage Plan</span>
          </button>
        </div>

        {/* 3 Packages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SUBSCRIPTION_PACKAGES.map((pkg) => {
            const isCurrent = (currentUser.membershipTier || 'plus') === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-slate-950 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm font-display">{pkg.name}</span>
                    {isCurrent ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        Active
                      </span>
                    ) : pkg.popular ? (
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                        Popular
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-white tabular-nums">
                      ₹{pkg.monthlyPriceRupees.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">/ mo</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">{pkg.tagline}</p>

                  <div className="space-y-1.5 pt-1 text-[11px] text-slate-300">
                    {pkg.features.slice(0, 3).map((f, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenSubscriptionModal}
                  className={`mt-4 w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${pkg.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile & Privacy Configuration Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white font-display border-b border-slate-800 pb-3">
          Profile Details & Matching Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1.5">Occupation / Creative Role</label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1.5">Relationship Intent</label>
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Meaningful Dating">Meaningful Dating</option>
              <option value="Long-term Partnership">Long-term Partnership</option>
              <option value="Coffee & Conversation">Coffee & Conversation</option>
              <option value="Spontaneous Exploration">Spontaneous Exploration</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-slate-300 font-medium block mb-1.5">Personal Bio & What You Enjoy</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">Default Matching Search Radius</label>
              <span className="text-emerald-400 font-mono font-bold">{maxDistance} miles</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Location Privacy Guarantee Notice */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-300">Differential Location Privacy Enabled:</strong> Your exact GPS coordinates and physical home address are never published. Only randomized neighborhood approximation (within 500m noise radius) is shared with matches.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          {isSaved && (
            <span className="text-emerald-400 text-xs flex items-center gap-1.5 font-medium animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Changes saved successfully
            </span>
          )}
          <button
            type="submit"
            className="ml-auto py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

    </div>
  );
};

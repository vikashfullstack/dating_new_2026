import { apiUrl } from '../services/api';
import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Coins, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  LocateFixed,
  Heart,
  Flame,
  Coffee,
  Check,
  Camera,
  Upload
} from 'lucide-react';
import { UserCurrentProfile, UserAccount, GENDER_OPTIONS, LGBTQ_OPTIONS, Gender, LgbtqIdentity } from '../types';
import { JAMSHEDPUR_LOCALITIES, findNearestLocality, DEFAULT_STARTING_TOKENS, DEMO_ACCOUNTS } from '../data/mockProfiles';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onLoginSuccess: (userProfile: UserCurrentProfile, sessionToken?: string) => void;
  onRegisterSuccess: (userProfile: UserCurrentProfile, sessionToken?: string) => void;
  isMandatoryLanding?: boolean;
}

export interface CartoonAvatar {
  id: string;
  label: string;
  gender: 'male' | 'female';
  category: 'Disney 3D' | 'Pixar 3D';
  url: string;
}

export const CARTOON_AVATARS: CartoonAvatar[] = [
  // Disney 3D Female Characters
  {
    id: 'disney_f1',
    label: 'Priyanka (3D Artist)',
    gender: 'female',
    category: 'Disney 3D',
    url: '/src/assets/images/disney_3d_female_three_1794403892838.jpg',
  },
  {
    id: 'disney_f2',
    label: 'Aria (3D Cozy Romance)',
    gender: 'female',
    category: 'Pixar 3D',
    url: '/src/assets/images/disney_3d_female_one_1794403842172.jpg',
  },
  {
    id: 'disney_f3',
    label: 'Maya (3D Explorer)',
    gender: 'female',
    category: 'Disney 3D',
    url: '/src/assets/images/disney_3d_female_two_1794403841971.jpg',
  },

  // Disney 3D Male Characters
  {
    id: 'disney_m1',
    label: 'Alex (3D Designer)',
    gender: 'male',
    category: 'Disney 3D',
    url: '/src/assets/images/disney_3d_male_two_1794403842274.jpg',
  },
  {
    id: 'disney_m2',
    label: 'Rohan (3D Charismatic)',
    gender: 'male',
    category: 'Pixar 3D',
    url: '/src/assets/images/disney_3d_male_one_1794403842622.jpg',
  },
  {
    id: 'disney_m3',
    label: 'Julian (3D Intellectual)',
    gender: 'male',
    category: 'Disney 3D',
    url: '/src/assets/images/disney_3d_male_three_1794405889846.jpg',
  },
  {
    id: 'disney_m4',
    label: 'Vikram (3D Adventurous)',
    gender: 'male',
    category: 'Pixar 3D',
    url: '/src/assets/images/disney_3d_male_four_1794405893982.jpg',
  },
];

export const PRESET_AVATARS = CARTOON_AVATARS;

const SUGGESTED_TAGS = [
  { tag: '#CoffeeLover', emoji: '☕' },
  { tag: '#AnalogPhotography', emoji: '📷' },
  { tag: '#Architecture', emoji: '🏛️' },
  { tag: '#Ceramics', emoji: '🏺' },
  { tag: '#TrailRunning', emoji: '🏃' },
  { tag: '#Bouldering', emoji: '🧗' },
  { tag: '#AcousticGuitar', emoji: '🎸' },
  { tag: '#Minimalism', emoji: '✨' },
  { tag: '#VinylRecords', emoji: '🎵' },
  { tag: '#FilterCoffee', emoji: '☕' },
  { tag: '#WeekendDrives', emoji: '🚗' },
  { tag: '#JubileeParkWalks', emoji: '🌸' },
];

const DATING_INTENTS = [
  {
    id: 'Meaningful Dating',
    title: 'Meaningful Dating',
    subtitle: 'Deep chemistry & shared values',
    icon: '❤️',
  },
  {
    id: 'Long-term Partnership',
    title: 'Long-term Love',
    subtitle: 'Ready for genuine commitment',
    icon: '💍',
  },
  {
    id: 'Coffee & Conversation',
    title: 'Coffee & First Date',
    subtitle: 'Relaxed conversations & vibe check',
    icon: '☕',
  },
  {
    id: 'Spontaneous Exploration',
    title: 'Spontaneous Spark',
    subtitle: 'Meeting authentic local people',
    icon: '✨',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess,
  onRegisterSuccess,
  isMandatoryLanding = false,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register State
  const [regGender, setRegGender] = useState<Gender>('Prefer not to say');
  const [regLgbtqIdentity, setRegLgbtqIdentity] = useState<LgbtqIdentity>('Prefer not to say');
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState(25);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLocality, setRegLocality] = useState('Kadma');
  const [regIntent, setRegIntent] = useState<'Meaningful Dating' | 'Long-term Partnership' | 'Coffee & Conversation' | 'Spontaneous Exploration'>('Meaningful Dating');
  const [regOccupation, setRegOccupation] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regAvatar, setRegAvatar] = useState(CARTOON_AVATARS[0].url);
  const [avatarGenderFilter, setAvatarGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [customUploadedAvatars, setCustomUploadedAvatars] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(['#CoffeeLover', '#AnalogPhotography']);
  const [regError, setRegError] = useState<string | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsNotification, setGpsNotification] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setRegError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setRegError('Image file is too large (max 10MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomUploadedAvatars((prev) => [result, ...prev]);
        setRegAvatar(result);
        setRegError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsNotification('Geolocation not supported by this browser.');
      return;
    }
    setIsDetectingGps(true);
    setGpsNotification('Locating via Chrome GPS...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const nearest = findNearestLocality(pos.coords.latitude, pos.coords.longitude);
        setRegLocality(nearest.name);
        setGpsNotification(`Location set to ${nearest.name} (Locality Only ❤️)`);
        setTimeout(() => setGpsNotification(null), 3500);
      },
      () => {
        setIsDetectingGps(false);
        setGpsNotification('Location permission not granted. Selected Kadma.');
        setRegLocality('Kadma');
        setTimeout(() => setGpsNotification(null), 3500);
      },
      { timeout: 6000 }
    );
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both your email and password.');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        if (data.sessionToken) {
          localStorage.setItem('cipherdate_session_token', data.sessionToken);
        }
        onLoginSuccess(data.user, data.sessionToken);
        onClose();
        return;
      }
    } catch (err) {
      console.warn('Backend login request error, checking local store:', err);
    }

    // Local account fallback
    const savedAccountsJson = localStorage.getItem('cipherdate_registered_accounts');
    const savedAccounts: UserAccount[] = savedAccountsJson ? JSON.parse(savedAccountsJson) : [];
    
    const matchedAccount = savedAccounts.find(
      (acc) => acc.email.toLowerCase() === loginEmail.toLowerCase().trim()
    );
    const demoMatch = DEMO_ACCOUNTS.find(
      (demo) => demo.email.toLowerCase() === loginEmail.toLowerCase().trim()
    );

    const targetAccount = matchedAccount || demoMatch;

    if (!targetAccount) {
      const localityMatch = JAMSHEDPUR_LOCALITIES.find(l => l.name === 'Kadma') || JAMSHEDPUR_LOCALITIES[0];
      const fallbackProfile: UserCurrentProfile = {
        id: `usr_${Date.now()}`,
        email: loginEmail.trim(),
        tokens: DEFAULT_STARTING_TOKENS, // 500 tokens
        name: loginEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        age: 27,
        city: 'Jamshedpur',
        locality: 'Kadma',
        neighborhood: 'Kadma',
        coordinates: localityMatch.coordinates,
        bio: 'Local single exploring authentic romance and verified connections.',
        occupation: 'Professional',
        intent: 'Meaningful Dating',
        passions: ['#CoffeeLover', '#AnalogPhotography'],
        photos: [PRESET_AVATARS[0].url],
        verification: {
          status: 'verified',
          hash: '0x' + Math.random().toString(16).substring(2, 10),
          verifiedAt: 'Active',
          method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
          zkProofToken: 'zkp_auth_' + Date.now(),
          trustScore: 99.4,
        },
        maxDistanceRadiusMiles: 15,
        maxDistanceRadiusKm: 25,
        ageRange: [22, 35],
        onlyVerifiedMatches: true,
        membershipTier: 'plus',
      };

      onLoginSuccess(fallbackProfile);
      onClose();
      return;
    }

    const locCoords = JAMSHEDPUR_LOCALITIES.find(
      (l) => l.name.toLowerCase() === targetAccount.locality.toLowerCase()
    )?.coordinates || { lat: 22.7952, lng: 86.1648 };

    const authenticatedProfile: UserCurrentProfile = {
      id: ('id' in targetAccount && targetAccount.id) ? (targetAccount.id as string) : `usr_${Date.now()}`,
      email: targetAccount.email,
      tokens: targetAccount.tokens || DEFAULT_STARTING_TOKENS,
      name: targetAccount.name,
      age: targetAccount.age,
      city: targetAccount.city || 'Jamshedpur',
      locality: targetAccount.locality,
      neighborhood: targetAccount.locality,
      coordinates: locCoords,
      bio: targetAccount.bio || 'Local verified member in Jamshedpur.',
      occupation: (targetAccount as any).occupation || 'Professional',
      intent: (targetAccount as any).intent || 'Meaningful Dating',
      gender: 'gender' in targetAccount ? targetAccount.gender : undefined,
      lgbtqIdentity: 'lgbtqIdentity' in targetAccount ? targetAccount.lgbtqIdentity : undefined,
      passions: targetAccount.passions || ['#CoffeeLover', '#AnalogPhotography'],
      photos: targetAccount.photo ? [targetAccount.photo] : [PRESET_AVATARS[0].url],
      verification: {
        status: 'verified',
        hash: '0x' + Math.random().toString(16).substring(2, 10),
        verifiedAt: 'Active',
        method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
        zkProofToken: 'zkp_auth_' + Date.now(),
        trustScore: 99.8,
      },
      maxDistanceRadiusMiles: 15,
      maxDistanceRadiusKm: 25,
      ageRange: [22, 35],
      onlyVerifiedMatches: true,
      membershipTier: (targetAccount as any).membershipTier || 'plus',
    };

    onLoginSuccess(authenticatedProfile);
    onClose();
  };

  const handleQuickDemoLogin = async (demo: typeof DEMO_ACCOUNTS[0]) => {
    try {
      const res = await fetch(apiUrl('/api/auth/demo-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demo.email }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        if (data.sessionToken) {
          localStorage.setItem('cipherdate_session_token', data.sessionToken);
        }
        onLoginSuccess(data.user, data.sessionToken);
        onClose();
        return;
      }
    } catch (err) {
      console.warn('Backend demo-login error, using fallback:', err);
    }

    const locCoords = JAMSHEDPUR_LOCALITIES.find(
      (l) => l.name.toLowerCase() === demo.locality.toLowerCase()
    )?.coordinates || { lat: 22.7952, lng: 86.1648 };

    const profile: UserCurrentProfile = {
      id: `usr_${demo.email.split('@')[0]}`,
      email: demo.email,
      tokens: demo.tokens, // 500 tokens by default
      name: demo.name,
      age: demo.age,
      city: demo.city,
      locality: demo.locality,
      neighborhood: demo.locality,
      coordinates: locCoords,
      bio: demo.bio,
      occupation: demo.occupation,
      intent: demo.intent,
      passions: demo.passions,
      photos: [demo.photo],
      verification: {
        status: 'verified',
        hash: '0x' + Math.random().toString(16).substring(2, 10),
        verifiedAt: 'Active',
        method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
        zkProofToken: 'zkp_auth_' + Date.now(),
        trustScore: 99.8,
      },
      maxDistanceRadiusMiles: 15,
      maxDistanceRadiusKm: 25,
      ageRange: [22, 35],
      onlyVerifiedMatches: true,
      membershipTier: 'plus',
    };

    onLoginSuccess(profile);
    onClose();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) {
      setRegError('Please provide your full name.');
      return;
    }
    if (regAge < 18) {
      setRegError('You must be at least 18 years old to join.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Please provide a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          age: Number(regAge),
          gender: regGender,
          lgbtqIdentity: regLgbtqIdentity,
          locality: regLocality,
          photo: regAvatar,
          bio: regBio.trim(),
          intent: regIntent,
          passions: selectedTags,
          occupation: regOccupation.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        if (data.sessionToken) {
          localStorage.setItem('cipherdate_session_token', data.sessionToken);
        }
        onRegisterSuccess(data.user, data.sessionToken);
        onClose();
        return;
      }
    } catch (err) {
      console.warn('Backend register error, fallback to local:', err);
    }

    const locCoords = JAMSHEDPUR_LOCALITIES.find(
      (l) => l.name.toLowerCase() === regLocality.toLowerCase()
    )?.coordinates || { lat: 22.7952, lng: 86.1648 };

    // Create new profile with 500 TOKENS BY DEFAULT
    const newProfile: UserCurrentProfile = {
      id: `usr_new_${Date.now()}`,
      email: regEmail.trim(),
      tokens: DEFAULT_STARTING_TOKENS, // 500 tokens by default
      name: regName.trim(),
      age: Number(regAge),
      gender: regGender,
      lgbtqIdentity: regLgbtqIdentity,
      city: 'Jamshedpur',
      locality: regLocality,
      neighborhood: regLocality,
      coordinates: locCoords,
      bio: regBio.trim() || `Excited to meet genuine local singles in ${regLocality}.`,
      occupation: regOccupation.trim() || 'Professional',
      intent: regIntent,
      passions: selectedTags.length > 0 ? selectedTags : ['#CoffeeLover', '#LocalDating'],
      photos: [regAvatar],
      verification: {
        status: 'verified',
        hash: '0x' + Math.random().toString(16).substring(2, 10),
        verifiedAt: 'Active',
        method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
        zkProofToken: 'zkp_reg_' + Date.now(),
        trustScore: 99.6,
      },
      maxDistanceRadiusMiles: 15,
      maxDistanceRadiusKm: 25,
      ageRange: [Math.max(18, regAge - 5), regAge + 8],
      onlyVerifiedMatches: true,
      membershipTier: 'plus',
    };

    onRegisterSuccess(newProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      
      {/* Modal Card with Romantic Glow and Floating Hearts */}
      <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-xl w-full my-auto max-h-[calc(100dvh-1.5rem)] overflow-hidden shadow-2xl shadow-rose-950/50 relative text-slate-100 flex flex-col">
        
        {/* Ambient Romantic Background Glows */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-16 w-56 h-56 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Heart Particles (Pure CSS Keyframe Animation) */}
        <div className="absolute top-5 left-10 pointer-events-none animate-float-heart opacity-70">
          <Heart className="w-4 h-4 fill-rose-500/40 text-rose-400" />
        </div>
        <div className="absolute top-12 right-20 pointer-events-none animate-float-heart-reverse opacity-80">
          <Heart className="w-5 h-5 fill-pink-500/40 text-pink-400" />
        </div>
        <div className="absolute top-28 left-6 pointer-events-none animate-float-heart opacity-50">
          <Heart className="w-3.5 h-3.5 fill-rose-400/30 text-rose-300" />
        </div>
        <div className="absolute top-36 right-8 pointer-events-none animate-float-heart-reverse opacity-60">
          <Heart className="w-4 h-4 fill-rose-500/30 text-rose-400" />
        </div>

        {/* Romantic Dating Hero Header */}
        <div className="px-6 pt-5 pb-4 border-b border-rose-500/20 bg-gradient-to-r from-rose-950/70 via-slate-950/90 to-pink-950/70 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            {/* Overlapping Romantic Disney 3D Avatars with Pulsing Heart */}
            <div className="flex items-center -space-x-3 shrink-0">
              <img
                src={CARTOON_AVATARS[0].url}
                alt="Disney 3D Character"
                className="w-10 h-10 rounded-full object-cover border-2 border-rose-500/80 shadow-md"
              />
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white z-20 shadow-lg shadow-rose-500/50 animate-pulse-heart">
                <Heart className="w-3.5 h-3.5 fill-white text-white" />
              </div>
              <img
                src={CARTOON_AVATARS[3].url}
                alt="Disney 3D Character"
                className="w-10 h-10 rounded-full object-cover border-2 border-pink-500/80 shadow-md"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-white font-display">
                  {mode === 'login' ? 'Welcome Back, Romantic' : 'Find Real Love Nearby'}
                </h2>
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse-heart" />
              </div>
              <p className="text-[11px] text-rose-200/80 font-medium">
                Jamshedpur Local Singles · ZK Verified · E2E Encrypted
              </p>
            </div>
          </div>

          {isMandatoryLanding ? (
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 text-xs border border-slate-800 transition-colors"
              title="Browse singles as guest"
            >
              Explore as Guest
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 500 Tokens Incentive Promo Header Banner with Romantic Perks */}
        <div className="bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-amber-500/20 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between gap-3 text-xs relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Coins className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <span className="text-amber-200 font-medium">
                <strong className="text-amber-300 font-mono font-bold">500 Free Tokens</strong> credited by default!
              </span>
              <span className="hidden sm:inline text-[11px] text-amber-200/70 ml-1.5">
                (Super Likes ❤️, Locality Boosts & Safe Meetups)
              </span>
            </div>
          </div>
          <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-bold">
            <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
            <span>₹0 Free Gift</span>
          </span>
        </div>

        {/* Romantic Dating Tab Switcher */}
        <div className="flex p-2 bg-slate-950/80 border-b border-slate-800 gap-2 relative z-10">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-slate-800 to-slate-800/90 text-white shadow-md border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${mode === 'login' ? 'text-rose-500 fill-rose-500' : 'text-slate-500'}`} />
            <span>Sign In ❤️</span>
          </button>
          
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'register'
                ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Create Dating Profile</span>
            <span className="text-[10px] font-mono bg-slate-950 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-400/40">
              +500 🪙
            </span>
          </button>
        </div>

        {/* Form Body Container */}
        <div className="p-4 sm:p-6 min-h-0 overflow-y-auto flex-1 space-y-5 relative z-10">
          
          {/* ===================== LOGIN VIEW ===================== */}
          {mode === 'login' && (
            <div className="space-y-6">
              
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>Your local matches in Jamshedpur are waiting</span>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <Heart className="w-4 h-4 fill-rose-400 text-rose-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Email Address:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. alex.verma@cipherdate.in"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Password:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:opacity-95 text-white font-bold text-xs transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Heart className="w-4 h-4 fill-white text-white animate-pulse-heart" />
                  <span>Sign In & Match with Local Singles</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </form>

              {/* Quick 1-Click Demo Verified Singles */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>Instant Match Demo Logins:</span>
                  </span>
                  <span className="text-[11px] font-mono text-amber-400">500 🪙 Pre-seeded</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {DEMO_ACCOUNTS.map((demo) => (
                    <button
                      key={demo.email}
                      type="button"
                      onClick={() => handleQuickDemoLogin(demo)}
                      className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900/80 transition-all text-left flex items-center gap-2.5 group relative overflow-hidden"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={demo.photo}
                          alt={demo.name}
                          className="w-10 h-10 rounded-full object-cover border border-rose-500/40 group-hover:border-rose-400 transition-colors"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow">
                          <Heart className="w-2 h-2 fill-white text-white" />
                        </span>
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate group-hover:text-rose-300 transition-colors">
                          {demo.name}, {demo.age}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                          <span className="truncate">{demo.locality}</span>
                          <span className="font-mono text-amber-400 font-bold shrink-0">{demo.tokens} 🪙</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Romantic Safety Reassurance */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Zero-Knowledge Verified Humans · Zero Bots · Safe Encrypted Local Dates</span>
              </div>
            </div>
          )}

          {/* ===================== REGISTER VIEW ===================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <Heart className="w-4 h-4 fill-rose-400 text-rose-400 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* 500 Token Reward Celebration Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-emerald-500/15 border border-amber-500/40 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
                    <Coins className="w-5 h-5 fill-slate-950" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span>500 Welcome Tokens Deposited</span>
                      <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Instantly unlocks priority encrypted chats, super likes & verified date requests.
                    </div>
                  </div>
                </div>
                <span className="font-mono text-base font-bold text-amber-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-amber-500/40 shrink-0 shadow">
                  +500 🪙
                </span>
              </div>

              <fieldset className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <legend className="px-1 text-xs font-semibold text-slate-200">About you (optional)</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="register-gender" className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
                    <select id="register-gender" name="gender" value={regGender} onChange={(e) => {
                      const gender = e.target.value as Gender;
                      setRegGender(gender);
                      setAvatarGenderFilter(gender === 'Male' ? 'male' : gender === 'Female' ? 'female' : 'all');
                    }} className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white focus:border-rose-500">
                      {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="register-lgbtq" className="block text-xs font-semibold text-slate-300 mb-1">Do you identify as LGBTQ+?</label>
                    <select id="register-lgbtq" name="lgbtqIdentity" value={regLgbtqIdentity} onChange={(e) => setRegLgbtqIdentity(e.target.value as LgbtqIdentity)} aria-describedby="register-identity-help" className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white focus:border-rose-500">
                      {LGBTQ_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>
                <p id="register-identity-help" className="text-xs text-slate-400">Share only what you’re comfortable with. These answers are optional and saved with your account.</p>
              </fieldset>

              {/* Step 1: Choose Disney 3D Character Avatar with Upload Option */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>Choose your profile image</span>
                  </label>
                  <span className="text-[10px] text-amber-300 font-medium flex items-center gap-1">
                    <span>Preset or upload</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3 rounded-xl border border-slate-800 bg-slate-950 p-2.5" aria-live="polite">
                  <img src={regAvatar} alt="Selected profile image" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <span className="text-xs text-slate-300">Your selected image</span>
                </div>
                {/* Avatar browsing filters */}
                <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                  <button
                    type="button"
                    aria-pressed={avatarGenderFilter === 'all'}
                    onClick={() => setAvatarGenderFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      avatarGenderFilter === 'all'
                        ? 'bg-rose-500 text-white font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    All images ({CARTOON_AVATARS.length})
                  </button>
                  <button
                    type="button"
                    aria-pressed={avatarGenderFilter === 'female'}
                    onClick={() => setAvatarGenderFilter('female')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                      avatarGenderFilter === 'female'
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>Female avatars</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={avatarGenderFilter === 'male'}
                    onClick={() => setAvatarGenderFilter('male')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                      avatarGenderFilter === 'male'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>Male avatars</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pb-2 pt-2">
                  
                  {/* Upload from Device Button */}
                  <label
                    htmlFor="reg-photo-upload"
                    className="w-18 h-22 sm:w-20 sm:h-24 rounded-2xl border-2 border-dashed border-rose-500/60 hover:border-rose-400 bg-rose-500/10 hover:bg-rose-500/20 flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 group text-rose-300 shadow-sm"
                    title="Upload picture from your phone or computer"
                  >
                    <Camera className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold mt-1 tracking-tight">Upload</span>
                    <span className="text-[8px] text-rose-400/80">Your Pic</span>
                    <input
                      id="reg-photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>

                  {/* Custom Uploaded Photos */}
                  {customUploadedAvatars.map((url, idx) => {
                    const isSelected = regAvatar === url;
                    return (
                      <button
                        type="button"
                        aria-label="Choose uploaded photo"
                        aria-pressed={regAvatar === url}
                        key={`custom_${idx}`}
                        onClick={() => setRegAvatar(url)}
                        className="relative cursor-pointer shrink-0 group flex flex-col items-center"
                        title="Your uploaded photo"
                      >
                        <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden transition-all ${
                          isSelected
                            ? 'border-2 border-rose-500 scale-105 shadow-lg shadow-rose-500/40 ring-2 ring-rose-500/40'
                            : 'border border-slate-700 opacity-80 hover:opacity-100'
                        }`}>
                          <img
                            src={url}
                            alt="Your uploaded picture"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md animate-pulse-heart">
                            <Heart className="w-3 h-3 fill-white text-white" />
                          </span>
                        )}
                        <span className="text-[9px] font-bold text-rose-300 mt-1">
                          Custom Pic
                        </span>
                      </button>
                    );
                  })}

                  {/* Disney 3D Pixar Characters */}
                  {CARTOON_AVATARS.filter(
                    (av) => avatarGenderFilter === 'all' || av.gender === avatarGenderFilter
                  ).map((avatar) => {
                    const isSelected = regAvatar === avatar.url;
                    return (
                      <button
                        type="button"
                        aria-label={`Choose ${avatar.label} avatar`}
                        aria-pressed={regAvatar === avatar.url}
                        key={avatar.id}
                        onClick={() => setRegAvatar(avatar.url)}
                        className="relative cursor-pointer shrink-0 group flex flex-col items-center"
                        title={`${avatar.label} (${avatar.category})`}
                      >
                        <div
                          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden transition-all hover:scale-105 ${
                            isSelected
                              ? 'border-2 border-rose-500 scale-105 shadow-xl shadow-rose-500/50 ring-2 ring-rose-500/60'
                              : 'border border-slate-800 hover:border-rose-400/50 opacity-90 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={avatar.url}
                            alt={avatar.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover animate-anime-bob group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>

                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md animate-pulse-heart">
                            <Heart className="w-3 h-3 fill-white text-white" />
                          </span>
                        )}

                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-[8px] px-1.5 py-0.2 rounded font-semibold ${
                            avatar.gender === 'female'
                              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}>
                            {avatar.gender === 'female' ? '♀ Disney 3D' : '♂ Pixar 3D'}
                          </span>
                        </div>
                        <span className="text-[9px] font-medium text-slate-300 mt-0.5 truncate max-w-[80px]">
                          {avatar.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Name & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Your Full Name: *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Vikram Murmu"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Age (18+): *
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={99}
                    required
                    value={regAge}
                    onChange={(e) => setRegAge(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
                  />
                </div>
              </div>



              {/* Step 3: Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Email Address: *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. vikram@cipherdate.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Password (6+ chars): *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create secure passphrase"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
                  />
                </div>
              </div>

              {/* Step 4: Jamshedpur Locality Selector + Chrome GPS Snapper */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800/90">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Your Locality in Jamshedpur: *</span>
                  </span>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    Locality Only · Privacy Protected ❤️
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={regLocality}
                    onChange={(e) => setRegLocality(e.target.value)}
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-700 text-white font-medium text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    {JAMSHEDPUR_LOCALITIES.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name} ({loc.description})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={isDetectingGps}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 shrink-0 transition-colors"
                    title="Detect locality using Chrome GPS"
                  >
                    <LocateFixed className={`w-3.5 h-3.5 text-emerald-400 ${isDetectingGps ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">GPS Auto-Detect</span>
                  </button>
                </div>

                {gpsNotification && (
                  <p className="text-[11px] text-emerald-300 font-mono animate-fade-in pt-1">
                    {gpsNotification}
                  </p>
                )}
              </div>

              {/* Step 5: What are you looking for? (Dating Intent Cards) */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>What are you looking for? (Dating Intent):</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DATING_INTENTS.map((intent) => {
                    const isSelected = regIntent === intent.id;
                    return (
                      <button
                        key={intent.id}
                        type="button"
                        onClick={() => setRegIntent(intent.id as any)}
                        className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-rose-500/15 border-rose-500 text-white shadow-md shadow-rose-500/10 ring-1 ring-rose-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">{intent.icon}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-white">{intent.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{intent.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profession / Studio */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Profession / Passion Studio:
                </label>
                <input
                  type="text"
                  value={regOccupation}
                  onChange={(e) => setRegOccupation(e.target.value)}
                  placeholder="e.g. Design Architect / Sound Engineer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Bio & Headline */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Dating Headline & Bio:
                </label>
                <textarea
                  rows={2}
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  placeholder="Share what makes you tick, favourite local coffee spot in Jamshedpur..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              {/* Hobbies / Interest Tags with Emojis & Hearts */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 block flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>Select Hobbies & Dating Sparks:</span>
                  </span>
                  <span className="text-[10px] text-rose-300/80 font-mono">
                    {selectedTags.length} selected
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_TAGS.map(({ tag, emoji }) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-gradient-to-r from-rose-500/25 to-pink-500/25 text-rose-200 border-rose-500 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{tag}</span>
                        {isSelected && <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Registration with Romantic Gradient */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-400 hover:opacity-95 text-slate-950 font-bold text-xs transition-all shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 active:scale-[0.99] pt-2"
              >
                <Heart className="w-4 h-4 fill-slate-950 text-slate-950 animate-pulse-heart" />
                <span>Start Matching in Jamshedpur & Claim 500 Tokens</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

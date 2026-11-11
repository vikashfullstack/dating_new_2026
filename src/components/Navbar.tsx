import { ShieldCheck, MessageSquare, Compass, Heart, Shield, User, Crown, Coins, LogIn, LogOut } from 'lucide-react';
import { UserCurrentProfile } from '../types';

interface NavbarProps {
  activeTab: 'discover' | 'matches' | 'chat' | 'safety' | 'profile';
  setActiveTab: (tab: 'discover' | 'matches' | 'chat' | 'safety' | 'profile') => void;
  currentUser: UserCurrentProfile;
  unreadCount: number;
  matchesCount: number;
  onOpenVerification: () => void;
  onOpenSubscriptionModal: () => void;
  onOpenTokensModal: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  unreadCount,
  matchesCount,
  onOpenVerification,
  onOpenSubscriptionModal,
  onOpenTokensModal,
  onOpenAuthModal,
  isLoggedIn,
  onLogout,
}) => {
  return (
    <>
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 xl:gap-5">
        
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div 
          onClick={() => setActiveTab('discover')}
          className="flex items-center gap-2 cursor-pointer select-none shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-base sm:text-xl font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0">
            CipherDate
          </span>
        </div>

        {/* Zone 2: 4-5 Navigation Links (Clean text links with hover state) */}
        <nav className="hidden xl:flex items-center gap-4 text-sm font-medium">
          <button
            onClick={() => setActiveTab('discover')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'discover'
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              Discover Singles
            </span>
          </button>

          <button
            onClick={() => setActiveTab('matches')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
              activeTab === 'matches'
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              Mutual Matches
              {matchesCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-md font-mono">
                  {matchesCount}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
              activeTab === 'chat'
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              Chat
              {unreadCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-bold rounded-md font-mono">
                  {unreadCount}
                </span>
              )}
            </span>
          </button>


        </nav>

        {/* Zone 3: 1 Primary Action (Tokens, Plans, Auth & Profile Hub) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Token Wallet Button (Default 500 Tokens) */}
          <button
            onClick={onOpenTokensModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all whitespace-nowrap shrink-0 group"
            title="Your Token Balance (Default: 500 Tokens)"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="font-mono text-amber-300 font-bold tabular-nums">
              {currentUser.tokens ?? 500}
            </span>
            <span className="hidden sm:inline text-[11px] text-amber-400/90 font-medium">Tokens</span>
          </button>

          {/* Subscription Plans (from ₹500) */}
          <button
            onClick={onOpenSubscriptionModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 text-xs font-semibold transition-all whitespace-nowrap shrink-0"
            title="Membership plans starting from ₹500"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Plans</span>
            <span className="font-mono text-[11px] text-amber-400 font-bold">₹500+</span>
          </button>

          {isLoggedIn ? (
            <>
              {/* Profile button */}
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:text-white text-xs transition-all whitespace-nowrap shrink-0"
                title={`${currentUser.name} (${currentUser.locality})`}
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
                <span className="text-[10px] text-emerald-400 font-mono hidden 2xl:inline">
                  {currentUser.locality}
                </span>
              </button>

              {/* Logout button */}
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                title="Sign Out / Switch Account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuthModal('login')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuthModal('register')}
                className="hidden sm:flex px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="hidden sm:inline">Register</span>
                <span className="hidden sm:inline text-[10px] font-mono bg-emerald-950 text-emerald-300 px-1 rounded">
                  +500 🪙
                </span>
              </button>
            </div>
          )}

        </div>
      </div>

    </header>
      {/* Mobile Bottom Navigation Bar (Docked fixed at bottom on mobile) */}
      <nav 
        aria-label="Mobile Navigation"
        className="xl:hidden grid grid-cols-4 items-center h-[calc(4rem+env(safe-area-inset-bottom))] bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 fixed bottom-0 left-0 right-0 z-50 px-1 shadow-2xl safe-area-bottom"
      >
        {/* Tab 1: Discover */}
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'discover' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Compass className="w-5 h-5" />
            {activeTab === 'discover' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Discover</span>
        </button>

        {/* Tab 2: Matches */}
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex flex-col items-center justify-center h-full relative transition-colors ${
            activeTab === 'matches' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Heart className="w-5 h-5" />
            {matchesCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {matchesCount}
              </span>
            )}
            {activeTab === 'matches' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Matches</span>
        </button>

        {/* Tab 3: Chat (Renamed from Encrypted -> Chat) */}
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center justify-center h-full relative transition-colors ${
            activeTab === 'chat' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[16px] h-4 bg-emerald-500 text-slate-950 text-[10px] font-mono font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            {activeTab === 'chat' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Chat</span>
        </button>

        {/* Tab 5: Profile */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'profile' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            {currentUser.photos && currentUser.photos[0] ? (
              <img
                src={currentUser.photos[0]}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className={`w-5 h-5 rounded-full object-cover border ${
                  activeTab === 'profile' ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-slate-700'
                }`}
              />
            ) : (
              <User className="w-5 h-5" />
            )}
            {activeTab === 'profile' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Profile</span>
        </button>
      </nav>
    </>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Coins, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight, 
  MessageSquare, 
  Heart, 
  MapPin, 
  Clock, 
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { TokenTransaction } from '../types';
import { TOKEN_PACKAGES, TokenPackage } from '../data/mockProfiles';

interface TokenWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: number;
  transactions: TokenTransaction[];
  onRechargeTokens: (packageItem: TokenPackage) => void;
  onSpendTokens: (amount: number, description: string, type: any) => boolean;
}

export const TokenWalletModal: React.FC<TokenWalletModalProps> = ({
  isOpen,
  onClose,
  tokens,
  transactions,
  onRechargeTokens,
  onSpendTokens,
}) => {
  const [activeTab, setActiveTab] = useState<'balance' | 'recharge' | 'history'>('balance');
  const [spendingActionSuccess, setSpendingActionSuccess] = useState<string | null>(null);
  const [spendingActionError, setSpendingActionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = (amount: number, title: string, type: any) => {
    setSpendingActionError(null);
    setSpendingActionSuccess(null);

    const success = onSpendTokens(amount, title, type);
    if (success) {
      setSpendingActionSuccess(`Activated ${title}! Deducted ${amount} tokens.`);
      setTimeout(() => setSpendingActionSuccess(null), 3500);
    } else {
      setSpendingActionError(`Insufficient token balance! You have ${tokens} tokens.`);
      setTimeout(() => setSpendingActionError(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-slate-100 flex flex-col max-h-[calc(100dvh-2rem)]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 shrink-0 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Token Vault & Perks</h2>
              <span className="text-[11px] text-slate-400 font-mono">
                500 Tokens Granted by Default to All Users
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('balance')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'balance'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & Perks
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recharge')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'recharge'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Recharge (₹ INR)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            History ({transactions.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 min-h-0 overflow-y-auto space-y-6">
          
          {/* TAB 1: OVERVIEW & PERKS */}
          {activeTab === 'balance' && (
            <div className="space-y-6">
              
              {/* Balance Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-emerald-500/10 border border-amber-500/40 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-200 uppercase tracking-wider font-mono">
                    Available Token Balance
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono">
                    Active Account
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-extrabold text-white font-mono tracking-tight tabular-nums">
                    {tokens}
                  </span>
                  <span className="text-base font-semibold text-amber-400 font-display">
                    Tokens
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-2">
                  You received <strong className="text-amber-300">500 tokens</strong> upon registration. Use them to stand out with verified local singles across Jamshedpur.
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setActiveTab('recharge')}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Recharge Tokens</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    View History
                  </button>
                </div>
              </div>

              {/* Status alerts */}
              {spendingActionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{spendingActionSuccess}</span>
                </div>
              )}
              {spendingActionError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                  {spendingActionError}
                </div>
              )}

              {/* Redeemable Perks Grid */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Redeem Tokens for Local Perks:
                </div>

                {/* Perk 1: Super Like */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                      <Heart className="w-4 h-4 fill-rose-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Super Like with Direct Buzz</div>
                      <div className="text-[11px] text-slate-400">Puts your profile at the top of their discovery queue.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAction(50, 'Super Like Buzz', 'super_like')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-mono font-bold transition-all shrink-0 border border-slate-700"
                  >
                    50 🪙
                  </button>
                </div>

                {/* Perk 2: Locality Boost */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Locality Spotlight (Jamshedpur)</div>
                      <div className="text-[11px] text-slate-400">Boosts visibility across Sonari, Kadma, Mango & Adityapur.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAction(100, 'Locality Spotlight Boost', 'locality_boost')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-mono font-bold transition-all shrink-0 border border-slate-700"
                  >
                    100 🪙
                  </button>
                </div>

                {/* Perk 3: Priority Encrypted Message */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Priority Direct E2EE Chat</div>
                      <div className="text-[11px] text-slate-400">Start an encrypted AES-256 chat without waiting.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAction(25, 'Priority Direct E2EE Chat', 'priority_chat')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-mono font-bold transition-all shrink-0 border border-slate-700"
                  >
                    25 🪙
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: RECHARGE PACKAGES IN RUPEES (₹) */}
          {activeTab === 'recharge' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Purchase token top-ups denominated in Indian Rupees (₹) via UPI, Debit/Credit Card or Net Banking.
              </div>

              <div className="space-y-3">
                {TOKEN_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      pkg.popular
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white font-mono">
                          {pkg.tokens} Tokens
                        </span>
                        {pkg.bonusTokens && pkg.bonusTokens > 0 && (
                          <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                            +{pkg.bonusTokens} Free Bonus
                          </span>
                        )}
                        {pkg.popular && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                            Most Popular
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        Instant credit to your CipherDate token balance
                      </div>
                    </div>

                    <button
                      onClick={() => onRechargeTokens(pkg)}
                      className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 font-mono ${
                        pkg.popular
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      ₹{pkg.priceRupees}
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Simulated Secure Payment Gateway (UPI / RuPay / Visa / Mastercard)</span>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSACTION AUDIT LOG */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Recent Token Grants & Activity:
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No token transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-200">
                          {tx.description}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(tx.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      <span
                        className={`font-mono font-bold text-sm ${
                          tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} 🪙
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

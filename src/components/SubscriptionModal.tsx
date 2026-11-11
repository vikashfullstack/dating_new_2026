import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Crown, 
  Lock, 
  CreditCard, 
  Smartphone, 
  Building, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { MembershipTier, SubscriptionPackage } from '../types';
import { SUBSCRIPTION_PACKAGES } from '../data/mockProfiles';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: MembershipTier;
  onUpgradeTier: (tier: MembershipTier) => void;
  initialSelectedTier?: MembershipTier;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  onUpgradeTier,
  initialSelectedTier = 'plus',
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedTierId, setSelectedTierId] = useState<MembershipTier>(
    initialSelectedTier === 'free' ? 'plus' : initialSelectedTier
  );
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'plans' | 'payment' | 'success'>('plans');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('user@oksbi');

  if (!isOpen) return null;

  const selectedPackage = SUBSCRIPTION_PACKAGES.find((p) => p.id === selectedTierId) || SUBSCRIPTION_PACKAGES[1];

  const currentPrice =
    billingCycle === 'monthly'
      ? selectedPackage.monthlyPriceRupees
      : selectedPackage.annualPriceRupeesPerMonth;

  const totalBilledAnnual = selectedPackage.annualPriceRupeesPerMonth * 12;

  const handleProceedToPayment = () => {
    setPaymentStep('payment');
  };

  const handleConfirmPayment = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      onUpgradeTier(selectedTierId);
      setPaymentStep('success');
    }, 1400);
  };

  const handleClose = () => {
    setPaymentStep('plans');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl text-slate-100 flex flex-col my-auto max-h-[94vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 shrink-0 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white font-display text-base sm:text-lg">
                CipherDate Membership Packages
              </h2>
              <p className="text-xs text-slate-400">
                Encrypted matchmaking, verified local singles & high-intent dating
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 min-h-0 overflow-y-auto space-y-6">

          {/* STEP 1: Plan Selection */}
          {paymentStep === 'plans' && (
            <>
              {/* Billing Cycle Switcher */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <h3 className="text-xl font-bold text-white font-display">
                    Select Your Dating Plan
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Starting from ₹500/month. Cancel or change your subscription at any time.
                  </p>
                </div>

                {/* Segmented Monthly / Annual Control */}
                <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      billingCycle === 'monthly'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      billingCycle === 'annual'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Annual Billing</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-900 text-emerald-300">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>

              {/* 3 Packages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {SUBSCRIPTION_PACKAGES.map((pkg) => {
                  const isSelected = selectedTierId === pkg.id;
                  const isCurrent = currentTier === pkg.id;
                  const price =
                    billingCycle === 'monthly'
                      ? pkg.monthlyPriceRupees
                      : pkg.annualPriceRupeesPerMonth;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedTierId(pkg.id)}
                      className={`relative rounded-2xl p-5 border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        pkg.popular
                          ? 'border-emerald-500/60 bg-gradient-to-b from-emerald-950/30 via-slate-900 to-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      } ${isSelected ? 'ring-2 ring-emerald-400' : ''}`}
                    >
                      {/* Popular / Best Value Ribbon */}
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider font-mono shadow-md">
                          Most Popular
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Package Title & Tagline */}
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-bold text-white font-display">
                              {pkg.name}
                            </h4>
                            {isCurrent && (
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                                Current Plan
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {pkg.tagline}
                          </p>
                        </div>

                        {/* Price Display in Indian Rupees (₹) */}
                        <div className="pt-2 border-t border-slate-800/80">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                              ₹{price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              / month
                            </span>
                          </div>
                          {billingCycle === 'annual' && (
                            <span className="text-[11px] text-emerald-400 font-mono block mt-0.5">
                              Billed ₹{(price * 12).toLocaleString('en-IN')} annually
                            </span>
                          )}
                        </div>

                        {/* Connection Limit Highlight */}
                        <div className="py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{pkg.connectionLimit}</span>
                        </div>

                        {/* Features Checklist */}
                        <div className="space-y-2 pt-2">
                          {pkg.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-tight">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Select Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTierId(pkg.id);
                        }}
                        className={`w-full mt-6 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-sm'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        <span>{isCurrent ? 'Current Plan' : `Choose ${pkg.name}`}</span>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Action Strip */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    100% Secure Payment with UPI, RuPay, Visa, Mastercard & Net Banking. Instant Activation.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
                >
                  <span>Continue to Subscribe (₹{currentPrice.toLocaleString('en-IN')})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Payment Simulation (UPI, Cards, NetBanking in Rupees) */}
          {paymentStep === 'payment' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white font-display">
                  Complete Your Subscription
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Subscribing to <strong className="text-emerald-400">{selectedPackage.name}</strong> at{' '}
                  <span className="font-mono font-bold text-white">
                    ₹{currentPrice.toLocaleString('en-IN')}/{billingCycle === 'monthly' ? 'mo' : 'mo (billed annually)'}
                  </span>
                </p>
              </div>

              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'upi'
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'card'
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cards / RuPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'netbanking'
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Net Banking</span>
                </button>
              </div>

              {/* Payment Form Fields */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                {paymentMethod === 'upi' && (
                  <div className="space-y-3">
                    <label className="text-xs text-slate-300 font-medium block">
                      Enter UPI ID / VPA (Google Pay, PhonePe, Paytm, BHIM):
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@okhdfcbank"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">@okaxis</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">@okhdfcbank</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">@ybl</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">@paytm</span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-300 block mb-1">Card Number (RuPay, Visa, Mastercard):</label>
                      <input
                        type="text"
                        defaultValue="4111 2222 3333 4444"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 block mb-1">Expiry Date:</label>
                        <input
                          type="text"
                          defaultValue="08/28"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 block mb-1">CVV:</label>
                        <input
                          type="password"
                          defaultValue="892"
                          maxLength={4}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="space-y-2 text-xs">
                    <label className="text-slate-300 block">Select Indian Bank:</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none">
                      <option>HDFC Bank</option>
                      <option>State Bank of India (SBI)</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-slate-800/80 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Subscription ({selectedPackage.name}):</span>
                    <span>₹{currentPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GST (18% Included):</span>
                    <span>₹0 (Inclusive)</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-slate-800">
                    <span>Total Amount Payable:</span>
                    <span className="text-emerald-400">₹{currentPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentStep('plans')}
                  className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  Back to Packages
                </button>

                <button
                  type="button"
                  disabled={isCheckingOut}
                  onClick={handleConfirmPayment}
                  className="flex-1 py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
                >
                  {isCheckingOut ? (
                    <span>Authorizing UPI Mandate...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay ₹{currentPrice.toLocaleString('en-IN')} & Activate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Confirmation */}
          {paymentStep === 'success' && (
            <div className="max-w-md mx-auto text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white font-display">
                  Subscription Activated!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  You are now upgraded to the <strong className="text-emerald-400">{selectedPackage.name}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs font-mono space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Plan:</span>
                  <span className="text-white font-bold">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-400 font-bold">₹{currentPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Billing Cycle:</span>
                  <span className="text-slate-200 capitalize">{billingCycle}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cryptographic Key Ratchet:</span>
                  <span className="text-emerald-400">Enabled (AES-256-GCM)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
              >
                Start Exploring with {selectedPackage.name}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

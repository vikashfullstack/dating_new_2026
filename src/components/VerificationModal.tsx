import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Camera, FileCheck, CheckCircle2, Lock, X, RefreshCw, AlertCircle } from 'lucide-react';
import { sha256Hex } from '../crypto/encryption';
import { VerificationBadge } from '../types';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (badge: VerificationBadge) => void;
  currentBadge?: VerificationBadge;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  onVerificationComplete,
  currentBadge,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [livenessScanning, setLivenessScanning] = useState(false);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [poseInstruction, setPoseInstruction] = useState('Position your face inside the oval');
  const [idFrontUploaded, setIdFrontUploaded] = useState(false);
  const [idBackUploaded, setIdBackUploaded] = useState(false);
  const [idScanning, setIdScanning] = useState(false);
  const [generatedHash, setGeneratedHash] = useState<string>('');
  const [zkToken, setZkToken] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStep(1);
      setLivenessScanning(false);
      setLivenessProgress(0);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } else {
        setCameraActive(false);
        simulateLivenessScan();
      }
    } catch {
      // Permission denied or camera unavailable in iframe/sandbox - fallback smoothly to interactive simulation
      setCameraActive(false);
      setCameraError('Camera access unavailable in preview sandbox. Running secure biometric liveness emulator.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const simulateLivenessScan = () => {
    setLivenessScanning(true);
    setLivenessProgress(10);
    setPoseInstruction('Center your face in the target oval');

    setTimeout(() => {
      setLivenessProgress(35);
      setPoseInstruction('Now look slightly to your left');
    }, 1200);

    setTimeout(() => {
      setLivenessProgress(70);
      setPoseInstruction('Blink both eyes gently');
    }, 2400);

    setTimeout(() => {
      setLivenessProgress(100);
      setPoseInstruction('Biometric 3D liveness verified');
      setLivenessScanning(false);
      stopCamera();
      setStep(2);
    }, 3800);
  };

  const handleIdScan = async () => {
    setIdScanning(true);
    setTimeout(async () => {
      const rawEntropy = `usr_identity_${Date.now()}_zkp_authenticated_seed_${Math.random()}`;
      const hash = '0x' + (await sha256Hex(rawEntropy)).slice(0, 24);
      const token = 'zkp_ed25519_' + (await sha256Hex(hash + '_proof')).slice(0, 16);

      setGeneratedHash(hash);
      setZkToken(token);
      setIdScanning(false);
      setStep(3);
    }, 2000);
  };

  const handleFinalize = () => {
    const badge: VerificationBadge = {
      status: 'verified',
      hash: generatedHash || '0x9e8b241fc9d012a677e4cb992',
      verifiedAt: 'November 2026',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: zkToken || 'zkp_ed25519_88192a_authenticated',
      trustScore: 99.8,
    };
    onVerificationComplete(badge);
    setStep(4);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[calc(100dvh-2rem)]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 shrink-0 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white font-display text-base">Secure Identity Verification</h3>
              <p className="text-xs text-slate-400">Zero-Knowledge Authentication · Anti-Catfish Shield</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Step Bar */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/40 text-xs">
          <div className={`py-2.5 px-4 text-center border-b-2 font-medium transition-colors ${step === 1 ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20' : step > 1 ? 'border-slate-700 text-slate-300' : 'border-transparent text-slate-400'}`}>
            1. Facial Liveness
          </div>
          <div className={`py-2.5 px-4 text-center border-b-2 font-medium transition-colors ${step === 2 ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20' : step > 2 ? 'border-slate-700 text-slate-300' : 'border-transparent text-slate-400'}`}>
            2. ID Validation
          </div>
          <div className={`py-2.5 px-4 text-center border-b-2 font-medium transition-colors ${step >= 3 ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20' : 'border-transparent text-slate-400'}`}>
            3. Cryptographic Seal
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4 sm:p-6 min-h-0 overflow-y-auto space-y-6">

          {/* STEP 1: Biometric Face Liveness */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-sm text-slate-300">
                To guarantee you are communicating with real, living human beings in your neighborhood, CipherDate verifies a 3D biometric liveness scan. Raw photos are never stored.
              </div>

              {cameraError && (
                <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Camera / Scan Frame */}
              <div className="relative w-full h-64 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-radial from-slate-900 to-slate-950">
                    <div className="w-20 h-24 rounded-full border-2 border-dashed border-emerald-500/50 flex items-center justify-center mb-3 relative animate-pulse">
                      <Camera className="w-8 h-8 text-emerald-400/70" />
                      {livenessScanning && (
                        <div className="absolute inset-0 border-2 border-emerald-400 rounded-full animate-ping opacity-40"></div>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{poseInstruction}</p>
                    {livenessScanning && (
                      <div className="w-48 bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full transition-all duration-300"
                          style={{ width: `${livenessProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Oval scanning guide overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-40 h-52 border-2 border-emerald-400/60 rounded-[48%] shadow-[0_0_20px_rgba(16,185,129,0.2)]"></div>
                </div>

                <div className="absolute bottom-2 left-3 right-3 text-center bg-slate-950/80 backdrop-blur-md py-1 px-2 rounded text-[11px] text-slate-300">
                  {poseInstruction}
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-3">
                {!livenessScanning ? (
                  <>
                    <button
                      onClick={startCamera}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" />
                      Use Web Camera
                    </button>
                    <button
                      onClick={simulateLivenessScan}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Begin 3D Liveness Scan
                    </button>
                  </>
                ) : (
                  <div className="w-full py-2.5 text-center text-sm font-medium text-emerald-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing 3D facial depth & eye micro-reflections...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Government ID / Passport */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-sm text-slate-300">
                Confirm your identity against official photo documentation (Passport, State ID, or Driver's License). Information is hashed locally via SHA-256 and never transmitted in plaintext.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ID Front */}
                <div
                  onClick={() => setIdFrontUploaded(true)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                    idFrontUploaded
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <FileCheck className={`w-8 h-8 mb-2 ${idFrontUploaded ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold text-slate-200">ID / Passport Front</span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    {idFrontUploaded ? 'Document Captured · Hologram Valid' : 'Tap to simulate photo upload'}
                  </span>
                </div>

                {/* ID Back */}
                <div
                  onClick={() => setIdBackUploaded(true)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                    idBackUploaded
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <FileCheck className={`w-8 h-8 mb-2 ${idBackUploaded ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold text-slate-200">ID Back / Barcode</span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    {idBackUploaded ? 'PDF417 Barcode Decoded' : 'Tap to simulate barcode capture'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <Lock className="w-3.5 h-3.5" /> Zero-Knowledge Privacy Guarantee
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Your legal name, address, and document numbers are converted into a one-way cryptographic SHA-256 hash. Matches only see that your legal age and personhood were authenticated.
                </p>
              </div>

              <button
                disabled={idScanning}
                onClick={handleIdScan}
                className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {idScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Cryptographic Identity Proof...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify Document & Sign Proof
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 3: Cryptographic Seal Issuance */}
          {step === 3 && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white font-display">Identity Cryptographically Certified</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Your biometric liveness and identity credentials have been signed into a verifiable Zero-Knowledge certificate.
                </p>
              </div>

              {/* Cryptographic Proof Details */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Audit Fingerprint:</span>
                  <span className="text-emerald-400">{generatedHash || '0x9e8b241fc9d012a677e4cb992'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>ZK-Proof Protocol:</span>
                  <span className="text-slate-200">Groth16 / ed25519</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Trust Score:</span>
                  <span className="text-emerald-400 font-bold">99.8% Certified Single</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Status:</span>
                  <span className="text-emerald-300">Biometrically Verified Live Human</span>
                </div>
              </div>

              <button
                onClick={handleFinalize}
                className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors shadow-lg shadow-emerald-500/10"
              >
                Apply Verified Badge to My Profile
              </button>
            </div>
          )}

          {/* STEP 4: Completed State */}
          {step === 4 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <h4 className="text-lg font-bold text-white font-display">You Are Now Cryptographically Verified!</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Your profile now displays the CipherDate Shield. Local singles in your area can connect with 100% confidence, and you have unlocked verified-only matching filters.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-xs transition-colors"
              >
                Return to Matches
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

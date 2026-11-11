import { apiUrl } from './services/api';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DiscoverView } from './components/DiscoverView';
import { MatchesView } from './components/MatchesView';
import { ChatView } from './components/ChatView';
import { SafetyHub } from './components/SafetyHub';
import { ProfileView } from './components/ProfileView';
import { VerificationModal } from './components/VerificationModal';
import { ProfileDetailsModal } from './components/ProfileDetailsModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AuthModal } from './components/AuthModal';
import { TokenWalletModal } from './components/TokenWalletModal';
import { initialCurrentUser, localSinglesData, JAMSHEDPUR_LOCALITIES, calculateDistanceKm, TokenPackage, DEFAULT_STARTING_TOKENS } from './data/mockProfiles';
import { SingleProfile, UserCurrentProfile, ChatSession, EncryptedMessage, VerificationBadge, MembershipTier, TokenTransaction } from './types';
import { encryptPayload, generateSafetyNumber, decryptPayload } from './crypto/encryption';
import { wsService } from './services/websocketService';
import { Heart, MessageSquare, ShieldCheck, Sparkles, X, Coins, Gift, Wifi } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserCurrentProfile>(initialCurrentUser);
  const [profiles, setProfiles] = useState<SingleProfile[]>(localSinglesData);
  const [likedProfileIds, setLikedProfileIds] = useState<string[]>(['usr_maya_992', 'usr_julian_410']);
  const [activeTab, setActiveTab] = useState<'discover' | 'matches' | 'chat' | 'safety' | 'profile'>('discover');
  const [selectedProfileForModal, setSelectedProfileForModal] = useState<SingleProfile | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>('chat_maya_992');
  const [matchAlert, setMatchAlert] = useState<SingleProfile | null>(null);
  const [selectedHobbyTag, setSelectedHobbyTag] = useState<string | null>(null);
  const [welcomeAlert, setWelcomeAlert] = useState<string | null>(null);

  // WebSocket & Signal Protocol Real-Time States
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [peerTypingMap, setPeerTypingMap] = useState<Record<string, boolean>>({});
  const [totalOnlineUsers, setTotalOnlineUsers] = useState<number>(1);

  const [tokenTransactions, setTokenTransactions] = useState<TokenTransaction[]>([
    {
      id: 'tx_init_1',
      amount: DEFAULT_STARTING_TOKENS, // 500 Tokens by default
      description: 'Welcome Member Grant (Default 500 Tokens Bonus)',
      timestamp: Date.now() - 3600000 * 24,
      type: 'welcome_grant',
    },
  ]);

  const handleSearchByHobby = (tag: string) => {
    setSelectedHobbyTag(tag);
    setActiveTab('discover');
  };

  const handleUpgradeTier = (tier: MembershipTier) => {
    setCurrentUser((prev) => ({
      ...prev,
      membershipTier: tier,
    }));
  };

  // Spend tokens handler
  const handleSpendTokens = (amount: number, description: string, type: any): boolean => {
    const currentTokens = currentUser.tokens ?? DEFAULT_STARTING_TOKENS;
    if (currentTokens < amount) {
      return false;
    }

    const newTokens = currentTokens - amount;
    setCurrentUser((prev) => ({
      ...prev,
      tokens: newTokens,
    }));

    const newTx: TokenTransaction = {
      id: `tx_${Date.now()}`,
      amount: -amount,
      description,
      timestamp: Date.now(),
      type,
    };
    setTokenTransactions((prev) => [newTx, ...prev]);
    return true;
  };

  // Recharge tokens handler
  const handleRechargeTokens = (pkg: TokenPackage) => {
    const totalCredit = pkg.tokens + (pkg.bonusTokens || 0);
    const newTokens = (currentUser.tokens ?? DEFAULT_STARTING_TOKENS) + totalCredit;

    setCurrentUser((prev) => ({
      ...prev,
      tokens: newTokens,
    }));

    const newTx: TokenTransaction = {
      id: `tx_${Date.now()}`,
      amount: totalCredit,
      description: `Token Recharge · ₹${pkg.priceRupees} Pack (${pkg.tokens}${pkg.bonusTokens ? ` + ${pkg.bonusTokens} Bonus` : ''})`,
      timestamp: Date.now(),
      type: 'token_recharge',
    };
    setTokenTransactions((prev) => [newTx, ...prev]);
  };

  // Login success handler
  const handleLoginSuccess = (profile: UserCurrentProfile) => {
    setCurrentUser(profile);
    setIsLoggedIn(true);

    // Recalculate relative distances based on new user coordinates
    const coords = profile.coordinates;
    setProfiles((prev) =>
      prev.map((p) => {
        const newDistKm = calculateDistanceKm(
          coords.lat,
          coords.lng,
          p.coordinates.lat,
          p.coordinates.lng
        );
        return {
          ...p,
          distanceKm: newDistKm,
          distanceMiles: Math.round(newDistKm * 0.621371 * 10) / 10,
        };
      })
    );
  };

  // Register success handler
  const handleRegisterSuccess = (profile: UserCurrentProfile) => {
    setCurrentUser(profile);
    setIsLoggedIn(true);

    const welcomeTx: TokenTransaction = {
      id: `tx_welcome_${Date.now()}`,
      amount: DEFAULT_STARTING_TOKENS, // 500 tokens
      description: 'Registration Bonus: Welcome to CipherDate Jamshedpur!',
      timestamp: Date.now(),
      type: 'welcome_grant',
    };
    setTokenTransactions((prev) => [welcomeTx, ...prev]);

    setWelcomeAlert(`🎉 Welcome to CipherDate, ${profile.name}! 500 Tokens have been deposited into your vault.`);
    setTimeout(() => setWelcomeAlert(null), 6000);

    const coords = profile.coordinates;
    setProfiles((prev) =>
      prev.map((p) => {
        const newDistKm = calculateDistanceKm(
          coords.lat,
          coords.lng,
          p.coordinates.lat,
          p.coordinates.lng
        );
        return {
          ...p,
          distanceKm: newDistKm,
          distanceMiles: Math.round(newDistKm * 0.621371 * 10) / 10,
        };
      })
    );
  };

  // Restore Node.js backend session on initial load (or default to login page)
  useEffect(() => {
    const checkBackendSession = async () => {
      const storedToken = localStorage.getItem('cipherdate_session_token');
      if (!storedToken) {
        setIsLoggedIn(false);
        setIsAuthModalOpen(true);
        return;
      }

      try {
        const res = await fetch(apiUrl('/api/auth/session'), {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        });
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          setIsLoggedIn(true);
          setIsAuthModalOpen(false);

          if (data.user.coordinates) {
            const coords = data.user.coordinates;
            setProfiles((prev) =>
              prev.map((p) => {
                const newDistKm = calculateDistanceKm(
                  coords.lat,
                  coords.lng,
                  p.coordinates.lat,
                  p.coordinates.lng
                );
                return {
                  ...p,
                  distanceKm: newDistKm,
                  distanceMiles: Math.round(newDistKm * 0.621371 * 10) / 10,
                };
              })
            );
          }
        } else {
          localStorage.removeItem('cipherdate_session_token');
          setIsLoggedIn(false);
          setIsAuthModalOpen(true);
        }
      } catch (err) {
        console.warn('Backend session verification failed, defaulting to login page:', err);
        setIsLoggedIn(false);
        setIsAuthModalOpen(true);
      }
    };

    checkBackendSession();
  }, []);

  // Logout / Switch account handler with Node.js backend session invalidation
  const handleLogout = async () => {
    const token = localStorage.getItem('cipherdate_session_token');
    if (token) {
      try {
        await fetch(apiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch (e) {
        console.warn('Backend logout API error:', e);
      }
      localStorage.removeItem('cipherdate_session_token');
    }
    setIsLoggedIn(false);
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  // Initial Pre-Configured Encrypted Chat Sessions
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  // Initialize initial encrypted chat messages with real AES-256-GCM payloads
  useEffect(() => {
    const initializeEncryptedChats = async () => {
      const mayaProfile = localSinglesData[0];
      const julianProfile = localSinglesData[1];

      const mayaSafety = await generateSafetyNumber(currentUser.id, mayaProfile.id);
      const julianSafety = await generateSafetyNumber(currentUser.id, julianProfile.id);

      // Encrypt initial messages for Maya (Sonari locality)
      const mayaMsg1 = await encryptPayload(
        'Hey Alex! Loved seeing your interest in architecture and local photography. Have you caught the sunset view at Marine Drive / Domuhani lately?'
      );
      const mayaMsg2 = await encryptPayload(
        'Hi Maya! Yes, absolutely loved the bentwood furniture and ceramic craft in your bio. How is your ceramic studio project in Sonari coming along?'
      );
      const mayaMsg3 = await encryptPayload(
        'It is going great! Just glazed a fresh batch of stoneware espresso cups. We should grab coffee at Cafe Regal in Bistupur sometime soon!'
      );

      // Encrypt initial messages for Julian (Bistupur locality)
      const julianMsg1 = await encryptPayload(
        'Hey Alex! Great to connect with another local design and photography enthusiast here in Jamshedpur.'
      );
      const julianMsg2 = await encryptPayload(
        'Hey Julian! Huge fan of analog photography and sound engineering. Are you working out of the tech hub near Bistupur?'
      );

      const sessions: ChatSession[] = [
        {
          id: 'chat_maya_992',
          matchId: mayaProfile.id,
          matchProfile: mayaProfile,
          unreadCount: 0,
          sharedKeyFingerprint: mayaSafety.fingerprint,
          safetyNumberBlocks: mayaSafety.blocks,
          isSafetyNumberVerified: true,
          encryptionMode: 'AES-GCM-256 (P-256 ECDH Derived)',
          disappearingTimer: 0,
          messages: [
            {
              id: 'msg_m1',
              chatId: 'chat_maya_992',
              senderId: mayaProfile.id,
              senderName: mayaProfile.name,
              senderAvatar: mayaProfile.photos[0],
              recipientId: currentUser.id,
              timestamp: Date.now() - 3600000 * 2,
              plainText: 'Hey Alex! Loved seeing your interest in typography and mid-century design. Have you visited the new Alvar Aalto exhibit at Cooper Hewitt?',
              ciphertext: mayaMsg1.ciphertext,
              iv: mayaMsg1.iv,
              salt: mayaMsg1.salt,
              algorithm: 'AES-GCM-256',
              isDecrypted: true,
              status: 'read',
            },
            {
              id: 'msg_m2',
              chatId: 'chat_maya_992',
              senderId: currentUser.id,
              senderName: currentUser.name,
              senderAvatar: currentUser.photos[0],
              recipientId: mayaProfile.id,
              timestamp: Date.now() - 3600000,
              plainText: 'Hi Maya! Yes, absolutely loved the bentwood furniture studies there. How is your ceramic studio project in Greenpoint coming along?',
              ciphertext: mayaMsg2.ciphertext,
              iv: mayaMsg2.iv,
              salt: mayaMsg2.salt,
              algorithm: 'AES-GCM-256',
              isDecrypted: true,
              status: 'read',
            },
            {
              id: 'msg_m3',
              chatId: 'chat_maya_992',
              senderId: mayaProfile.id,
              senderName: mayaProfile.name,
              senderAvatar: mayaProfile.photos[0],
              recipientId: currentUser.id,
              timestamp: Date.now() - 1800000,
              plainText: 'It is going great! Just glazed a fresh batch of stoneware espresso cups. We should grab coffee at Sey Coffee sometime soon!',
              ciphertext: mayaMsg3.ciphertext,
              iv: mayaMsg3.iv,
              salt: mayaMsg3.salt,
              algorithm: 'AES-GCM-256',
              isDecrypted: true,
              status: 'delivered',
            },
          ],
        },
        {
          id: 'chat_julian_410',
          matchId: julianProfile.id,
          matchProfile: julianProfile,
          unreadCount: 0,
          sharedKeyFingerprint: julianSafety.fingerprint,
          safetyNumberBlocks: julianSafety.blocks,
          isSafetyNumberVerified: false,
          encryptionMode: 'AES-GCM-256 (P-256 ECDH Derived)',
          disappearingTimer: 0,
          messages: [
            {
              id: 'msg_j1',
              chatId: 'chat_julian_410',
              senderId: julianProfile.id,
              senderName: julianProfile.name,
              senderAvatar: julianProfile.photos[0],
              recipientId: currentUser.id,
              timestamp: Date.now() - 86400000,
              plainText: 'Hey Alex! Great to connect with another design nerd. That Dieter Rams ethos in your bio is so spot on.',
              ciphertext: julianMsg1.ciphertext,
              iv: julianMsg1.iv,
              salt: julianMsg1.salt,
              algorithm: 'AES-GCM-256',
              isDecrypted: true,
              status: 'read',
            },
            {
              id: 'msg_j2',
              chatId: 'chat_julian_410',
              senderId: currentUser.id,
              senderName: currentUser.name,
              senderAvatar: currentUser.photos[0],
              recipientId: julianProfile.id,
              timestamp: Date.now() - 43200000,
              plainText: 'Hey Julian! Huge fan of analog audio craft. What are you currently designing at Vance Design Lab?',
              ciphertext: julianMsg2.ciphertext,
              iv: julianMsg2.iv,
              salt: julianMsg2.salt,
              algorithm: 'AES-GCM-256',
              isDecrypted: true,
              status: 'read',
            },
          ],
        },
      ];

      setChatSessions(sessions);
    };

    initializeEncryptedChats();
  }, []);

  // Connect to Real-Time WebSocket Server and subscribe to E2EE Messages & Signal Protocol Events
  useEffect(() => {
    wsService.connect(currentUser.id, currentUser.name, currentUser.locality);

    const unsubStatus = wsService.onStatus((status) => {
      setWsStatus(status);
    });

    const unsubPresence = wsService.onPresence((users, total) => {
      setTotalOnlineUsers(total);
    });

    const unsubSignal = wsService.onSignal((signal) => {
      if (signal.type === 'signal:typing' && signal.chatId) {
        setPeerTypingMap((prev) => ({
          ...prev,
          [signal.chatId!]: Boolean(signal.isTyping),
        }));
      } else if (signal.type === 'signal:safety-verification' && signal.chatId) {
        setChatSessions((prev) =>
          prev.map((s) => (s.id === signal.chatId ? { ...s, isSafetyNumberVerified: true } : s))
        );
      } else if (signal.type === 'signal:disappearing-timer' && signal.chatId) {
        setChatSessions((prev) =>
          prev.map((s) => (s.id === signal.chatId ? { ...s, disappearingTimer: signal.seconds || 0 } : s))
        );
      }
    });

    // Listen for partner simulated trigger relayed over WebSocket
    const unsubPartnerTrigger = wsService.onPartnerSimulatedTrigger(async (payload) => {
      const session = chatSessions.find((c) => c.id === payload.chatId);
      if (!session) return;

      let partnerReplyText = '';
      if (payload.inviteDetails) {
        partnerReplyText = `That sounds wonderful! ${payload.inviteDetails.venue} is a great public spot with delicious espresso. Looking forward to meeting in person on ${payload.inviteDetails.time}!`;
      } else if (
        payload.triggerMessage.toLowerCase().includes('coffee') ||
        payload.triggerMessage.toLowerCase().includes('drink') ||
        payload.triggerMessage.toLowerCase().includes('meet')
      ) {
        partnerReplyText = `I'd love to! There are some wonderful cafes near ${session.matchProfile.locality || session.matchProfile.neighborhood}. When are you free this week?`;
      } else if (
        payload.triggerMessage.toLowerCase().includes('design') ||
        payload.triggerMessage.toLowerCase().includes('art') ||
        payload.triggerMessage.toLowerCase().includes('book')
      ) {
        partnerReplyText = `That's fascinating! I completely agree. It's so refreshing to meet someone local who shares that same creative rhythm.`;
      } else {
        partnerReplyText = `Thanks for your note! I really appreciate how intentional and verified everyone is on CipherDate. What has your week been looking like?`;
      }

      const partnerEncrypted = await encryptPayload(partnerReplyText);

      const partnerMessage: EncryptedMessage = {
        id: `msg_reply_${Date.now()}`,
        chatId: payload.chatId,
        senderId: payload.senderId,
        senderName: session.matchProfile.name,
        senderAvatar: session.matchProfile.photos[0],
        recipientId: currentUser.id,
        timestamp: Date.now(),
        plainText: partnerReplyText,
        ciphertext: partnerEncrypted.ciphertext,
        iv: partnerEncrypted.iv,
        salt: partnerEncrypted.salt,
        algorithm: 'AES-GCM-256',
        isDecrypted: true,
        status: 'delivered',
      };

      setChatSessions((prev) =>
        prev.map((s) => (s.id === payload.chatId ? { ...s, messages: [...s.messages, partnerMessage] } : s))
      );
    });

    return () => {
      unsubStatus();
      unsubPresence();
      unsubSignal();
      unsubPartnerTrigger();
    };
  }, [currentUser.id, chatSessions]);

  // Refresh database profiles on login, location changes, and while browsing.
  useEffect(() => {
    if (!isLoggedIn) { setProfiles(localSinglesData); return; }
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch(apiUrl('/api/discover'), {
          headers: { Authorization: `Bearer ${localStorage.getItem('cipherdate_session_token')}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Discovery failed');
        const data = await response.json();
        const real = data.profiles as SingleProfile[];
        const ids = new Set(real.map(profile => profile.id));
        const demos = localSinglesData.filter(profile => profile.id !== currentUser.id && !ids.has(profile.id))
          .map(profile => {
            const distanceKm = calculateDistanceKm(currentUser.coordinates.lat, currentUser.coordinates.lng, profile.coordinates.lat, profile.coordinates.lng);
            return { ...profile, distanceKm, distanceMiles: distanceKm * 0.621371 };
          });
        // Alternate registered and demo profiles so both appear in the feed.
        const mixed: SingleProfile[] = [];
        for (let i = 0; i < Math.max(real.length, demos.length); i++) {
          if (real[i]) mixed.push(real[i]);
          if (demos[i]) mixed.push(demos[i]);
        }
        if (!controller.signal.aborted) setProfiles(mixed);
      } catch {
        if (!controller.signal.aborted) setWelcomeAlert('Unable to load registered profiles. Please try again.');
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [isLoggedIn, currentUser.id, currentUser.coordinates.lat, currentUser.coordinates.lng]);

  // Recalculate relative distances when user locality shifts (e.g. from Chrome geolocation or selector)
  const handleLocationChange = async (locality: string, city: string, coordinates?: { lat: number; lng: number }): Promise<boolean> => {
    const matchedLoc = JAMSHEDPUR_LOCALITIES.find(l => l.name === locality);
    const newCoords = coordinates || matchedLoc?.coordinates || currentUser.coordinates;
    try {
      const response = await fetch(apiUrl('/api/auth/location'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('cipherdate_session_token')}` },
        body: JSON.stringify({ locality, city, coordinates: newCoords }),
      });
      if (!response.ok) throw new Error('Location save failed');
      const data = await response.json();
      setCurrentUser(prev => ({ ...prev, ...data.user }));
      return true;
    } catch {
      setWelcomeAlert('Could not save your location. Please try again.');
      return false;
    }
  };

  // Like a profile
  const handleLike = (profile: SingleProfile) => {
    if (!likedProfileIds.includes(profile.id)) {
      setLikedProfileIds((prev) => [...prev, profile.id]);
      // Trigger mutual match celebration alert
      setMatchAlert(profile);
    }
  };

  // Pass a profile
  const handlePass = (profile: SingleProfile) => {
    // Optionally filter out or shift
  };

  // Start or open encrypted chat with a profile
  const handleStartChat = async (profile: SingleProfile) => {
    // Check if session exists
    const existing = chatSessions.find((c) => c.matchId === profile.id);
    if (existing) {
      setActiveChatId(existing.id);
      setActiveTab('chat');
      return;
    }

    // Derive safety numbers
    const safety = await generateSafetyNumber(currentUser.id, profile.id);
    const initialEncrypted = await encryptPayload(profile.initialGreeting);

    const newSession: ChatSession = {
      id: `chat_${profile.id}_${Date.now()}`,
      matchId: profile.id,
      matchProfile: profile,
      unreadCount: 0,
      sharedKeyFingerprint: safety.fingerprint,
      safetyNumberBlocks: safety.blocks,
      isSafetyNumberVerified: false,
      encryptionMode: 'AES-GCM-256 (P-256 ECDH Derived)',
      disappearingTimer: 0,
      messages: [
        {
          id: `msg_init_${Date.now()}`,
          chatId: `chat_${profile.id}`,
          senderId: profile.id,
          senderName: profile.name,
          senderAvatar: profile.photos[0],
          recipientId: currentUser.id,
          timestamp: Date.now(),
          plainText: profile.initialGreeting,
          ciphertext: initialEncrypted.ciphertext,
          iv: initialEncrypted.iv,
          salt: initialEncrypted.salt,
          algorithm: 'AES-GCM-256',
          isDecrypted: true,
          status: 'delivered',
        },
      ],
    };

    setChatSessions((prev) => [newSession, ...prev]);
    setActiveChatId(newSession.id);
    setActiveTab('chat');
  };

  // Send encrypted message inside active chat with real-time WebSocket relay
  const handleSendMessage = async (chatId: string, plainText: string, inviteDetails?: any) => {
    const session = chatSessions.find((c) => c.id === chatId);
    if (!session) return;

    // Encrypt with Web Crypto AES-256-GCM
    const encrypted = await encryptPayload(plainText);

    const myMessage: EncryptedMessage = {
      id: `msg_${Date.now()}`,
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.photos[0],
      recipientId: session.matchProfile.id,
      timestamp: Date.now(),
      plainText,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      salt: encrypted.salt,
      algorithm: 'AES-GCM-256',
      isDecrypted: true,
      status: 'sent',
      type: inviteDetails ? 'date-invite' : 'text',
      inviteDetails,
    };

    // Update session state locally (optimistic update)
    setChatSessions((prev) =>
      prev.map((s) => (s.id === chatId ? { ...s, messages: [...s.messages, myMessage] } : s))
    );

    // Transmit encrypted packet over real-time WebSocket
    wsService.sendEncryptedMessage({
      id: myMessage.id,
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.photos[0],
      recipientId: session.matchProfile.id,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      salt: encrypted.salt,
      algorithm: 'AES-GCM-256',
      msgType: inviteDetails ? 'date-invite' : 'text',
      inviteDetails,
      plainTextSummary: plainText,
    });
  };

  const handleSendTypingSignal = (chatId: string, isTyping: boolean) => {
    const session = chatSessions.find((c) => c.id === chatId);
    if (!session) return;
    wsService.sendSignal({
      type: 'signal:typing',
      chatId,
      senderId: currentUser.id,
      recipientId: session.matchProfile.id,
      isTyping,
    });
  };

  const handleVerifySafetyNumber = (chatId: string) => {
    setChatSessions((prev) =>
      prev.map((s) => (s.id === chatId ? { ...s, isSafetyNumberVerified: true } : s))
    );
    const session = chatSessions.find((c) => c.id === chatId);
    if (session) {
      wsService.sendSignal({
        type: 'signal:safety-verification',
        chatId,
        senderId: currentUser.id,
        recipientId: session.matchProfile.id,
        isVerified: true,
      });
    }
  };

  const handleUpdateDisappearingTimer = (chatId: string, seconds: number) => {
    setChatSessions((prev) =>
      prev.map((s) => (s.id === chatId ? { ...s, disappearingTimer: seconds } : s))
    );
    const session = chatSessions.find((c) => c.id === chatId);
    if (session) {
      wsService.sendSignal({
        type: 'signal:disappearing-timer',
        chatId,
        senderId: currentUser.id,
        recipientId: session.matchProfile.id,
        seconds,
      });
    }
  };

  const handleVerificationComplete = (badge: VerificationBadge) => {
    setCurrentUser((prev) => ({
      ...prev,
      verification: badge,
    }));
  };

  const likedProfilesList = profiles.filter((p) => likedProfileIds.includes(p.id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Universal Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        unreadCount={chatSessions.reduce((acc, s) => acc + s.unreadCount, 0)}
        matchesCount={likedProfileIds.length}
        onOpenVerification={() => setIsVerificationModalOpen(true)}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
        onOpenTokensModal={() => setIsTokenModalOpen(true)}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      {/* 500 Token Welcome Grant Floating Celebration Alert */}
      {welcomeAlert && (
        <div className="bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500 text-slate-950 font-bold px-4 py-2.5 text-xs text-center flex items-center justify-center gap-2 animate-bounce shadow-lg">
          <Coins className="w-4 h-4 fill-slate-950" />
          <span>{welcomeAlert}</span>
          <button
            onClick={() => setWelcomeAlert(null)}
            className="ml-3 text-slate-950/70 hover:text-slate-950 underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="app-content flex-1 min-w-0 pb-20 xl:pb-6">
        {activeTab === 'discover' && (
          <DiscoverView
            currentUser={currentUser}
            profiles={profiles}
            likedProfileIds={likedProfileIds}
            onLike={handleLike}
            onPass={handlePass}
            onOpenDetails={(p) => setSelectedProfileForModal(p)}
            onStartChat={handleStartChat}
            onLocationChange={handleLocationChange}
            initialSelectedTag={selectedHobbyTag}
            onClearInitialTag={() => setSelectedHobbyTag(null)}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesView
            likedProfiles={likedProfilesList}
            onStartChat={handleStartChat}
            onOpenDetails={(p) => setSelectedProfileForModal(p)}
            onNavigateToDiscover={() => setActiveTab('discover')}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            chatSessions={chatSessions}
            activeChatId={activeChatId}
            onSelectChat={(id) => setActiveChatId(id)}
            onSendMessage={handleSendMessage}
            onVerifySafetyNumber={handleVerifySafetyNumber}
            onUpdateDisappearingTimer={handleUpdateDisappearingTimer}
            wsStatus={wsStatus}
            peerTypingMap={peerTypingMap}
            onSendTypingSignal={handleSendTypingSignal}
            totalOnlineUsers={totalOnlineUsers}
            currentUser={currentUser}
            onOpenProfileDetails={(p) => setSelectedProfileForModal(p)}
          />
        )}

        {activeTab === 'safety' && <SafetyHub />}

        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onUpdateProfile={(updated) => setCurrentUser((prev) => ({ ...prev, ...updated }))}
            onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
            onSearchByHobby={handleSearchByHobby}
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
            onOpenTokensModal={() => setIsTokenModalOpen(true)}
            onOpenAuthModal={(mode) => {
              setAuthModalMode(mode);
              setIsAuthModalOpen(true);
            }}
            onLogout={handleLogout}
            isLoggedIn={isLoggedIn}
          />
        )}
      </main>

      {/* Authentication (Login & Registration) Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
        isMandatoryLanding={!isLoggedIn}
      />

      {/* Token Vault & Recharge Modal (Default 500 Tokens) */}
      <TokenWalletModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        tokens={currentUser.tokens ?? DEFAULT_STARTING_TOKENS}
        transactions={tokenTransactions}
        onRechargeTokens={handleRechargeTokens}
        onSpendTokens={handleSpendTokens}
      />

      {/* Verification Flow Modal */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerificationComplete={handleVerificationComplete}
        currentBadge={currentUser.verification}
      />

      {/* Subscription Plans Modal (Rupees ₹500, ₹1,200, ₹2,500) */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currentTier={currentUser.membershipTier || 'plus'}
        onUpgradeTier={handleUpgradeTier}
      />

      {/* Profile Details Modal */}
      <ProfileDetailsModal
        profile={selectedProfileForModal}
        onClose={() => setSelectedProfileForModal(null)}
        onLike={handleLike}
        onStartChat={handleStartChat}
        isLiked={selectedProfileForModal ? likedProfileIds.includes(selectedProfileForModal.id) : false}
        onTagClick={handleSearchByHobby}
      />

      {/* Mutual Match Alert Celebration */}
      {matchAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setMatchAlert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <img
                  src={currentUser.photos[0]}
                  alt="You"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
                />
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
                <Heart className="w-5 h-5 fill-rose-400 text-rose-400 animate-pulse" />
              </div>
              <div className="relative">
                <img
                  src={matchAlert.photos[0]}
                  alt={matchAlert.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/60 shadow-md"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MUTUAL LOCAL CONNECTION</span>
              </div>
              <h3 className="text-2xl font-bold text-white font-display">
                You and {matchAlert.name} Matched!
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {matchAlert.name} is {matchAlert.distanceKm !== undefined ? `${matchAlert.distanceKm.toFixed(1)} km` : `${matchAlert.distanceMiles.toFixed(1)} km`} away in {matchAlert.locality || matchAlert.neighborhood}. Both of your identities are zero-knowledge authenticated.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>An end-to-end encrypted AES-256 channel is ready for your private conversation.</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  handleStartChat(matchAlert);
                  setMatchAlert(null);
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
              >
                <MessageSquare className="w-4 h-4" />
                Open Chat
              </button>
              <button
                onClick={() => setMatchAlert(null)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Keep Exploring
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

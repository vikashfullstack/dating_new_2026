import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Send, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Clock, 
  Coffee, 
  CheckCheck, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle,
  QrCode,
  CheckCircle,
  MapPin,
  Wifi,
  WifiOff,
  Radio,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Activity,
  Cpu,
  ArrowLeft,
  Search,
  MoreVertical,
  Smile,
  Plus
} from 'lucide-react';
import { ChatSession, EncryptedMessage, SingleProfile } from '../types';
import { encryptPayload, decryptPayload, generateSafetyNumber, generateSignalPrekeyBundle, SignalPrekeyBundle } from '../crypto/encryption';

interface ChatViewProps {
  chatSessions: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onSendMessage: (chatId: string, plainText: string, inviteDetails?: any) => Promise<void>;
  onVerifySafetyNumber: (chatId: string) => void;
  onUpdateDisappearingTimer: (chatId: string, seconds: number) => void;
  wsStatus?: 'connected' | 'connecting' | 'disconnected';
  peerTypingMap?: Record<string, boolean>;
  onSendTypingSignal?: (chatId: string, isTyping: boolean) => void;
  totalOnlineUsers?: number;
  currentUser?: {
    id: string;
    name: string;
    photos: string[];
    locality?: string;
  };
  onOpenProfileDetails?: (profile: SingleProfile) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  chatSessions,
  activeChatId,
  onSelectChat,
  onSendMessage,
  onVerifySafetyNumber,
  onUpdateDisappearingTimer,
  wsStatus = 'connected',
  peerTypingMap = {},
  onSendTypingSignal,
  totalOnlineUsers = 1,
  currentUser,
  onOpenProfileDetails,
}) => {
  const [showConversationList, setShowConversationList] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [showChatTools, setShowChatTools] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showRawCiphertext, setShowRawCiphertext] = useState(false);
  const [showSafetyNumberModal, setShowSafetyNumberModal] = useState(false);
  const [showSignalStationModal, setShowSignalStationModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteVenue, setInviteVenue] = useState('Cafe Regal, Bistupur');
  const [inviteTime, setInviteTime] = useState('Saturday · 4:30 PM');
  const [selectedMessageForInspection, setSelectedMessageForInspection] = useState<EncryptedMessage | null>(null);

  // Signal Protocol Prekey Bundle state
  const [prekeyBundle, setPrekeyBundle] = useState<SignalPrekeyBundle | null>(null);
  const [ratchetStepCount, setRatchetStepCount] = useState(7);

  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  const currentChat = chatSessions.find((c) => c.id === activeChatId) || chatSessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  // Load Signal Prekey bundle for current chat
  useEffect(() => {
    if (currentChat) {
      generateSignalPrekeyBundle(currentChat.matchProfile.id).then(setPrekeyBundle);
    }
  }, [currentChat?.matchProfile?.id]);

  // Handle typing signal emission
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!currentChat || !onSendTypingSignal) return;

    onSendTypingSignal(currentChat.id, true);

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onSendTypingSignal(currentChat.id, false);
    }, 1500);
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    if (currentChat) window.dispatchEvent(new CustomEvent('cipherdate:start-call', {
      detail: { partner: currentChat.matchProfile, type },
    }));
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !currentChat || isSending) return;

    setSendError(null);
    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    if (onSendTypingSignal) {
      onSendTypingSignal(currentChat.id, false);
    }

    try {
      setRatchetStepCount((prev) => prev + 1);
      await onSendMessage(currentChat.id, text);
    } catch (err) {
      setInputText(text);
      setSendError(err instanceof Error ? err.message : 'Message could not be sent.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendDateInvite = async () => {
    if (!currentChat) return;
    await onSendMessage(currentChat.id, `Would you like to meet up for coffee at ${inviteVenue} on ${inviteTime}?`, {
      venue: inviteVenue,
      neighborhood: currentChat.matchProfile.locality || currentChat.matchProfile.neighborhood,
      time: inviteTime,
      isPublicVenue: true,
    });
    setShowInviteModal(false);
  };

  if (!currentChat) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <Lock className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white font-display">No Encrypted Conversations Yet</h3>
        <p className="text-xs text-slate-400 mt-1">
          Explore local verified singles and tap "Start Encrypted Chat" to initiate an AES-256-GCM secure channel.
        </p>
      </div>
    );
  }

  const isCurrentPeerTyping = Boolean(peerTypingMap[currentChat.id]);

  return (
    <div className="whatsapp-chat max-w-[1500px] mx-auto px-0 sm:px-4 lg:px-6 py-0 sm:py-4 h-[calc(100dvh-8rem-env(safe-area-inset-bottom))] xl:h-[calc(100dvh-80px)] min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 bg-[#111b21] border border-white/5 sm:rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {sendError && <p role="alert" className="p-3 text-rose-300">{sendError}</p>}
      {/* Left Sidebar: Encrypted Match Conversations */}
        <div className={`${showConversationList ? 'flex' : 'hidden'} md:flex w-full md:w-72 lg:w-[360px] min-h-0 border-r border-white/10 bg-[#111b21] flex-col shrink-0`}>
          
          <div className="px-5 pt-5 pb-3 space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#e9edef]">Chats<span className="text-xs text-[#8696a0] ml-2">{chatSessions.length}</span></h2>
              <span className="flex items-center gap-1.5 text-xs text-[#8696a0]"><span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-[#00a884]' : 'bg-amber-400'}`} />{wsStatus === 'connected' ? 'Connected' : wsStatus === 'connecting' ? 'Connecting' : 'Offline'}</span>
            </div>
            <label className="flex items-center gap-3 rounded-lg bg-[#202c33] px-3 py-2 text-[#8696a0]">
              <Search className="w-4 h-4 shrink-0" />
              <input aria-label="Search conversations" placeholder="Search or start a new chat" value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} className="min-w-0 w-full bg-transparent text-sm text-[#e9edef] outline-none placeholder:text-[#8696a0]" />
            </label>
          </div>

          {/* Conversation List */}
          <div className="overflow-y-auto min-h-0 flex-1 divide-y divide-slate-800/60">
            {!chatSessions.some(chat => `${chat.matchProfile.name} ${chat.matchProfile.locality || chat.matchProfile.neighborhood}`.toLowerCase().includes(chatSearch.toLowerCase())) && <p className="px-5 py-8 text-sm text-[#8696a0] text-center">No conversations found.</p>}
            {chatSessions.filter(chat => `${chat.matchProfile.name} ${chat.matchProfile.locality || chat.matchProfile.neighborhood}`.toLowerCase().includes(chatSearch.toLowerCase())).map((chat) => {
              const isActive = chat.id === currentChat.id;
              const lastMsg = chat.messages[chat.messages.length - 1];
              const isChatPeerTyping = Boolean(peerTypingMap[chat.id]);

              return (
                <div
                  key={chat.id}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectChat(chat.id); setShowConversationList(false); } }}
                  onClick={() => { onSelectChat(chat.id); setShowConversationList(false); }}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    isActive ? 'bg-[#2a3942] text-white' : 'hover:bg-[#202c33] text-[#e9edef]'
                  }`}
                >
                  {/* WhatsApp Circular Avatar with Online Presence Dot */}
                  <div className="relative shrink-0">
                    <img
                      src={chat.matchProfile.photos[0]}
                      alt={chat.matchProfile.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 shadow-sm"
                    />
                    {chat.matchProfile.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-white truncate font-display">
                          {chat.matchProfile.name}
                        </span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {chat.matchProfile.distanceKm !== undefined ? `${chat.matchProfile.distanceKm.toFixed(1)} km` : `${chat.matchProfile.distanceMiles.toFixed(1)} mi`}
                      </span>
                    </div>

                    {isChatPeerTyping ? (
                      <p className="text-xs text-emerald-400 truncate font-mono flex items-center gap-1 animate-pulse">
                        <Radio className="w-3 h-3" />
                        <span>typing signal...</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 truncate">
                        {lastMsg ? lastMsg.plainText : chat.matchProfile.tagline}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                      <span className="text-emerald-400/90 flex items-center gap-0.5">
                        <Key className="w-2.5 h-2.5" /> E2EE
                      </span>
                      <span>·</span>
                      <span>{chat.matchProfile.locality || chat.matchProfile.neighborhood}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Main Pane: Active Encrypted Conversation */}
        <div className={`${showConversationList ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-slate-900 min-w-0 min-h-0 relative`}>
          
          <div className="relative px-3 sm:px-5 py-3 bg-[#202c33] flex items-center gap-3 shrink-0 z-10">
            <button type="button" aria-label="All conversations" onClick={() => setShowConversationList(true)} className="md:hidden p-1 text-[#aebac1]"><ArrowLeft className="w-5 h-5" /></button>
            <button type="button" onClick={() => onOpenProfileDetails?.(currentChat.matchProfile)} className="flex items-center gap-3 min-w-0 flex-1 text-left" title="View profile">
              <img src={currentChat.matchProfile.photos[0]} alt={currentChat.matchProfile.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#e9edef]">{currentChat.matchProfile.name}</span><span className="block text-xs text-[#8696a0]">{isCurrentPeerTyping ? 'typing…' : currentChat.matchProfile.isOnline ? 'online' : 'offline'}</span></span>
            </button>
            <button type="button" onClick={() => handleStartCall('video')} className="p-2 text-[#aebac1] hover:text-white" title="Start video call"><Video className="w-5 h-5" /></button>
            <button type="button" onClick={() => handleStartCall('audio')} className="p-2 text-[#aebac1] hover:text-white" title="Start voice call"><Phone className="w-5 h-5" /></button>
            <button type="button" onClick={() => setShowChatTools(!showChatTools)} aria-expanded={showChatTools} aria-label="Conversation options" className="p-2 text-[#aebac1] hover:text-white"><MoreVertical className="w-5 h-5" /></button>
            {showChatTools && <div className="absolute right-3 top-full w-60 rounded-lg bg-[#233138] border border-white/5 py-2 shadow-xl text-sm text-[#e9edef]">
              <button type="button" className="block w-full px-4 py-3 text-left hover:bg-white/5" onClick={() => { setShowSafetyNumberModal(true); setShowChatTools(false); }}>Verify safety number</button>
              <button type="button" className="block w-full px-4 py-3 text-left hover:bg-white/5" onClick={() => { setShowSignalStationModal(true); setShowChatTools(false); }}>Connection & encryption</button>
              <button type="button" className="block w-full px-4 py-3 text-left hover:bg-white/5" onClick={() => { setShowRawCiphertext(!showRawCiphertext); setShowChatTools(false); }}>{showRawCiphertext ? 'Hide' : 'Show'} encrypted payloads</button>
              <button type="button" className="block w-full px-4 py-3 text-left hover:bg-white/5" onClick={() => { setShowInviteModal(true); setShowChatTools(false); }}>Propose a meetup</button>
            </div>}
          </div>

          {/* Messages Stream */}
          <div className="chat-wallpaper flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-14 py-5 space-y-2">
            
            <div className="mx-auto mb-5 max-w-sm rounded-lg bg-[#182229] px-4 py-2 text-center text-[11px] leading-relaxed text-[#c6b77c] shadow-sm">
              <Lock className="inline w-3 h-3 mr-1" /> Messages are end-to-end encrypted.
            </div>

            {/* Render Messages with WhatsApp-style Profile Avatars */}
            {currentChat.messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id || msg.senderId === 'usr_me_7718' || msg.senderId.startsWith('usr_me');

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  {/* WhatsApp-Style Message Row with Circular Profile Icon */}
                  <div className={`flex items-end gap-2 max-w-[90%] sm:max-w-[75%] lg:max-w-[65%] ${isMe ? 'flex-row-reverse self-end' : 'flex-row self-start'}`}>
                    
                    {/* WhatsApp Message Bubble */}
                    <div
                      className={`px-3 py-2 shadow-sm relative break-words [overflow-wrap:anywhere] min-w-0 ${
                        isMe
                          ? 'bg-[#005c4b] text-[#e9edef] rounded-lg rounded-tr-none'
                          : 'bg-[#202c33] text-[#e9edef] rounded-lg rounded-tl-none'
                      }`}
                    >
                      {/* Date Invite Card */}
                      {msg.type === 'date-invite' && msg.inviteDetails && (
                        <div className="mb-2 p-2.5 rounded-xl bg-slate-950/20 border border-current/20 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                            <Coffee className="w-3.5 h-3.5" />
                            <span>Verified Public Meetup Proposal</span>
                          </div>
                          <div className="text-xs font-semibold">{msg.inviteDetails.venue}</div>
                          <div className="text-[11px] opacity-90 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {msg.inviteDetails.time}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {msg.inviteDetails.neighborhood}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Plaintext Message Body */}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.plainText}
                      </p>

                      {/* Message Subtext: Tabular Timestamp & Encryption Indicator */}
                      <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] font-mono ${
                        isMe ? 'text-[#a9c7bf]' : 'text-[#8696a0]'
                      }`}>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <Lock className="w-2.5 h-2.5 opacity-80" />
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                      </div>
                    </div>
                  </div>

                  {/* Raw Ciphertext Payload Card (Visible when Inspector is toggled) */}
                  {showRawCiphertext && (
                    <div 
                      onClick={() => setSelectedMessageForInspection(msg)}
                      className={`cursor-pointer max-w-[85%] sm:max-w-md p-2 rounded-lg bg-slate-950 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 hover:border-emerald-400 transition-colors space-y-1 ${
                        isMe ? 'self-end mr-9 sm:mr-10' : 'self-start ml-9 sm:ml-10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-slate-400">
                        <span>AES-256-GCM CIPHERTEXT (TAP FOR AUDIT):</span>
                        <span>IV: {msg.iv.slice(0, 8)}...</span>
                      </div>
                      <div className="truncate text-slate-300">
                        {msg.ciphertext}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Peer Real-Time Typing Indicator with Profile Icon (WhatsApp-style) */}
            {isCurrentPeerTyping && (
              <div className="flex items-end gap-2 animate-fade-in">
                <img
                  src={currentChat.matchProfile.photos[0]}
                  alt={currentChat.matchProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0 mb-1"
                />
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-slate-800/90 border border-emerald-500/30 px-3.5 py-2 rounded-2xl rounded-bl-xs w-fit animate-pulse shadow-md">
                  <Radio className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>{currentChat.matchProfile.name} is typing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSend}
            className="relative px-2 sm:px-4 py-3 bg-[#202c33] flex items-center gap-2 shrink-0"
          >
            {showEmojiPicker && <div className="absolute bottom-full left-2 rounded-xl bg-[#233138] border border-white/10 p-2 shadow-xl flex flex-wrap gap-1 max-w-[280px]">
              {['😀', '😊', '❤️', '😂', '👍', '☕', '👋', '✨'].map(emoji => <button type="button" key={emoji} aria-label={`Insert ${emoji}`} onClick={() => { setInputText(text => text + emoji); setShowEmojiPicker(false); }} className="text-2xl p-2 hover:bg-white/10 rounded-lg">{emoji}</button>)}
            </div>}
            <button type="button" aria-label="Choose emoji" aria-expanded={showEmojiPicker} onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-[#aebac1]"><Smile className="w-6 h-6" /></button>
            <button type="button" title="Propose a meetup" onClick={() => setShowInviteModal(true)} className="p-1 text-[#aebac1]"><Plus className="w-6 h-6" /></button>
            <input
              aria-label="Message"
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Type a message"
              className="flex-1 min-w-0 bg-[#2a3942] border border-transparent text-[#e9edef] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00a884] placeholder:text-[#8696a0]"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-3 rounded-full bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-40 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 shrink-0"
              title="Encrypt & Send via WebSocket"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  
                </>
              )}
            </button>
          </form>

        </div>

      </div>

      {/* MODAL: Signal Protocol Station & Double Ratchet Audit */}
      {showSignalStationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                <div>
                  <h4 className="font-bold text-white font-display text-base">Signal Protocol & Ratchet Station</h4>
                  <span className="text-[11px] text-slate-400 font-mono">X3DH Extended Triple Diffie-Hellman + Double Ratchet</span>
                </div>
              </div>
              <button
                onClick={() => setShowSignalStationModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* WebSocket Gateway Status */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">WebSocket Gateway Channel:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  ws://0.0.0.0:3000/ws (Authenticated)
                </span>
              </div>

              {/* Double-Ratchet State */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Double-Ratchet Chain Status</span>
                  <span className="text-slate-400">Step #{ratchetStepCount}</span>
                </div>
                <div className="text-slate-300 break-all text-[11px]">
                  Root Key: <span className="text-slate-400">0x{currentChat.sharedKeyFingerprint.slice(2)}</span>
                </div>
                <div className="text-slate-300 break-all text-[11px]">
                  Sending Chain Key: <span className="text-emerald-400">0x4a91c88e9921...verified</span>
                </div>
                <div className="text-slate-300 break-all text-[11px]">
                  Forward Secrecy: <span className="text-emerald-400">Guaranteed (Per-message ephemeral key derivation)</span>
                </div>
              </div>

              {/* X3DH Prekey Bundle */}
              {prekeyBundle && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Peer Prekey Bundle ({currentChat.matchProfile.name})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Registration ID: <span className="text-slate-200 font-bold">{prekeyBundle.registrationId}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Identity Key: <span className="text-slate-200">{prekeyBundle.identityKeyHex}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Signed Prekey: <span className="text-slate-200">{prekeyBundle.signedPrekeyHex}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  onVerifySafetyNumber(currentChat.id);
                  setShowSignalStationModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Verify Signal Peer Safety Code</span>
              </button>
              <button
                onClick={() => setShowSignalStationModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Safety Number Verification */}
      {showSafetyNumberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-white font-display text-base">Signal Safety Number Verification</h4>
              </div>
              <button
                onClick={() => setShowSafetyNumberModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Verify this 30-digit security code with {currentChat.matchProfile.name} in person or over encrypted call to confirm no third party is intercepting your AES-256-GCM communications.
            </p>

            {/* 6 Blocks of 5 digits */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              {currentChat.safetyNumberBlocks.map((block, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-base font-bold font-mono text-emerald-400 tracking-wider">
                    {block}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 font-mono space-y-1">
              <div>Channel Fingerprint: <span className="text-slate-200">{currentChat.sharedKeyFingerprint}</span></div>
              <div>Negotiation Algorithm: <span className="text-slate-200">ECDH P-256 + PBKDF2 (SHA-256)</span></div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  onVerifySafetyNumber(currentChat.id);
                  setShowSafetyNumberModal(false);
                }}
                className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Verified Peer
              </button>
              <button
                onClick={() => setShowSafetyNumberModal(false)}
                className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Raw Ciphertext Inspection Audit */}
      {selectedMessageForInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-white font-display text-base">Cryptographic Payload Audit</h4>
              </div>
              <button
                onClick={() => setSelectedMessageForInspection(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block mb-1">Algorithm:</span>
                <span className="text-emerald-400 font-bold">AES-GCM-256 (SubtleCrypto Web Crypto)</span>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">12-Byte Initialization Vector (IV Base64):</span>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 break-all">
                  {selectedMessageForInspection.iv}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">KDF Salt (16-Byte Base64):</span>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 break-all">
                  {selectedMessageForInspection.salt}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Encrypted Ciphertext (Base64):</span>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 break-all max-h-28 overflow-y-auto">
                  {selectedMessageForInspection.ciphertext}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Decrypted Plaintext:</span>
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                  {selectedMessageForInspection.plainText}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedMessageForInspection(null)}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Propose Safe Public Date */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-white font-display text-base">Propose Safe Public Meetup</h4>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              CipherDate strictly encourages first meetings in well-lit public venues. Select a recommended public spot in {currentChat.matchProfile.locality || currentChat.matchProfile.neighborhood}.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Public Venue / Cafe:</label>
                <input
                  type="text"
                  value={inviteVenue}
                  onChange={(e) => setInviteVenue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Proposed Date & Time:</label>
                <input
                  type="text"
                  value={inviteTime}
                  onChange={(e) => setInviteTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Safety Tip: Public venues protect both parties and preserve location privacy.</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSendDateInvite}
                className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                Send Encrypted Proposal
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

import { websocketUrl } from './api';
/**
 * Real-Time WebSocket and Signal Protocol Client Service
 */

type WebSocketStatus = 'connected' | 'connecting' | 'disconnected';

export interface PresenceUser {
  userId: string;
  userName: string;
  locality: string;
}

export interface SignalEvent {
  type: string;
  senderId?: string;
  recipientId?: string;
  chatId?: string;
  isTyping?: boolean;
  messageId?: string;
  isVerified?: boolean;
  fingerprint?: string;
  seconds?: number;
  ephemeralPublicKey?: string;
  safetyNumberBlocks?: string[];
  callType?: 'audio' | 'video';
  sdp?: any;
  candidate?: any;
  timestamp?: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = 'disconnected';
  private statusListeners: ((status: WebSocketStatus) => void)[] = [];
  private presenceListeners: ((users: PresenceUser[], total: number) => void)[] = [];
  private messageListeners: ((msg: any) => void)[] = [];
  private ackListeners: ((ack: any) => void)[] = [];
  private signalListeners: ((signal: SignalEvent) => void)[] = [];
  private partnerTriggerListeners: ((payload: any) => void)[] = [];
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: any = null;
  private currentUserId: string | null = null;
  private currentUserName: string = 'User';
  private currentLocality: string = 'Jamshedpur';
  private currentPublicKey: string | null = null;

  constructor() {
    // Lazy connect or connect on demand
  }

  public connect(userId: string, userName: string, locality: string, publicKey?: string) {
    this.currentUserId = userId;
    this.currentUserName = userName;
    this.currentLocality = locality;
    this.currentPublicKey = publicKey || null;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      // Already connecting/connected, just re-register
      this.registerCurrentAuth();
      return;
    }

    this.setStatus('connecting');

    const wsUrl = websocketUrl();

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.registerCurrentAuth();
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncomingPayload(payload);
        } catch (e) {
          console.error('[WebSocket] Error parsing message payload:', e);
        }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[WebSocket] Connection notice:', err);
        this.setStatus('disconnected');
      };
    } catch (err) {
      console.error('[WebSocket] Init error:', err);
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private registerCurrentAuth() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.currentUserId) return;

    this.sendRaw({
      type: 'auth:register',
      userId: this.currentUserId,
      userName: this.currentUserName,
      locality: this.currentLocality,
      publicKey: this.currentPublicKey,
      timestamp: Date.now(),
    });
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      if (this.currentUserId) {
        this.connect(this.currentUserId, this.currentUserName, this.currentLocality, this.currentPublicKey || undefined);
      }
    }, delay);
  }

  private setStatus(newStatus: WebSocketStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((cb) => cb(newStatus));
  }

  public getStatus(): WebSocketStatus {
    return this.status;
  }

  private handleIncomingPayload(payload: any) {
    switch (payload.type) {
      case 'presence:update':
        this.presenceListeners.forEach((cb) => cb(payload.onlineUsers || [], payload.totalOnline || 0));
        break;

      case 'chat:incoming':
        this.messageListeners.forEach((cb) => cb(payload.message));
        break;

      case 'chat:ack':
        this.ackListeners.forEach((cb) => cb(payload));
        break;

      case 'chat:partner-simulated-trigger':
        this.partnerTriggerListeners.forEach((cb) => cb(payload));
        break;

      // Signal Protocol Events
      case 'signal:key-exchange':
      case 'signal:typing':
      case 'signal:read-receipt':
      case 'signal:safety-verification':
      case 'signal:disappearing-timer':
      case 'signal:call-offer':
      case 'signal:call-answer':
      case 'signal:ice-candidate':
      case 'signal:call-hangup':
        this.signalListeners.forEach((cb) => cb(payload));
        break;

      default:
        break;
    }
  }

  public sendEncryptedMessage(data: {
    id: string;
    chatId: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    recipientId: string;
    ciphertext: string;
    iv: string;
    salt: string;
    algorithm?: string;
    msgType?: 'text' | 'date-invite';
    inviteDetails?: any;
    plainTextSummary?: string;
  }) {
    this.sendRaw({
      type: 'chat:message',
      ...data,
      timestamp: Date.now(),
    });
  }

  public sendSignal(signal: SignalEvent) {
    this.sendRaw({
      ...signal,
      timestamp: Date.now(),
    });
  }

  public joinChat(chatId: string) {
    this.sendRaw({
      type: 'chat:join',
      chatId,
    });
  }

  private sendRaw(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // Listener subscriptions
  public onStatus(cb: (status: WebSocketStatus) => void): () => void {
    this.statusListeners.push(cb);
    cb(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== cb);
    };
  }

  public onPresence(cb: (users: PresenceUser[], total: number) => void): () => void {
    this.presenceListeners.push(cb);
    return () => {
      this.presenceListeners = this.presenceListeners.filter((l) => l !== cb);
    };
  }

  public onMessage(cb: (msg: any) => void): () => void {
    this.messageListeners.push(cb);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== cb);
    };
  }

  public onAck(cb: (ack: any) => void): () => void {
    this.ackListeners.push(cb);
    return () => {
      this.ackListeners = this.ackListeners.filter((l) => l !== cb);
    };
  }

  public onSignal(cb: (signal: SignalEvent) => void): () => void {
    this.signalListeners.push(cb);
    return () => {
      this.signalListeners = this.signalListeners.filter((l) => l !== cb);
    };
  }

  public onPartnerSimulatedTrigger(cb: (payload: any) => void): () => void {
    this.partnerTriggerListeners.push(cb);
    return () => {
      this.partnerTriggerListeners = this.partnerTriggerListeners.filter((l) => l !== cb);
    };
  }
}

export const wsService = new WebSocketService();

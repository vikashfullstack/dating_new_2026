export const GENDER_OPTIONS = ['Male', 'Female', 'Transgender', 'Non-binary', 'Prefer not to say'] as const;
export type Gender = typeof GENDER_OPTIONS[number];
export const LGBTQ_OPTIONS = ['Yes', 'No', 'Prefer not to say'] as const;
export type LgbtqIdentity = typeof LGBTQ_OPTIONS[number];

export type VerificationStatus = 'verified' | 'pending' | 'unverified';

export interface VerificationBadge {
  status: VerificationStatus;
  hash: string;
  verifiedAt: string;
  method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan';
  zkProofToken: string;
  trustScore: number; // 98-100%
}

export interface SingleProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  locality: string; // e.g. 'Adityapur', 'Sonari', 'Kadma', 'Mango', 'Chandil'
  neighborhood: string; // alias to locality
  coordinates: { lat: number; lng: number };
  distanceKm: number; // distance in kilometers relative to active locality
  distanceMiles: number; // backward compatibility
  bio: string;
  tagline: string;
  occupation: string;
  companyOrStudio?: string;
  education: string;
  height: string;
  intent: 'Long-term Partnership' | 'Meaningful Dating' | 'Coffee & Conversation' | 'Spontaneous Exploration';
  passions: string[];
  lifestyle: string[];
  photos: string[];
  videos?: string[];
  verification: VerificationBadge;
  matchCompatibility: number; // e.g. 96%
  initialGreeting: string;
  isOnline: boolean;
}

export interface EncryptedMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  timestamp: number;
  plainText: string;
  ciphertext: string; // Base64 AES-GCM 256
  iv: string;         // Base64 12-byte initialization vector
  salt: string;       // Base64 KDF salt
  authTag?: string;   // GCM authentication tag
  algorithm: 'AES-GCM-256';
  isDecrypted: boolean;
  status: 'sent' | 'delivered' | 'read';
  disappearingTimerSeconds?: number;
  type?: 'text' | 'date-invite';
  inviteDetails?: {
    venue: string;
    neighborhood: string;
    time: string;
    isPublicVenue: boolean;
  };
}

export interface ChatSession {
  id: string;
  matchId: string;
  matchProfile: SingleProfile;
  lastMessage?: EncryptedMessage;
  unreadCount: number;
  sharedKeyFingerprint: string;
  safetyNumberBlocks: string[];
  isSafetyNumberVerified: boolean;
  encryptionMode: 'AES-GCM-256 (P-256 ECDH Derived)';
  disappearingTimer: number; // 0 = off, 3600 = 1h, 86400 = 24h
  messages: EncryptedMessage[];
}

export type MembershipTier = 'free' | 'essential' | 'plus' | 'elite';

export interface SubscriptionPackage {
  id: 'essential' | 'plus' | 'elite';
  name: string;
  tagline: string;
  monthlyPriceRupees: number;
  annualPriceRupeesPerMonth: number;
  popular?: boolean;
  features: string[];
  connectionLimit: string;
  badgeTitle: string;
}

export interface TokenTransaction {
  id: string;
  amount: number; // positive for credit (e.g. +500), negative for debit (e.g. -25)
  description: string;
  timestamp: number;
  type: 'welcome_grant' | 'daily_reward' | 'priority_chat' | 'super_like' | 'locality_boost' | 'token_recharge';
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  age: number;
  locality: string;
  city: string;
  tokens: number;
  gender?: Gender;
  lgbtqIdentity?: LgbtqIdentity;
  intent?: string;
  photo?: string;
  bio?: string;
  passions?: string[];
  membershipTier: MembershipTier;
  createdAt: number;
}

export interface UserCurrentProfile {
  gender?: Gender;
  lgbtqIdentity?: LgbtqIdentity;
  id: string;
  email?: string;
  tokens: number; // Defaults to 500 tokens
  name: string;
  age: number;
  city: string;
  locality: string; // e.g. 'Adityapur', 'Sonari', 'Kadma', 'Mango', 'Chandil'
  neighborhood: string;
  coordinates: { lat: number; lng: number };
  bio: string;
  occupation: string;
  intent: 'Long-term Partnership' | 'Meaningful Dating' | 'Coffee & Conversation' | 'Spontaneous Exploration';
  passions: string[];
  photos: string[];
  videos?: string[];
  verification: VerificationBadge;
  maxDistanceRadiusMiles: number;
  maxDistanceRadiusKm?: number;
  ageRange: [number, number];
  onlyVerifiedMatches: boolean;
  membershipTier?: MembershipTier;
}

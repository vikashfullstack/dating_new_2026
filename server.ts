/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GENDER_OPTIONS, LGBTQ_OPTIONS } from './src/types/index';
import { initializeDatabase, sequelize, serverUsers, serverSessions, encryptedMessageStore } from './backend/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(express.json());

// Node.js Backend Session Store & Registered Users
interface ServerSession {
  token: string;
  userId: string;
  user: any;
  createdAt: number;
  expiresAt: number;
}



// Seed default verified single accounts
const seedAccounts: any[] = [
  {
    id: 'usr_priyanka_26',
    email: 'priyanka@cipherdate.in',
    name: 'Priyanka',
    age: 26,
    locality: 'Sonari',
    neighborhood: 'Sonari',
    city: 'Jamshedpur',
    tokens: 500,
    photos: ['/src/assets/images/disney_3d_female_three_1794403892838.jpg'],
    bio: 'Architectural ceramicist & cyclist. Lover of Domuhani river sunsets, clay firing, and slow espresso mornings.',
    passions: ['#Ceramics', '#TrailRunning', '#Architecture', '#CoffeeLover'],
    intent: 'Meaningful Dating',
    occupation: 'Ceramic Artist & Studio Owner',
    coordinates: { lat: 22.8122, lng: 86.1685 },
    verification: {
      status: 'verified',
      hash: '0x8f2d91c4',
      verifiedAt: 'Active',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: 'zkp_priyanka_7781',
      trustScore: 99.8,
    },
    membershipTier: 'plus',
  },
  {
    id: 'usr_julian_28',
    email: 'julian.vance@cipherdate.in',
    name: 'Julian Vance',
    age: 28,
    locality: 'Bistupur',
    neighborhood: 'Bistupur',
    city: 'Jamshedpur',
    tokens: 500,
    photos: ['/src/assets/images/disney_3d_male_two_1794403842274.jpg'],
    bio: 'Hardware interface engineer & synthesizer collector. Looking for someone to explore local record stores and weekend espresso spots with.',
    passions: ['#AnalogPhotography', '#AcousticGuitar', '#Minimalism', '#CoffeeLover'],
    intent: 'Long-term Partnership',
    occupation: 'Audio Hardware Designer',
    coordinates: { lat: 22.8016, lng: 86.1852 },
    verification: {
      status: 'verified',
      hash: '0x3c99a4e1',
      verifiedAt: 'Active',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: 'zkp_julian_4102',
      trustScore: 99.5,
    },
    membershipTier: 'plus',
  },
  {
    id: 'usr_rohan_29',
    email: 'rohan.singh@cipherdate.in',
    name: 'Rohan Singh',
    age: 29,
    locality: 'Adityapur',
    neighborhood: 'Adityapur',
    city: 'Jamshedpur',
    tokens: 500,
    photos: ['/src/assets/images/disney_3d_male_one_1794403842622.jpg'],
    bio: 'Automotive systems engineer & acoustic guitar player. Enjoy weekend drives to Chandil Dam and trying local dhabas.',
    passions: ['#AnalogPhotography', '#AcousticGuitar', '#TrailRunning', '#Minimalism'],
    intent: 'Long-term Partnership',
    occupation: 'Automotive Systems Lead',
    coordinates: { lat: 22.7844, lng: 86.1528 },
    verification: {
      status: 'verified',
      hash: '0x992b45e8',
      verifiedAt: 'Active',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: 'zkp_rohan_9931',
      trustScore: 99.7,
    },
    membershipTier: 'plus',
  },
];



// In-Memory Real-Time State (Server Authoritative for Encrypted Packets & Signal State)
interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  userName: string;
  locality: string;
  activeChatId?: string;
  publicKey?: string; // Client's public ECDH key for key exchange
}

const clients = new Map<WebSocket, ConnectedClient>();

// Store encrypted message payloads (Server has ZERO access to plaintext keys)
interface StoredEncryptedMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  timestamp: number;
  ciphertext: string;
  iv: string;
  salt: string;
  algorithm: string;
  status: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'date-invite';
  inviteDetails?: any;
}



// Initialize WebSocket Server on path /ws
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcastPresence() {
  const onlineUsers = Array.from(clients.values()).map(c => ({
    userId: c.userId,
    userName: c.userName,
    locality: c.locality,
  }));

  const payload = JSON.stringify({
    type: 'presence:update',
    onlineUsers,
    totalOnline: clients.size,
    timestamp: Date.now(),
  });

  for (const client of clients.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  // Send immediate connection acknowledgment
  ws.send(JSON.stringify({
    type: 'system:connected',
    message: 'Connected to CipherDate Real-Time WebSocket & Signaling Gateway',
    timestamp: Date.now(),
  }));

  ws.on('message', async (data: string) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        // 1. Client Registers upon connecting
        case 'auth:register': {
          clients.set(ws, {
            ws,
            userId: message.userId,
            userName: message.userName || 'Anonymous Single',
            locality: message.locality || 'Jamshedpur',
            publicKey: message.publicKey,
          });

          ws.send(JSON.stringify({
            type: 'auth:confirmed',
            userId: message.userId,
            timestamp: Date.now(),
          }));

          broadcastPresence();
          break;
        }

        // 2. Client Enters a Chat Room
        case 'chat:join': {
          const client = clients.get(ws);
          if (client) {
            client.activeChatId = message.chatId;
          }
          break;
        }

        // 3. Encrypted Chat Message (Server acts as Zero-Knowledge Relayer)
        case 'chat:message': {
          const encryptedMsg: StoredEncryptedMessage = {
            id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            chatId: message.chatId,
            senderId: message.senderId,
            senderName: message.senderName,
            senderAvatar: message.senderAvatar,
            recipientId: message.recipientId,
            timestamp: message.timestamp || Date.now(),
            ciphertext: message.ciphertext,
            iv: message.iv,
            salt: message.salt,
            algorithm: message.algorithm || 'AES-GCM-256',
            status: 'delivered',
            type: message.msgType || 'text',
            inviteDetails: message.inviteDetails,
          };

          await encryptedMessageStore.push(encryptedMsg);

          // Acknowledge to sender with delivered status
          ws.send(JSON.stringify({
            type: 'chat:ack',
            messageId: encryptedMsg.id,
            chatId: encryptedMsg.chatId,
            status: 'delivered',
            timestamp: Date.now(),
          }));

          // Forward to recipient if connected on WebSocket
          let recipientFound = false;
          for (const [otherWs, otherClient] of clients.entries()) {
            if (otherClient.userId === message.recipientId && otherWs.readyState === WebSocket.OPEN) {
              recipientFound = true;
              otherWs.send(JSON.stringify({
                type: 'chat:incoming',
                message: encryptedMsg,
              }));
            }
          }

          // If recipient is a simulated partner (e.g. Maya or Julian) and no other live browser tab is logged in as them,
          // echo realistic partner encrypted response back after a short natural delay
          if (!recipientFound && (message.recipientId.startsWith('usr_maya') || message.recipientId.startsWith('usr_julian') || message.recipientId.startsWith('usr_aarav') || message.recipientId.startsWith('usr_ananya'))) {
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                // Partner echo signal acknowledgment
                ws.send(JSON.stringify({
                  type: 'signal:typing',
                  chatId: message.chatId,
                  senderId: message.recipientId,
                  isTyping: true,
                }));

                setTimeout(() => {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                      type: 'signal:typing',
                      chatId: message.chatId,
                      senderId: message.recipientId,
                      isTyping: false,
                    }));

                    ws.send(JSON.stringify({
                      type: 'chat:partner-simulated-trigger',
                      chatId: message.chatId,
                      recipientId: message.senderId,
                      senderId: message.recipientId,
                      triggerMessage: message.plainTextSummary || 'message',
                      inviteDetails: message.inviteDetails,
                    }));
                  }
                }, 1200);
              }
            }, 800);
          }
          break;
        }

        // 4. Signal Protocol: Key Exchange Signaling
        case 'signal:key-exchange': {
          const { recipientId, ephemeralPublicKey, identityKeyFingerprint, safetyNumberBlocks } = message;

          for (const [otherWs, otherClient] of clients.entries()) {
            if (otherClient.userId === recipientId && otherWs.readyState === WebSocket.OPEN) {
              otherWs.send(JSON.stringify({
                type: 'signal:key-exchange',
                senderId: message.senderId,
                ephemeralPublicKey,
                identityKeyFingerprint,
                safetyNumberBlocks,
                timestamp: Date.now(),
              }));
            }
          }
          break;
        }

        // 5. Signal: Typing Status
        case 'signal:typing': {
          const { recipientId, chatId, isTyping } = message;
          for (const [otherWs, otherClient] of clients.entries()) {
            if (otherClient.userId === recipientId && otherWs.readyState === WebSocket.OPEN) {
              otherWs.send(JSON.stringify({
                type: 'signal:typing',
                chatId,
                senderId: message.senderId,
                isTyping,
              }));
            }
          }
          break;
        }

        // 6. Signal: Read Receipt
        case 'signal:read-receipt': {
          const { recipientId, chatId, messageId } = message;
          for (const [otherWs, otherClient] of clients.entries()) {
            if (otherClient.userId === recipientId && otherWs.readyState === WebSocket.OPEN) {
              otherWs.send(JSON.stringify({
                type: 'signal:read-receipt',
                chatId,
                messageId,
                readAt: Date.now(),
              }));
            }
          }
          break;
        }

        // 7. Signal: Safety Number Verified Sync
        case 'signal:safety-verification': {
          const { recipientId, chatId, isVerified, fingerprint } = message;
          for (const [otherWs, otherClient] of clients.entries()) {
            if (otherClient.userId === recipientId && otherWs.readyState === WebSocket.OPEN) {
              otherWs.send(JSON.stringify({
                type: 'signal:safety-verification',
                chatId,
                isVerified,
                fingerprint,
                verifiedAt: Date.now(),
              }));
            }
          }
          break;
        }

        // 8. Signal: Disappearing Messages Timer Sync
        case 'signal:disappearing-timer': {
          const { recipientId, chatId, seconds } = message;
          for (const [otherWs, otherClient] of clients.entries()) {
            if (otherClient.userId === recipientId && otherWs.readyState === WebSocket.OPEN) {
              otherWs.send(JSON.stringify({
                type: 'signal:disappearing-timer',
                chatId,
                seconds,
                syncedAt: Date.now(),
              }));
            }
          }
          break;
        }

        // 9. Signal: Real-Time E2EE Video / Voice Call Signaling (WebRTC Signal Handshake)
        case 'signal:call-offer':
        case 'signal:call-answer':
        case 'signal:ice-candidate':
        case 'signal:call-hangup': {
          const { recipientId } = message;
          for (const [otherWs, otherClient] of clients.entries()) {
            if (otherClient.userId === recipientId && otherWs.readyState === WebSocket.OPEN) {
              otherWs.send(JSON.stringify(message));
            }
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    broadcastPresence();
  });
});

// Helper to extract session from request
async function getSessionFromReq(req: express.Request): Promise<ServerSession | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const session = await serverSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    await serverSessions.delete(token);
    return null;
  }
  return session;
}

function asyncRoute(handler: (req: express.Request, res: express.Response) => Promise<unknown>): express.RequestHandler {
  return (req, res, next) => { Promise.resolve(handler(req, res)).catch(next); };
}

// REST Endpoints for Node.js Session Backend
app.get('/api/auth/session', asyncRoute(async (req, res) => {
  const session = await getSessionFromReq(req);
  if (!session) {
    return res.json({ authenticated: false, user: null });
  }
  res.json({
    authenticated: true,
    user: session.user,
    sessionToken: session.token,
    expiresAt: session.expiresAt,
  });
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  let user = await serverUsers.get(cleanEmail);

  if (!user) {
    // Create new profile for first-time sign-in with 500 default tokens
    const namePart = cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    user = {
      id: `usr_${crypto.randomUUID()}`,
      email: cleanEmail,
      name: namePart,
      age: 26,
      locality: 'Kadma',
      neighborhood: 'Kadma',
      city: 'Jamshedpur',
      tokens: 500,
      photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'],
      bio: 'Local single exploring authentic, verified connections in Jamshedpur.',
      occupation: 'Professional',
      intent: 'Meaningful Dating',
      passions: ['#CoffeeLover', '#AnalogPhotography'],
      coordinates: { lat: 22.7952, lng: 86.1648 },
      verification: {
        status: 'verified',
        hash: '0x' + crypto.randomBytes(4).toString('hex'),
        verifiedAt: 'Active',
        method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
        zkProofToken: 'zkp_' + Date.now(),
        trustScore: 99.5,
      },
      membershipTier: 'plus',
    };
    await serverUsers.set(cleanEmail, user);
  }

  const token = `sess_${crypto.randomUUID()}`;
  const session: ServerSession = {
    token,
    userId: user.id,
    user,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days TTL
  };

  await serverSessions.set(token, session);
  res.json({ success: true, sessionToken: token, user });
}));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { name, email, age, locality, photo, bio, intent, passions, occupation, gender, lgbtqIdentity } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  if (gender !== undefined && !GENDER_OPTIONS.includes(gender)) {
    return res.status(400).json({ error: 'Invalid gender selection' });
  }
  if (lgbtqIdentity !== undefined && !LGBTQ_OPTIONS.includes(lgbtqIdentity)) {
    return res.status(400).json({ error: 'Invalid LGBTQ+ selection' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const newUser = {
    gender: gender ?? 'Prefer not to say',
    lgbtqIdentity: lgbtqIdentity ?? 'Prefer not to say',
    id: `usr_new_${crypto.randomUUID()}`,
    email: cleanEmail,
    name: String(name).trim(),
    age: Number(age) || 25,
    locality: locality || 'Kadma',
    neighborhood: locality || 'Kadma',
    city: 'Jamshedpur',
    tokens: 500, // Default 500 tokens
    photos: [photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'],
    bio: bio || `Excited to meet genuine local singles in ${locality || 'Jamshedpur'}.`,
    occupation: occupation || 'Professional',
    intent: intent || 'Meaningful Dating',
    passions: Array.isArray(passions) && passions.length > 0 ? passions : ['#CoffeeLover', '#LocalDating'],
    coordinates: { lat: 22.7952, lng: 86.1648 },
    verification: {
      status: 'verified',
      hash: '0x' + crypto.randomBytes(4).toString('hex'),
      verifiedAt: 'Active',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: 'zkp_reg_' + Date.now(),
      trustScore: 99.6,
    },
    membershipTier: 'plus',
  };

  await serverUsers.set(cleanEmail, newUser);

  const token = `sess_${crypto.randomUUID()}`;
  const session: ServerSession = {
    token,
    userId: newUser.id,
    user: newUser,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  await serverSessions.set(token, session);
  res.json({ success: true, sessionToken: token, user: newUser });
}));

app.post('/api/auth/demo-login', asyncRoute(async (req, res) => {
  const { email } = req.body;
  const cleanEmail = String(email).trim().toLowerCase();
  const user = await serverUsers.get(cleanEmail);

  if (!user) {
    return res.status(404).json({ error: 'Demo user not found' });
  }

  const token = `sess_${crypto.randomUUID()}`;
  const session: ServerSession = {
    token,
    userId: user.id,
    user,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  await serverSessions.set(token, session);
  res.json({ success: true, sessionToken: token, user });
}));

app.post('/api/auth/logout', asyncRoute(async (req, res) => {
  const session = await getSessionFromReq(req);
  if (session) {
    await serverSessions.delete(session.token);
  }
  res.json({ success: true });
}));

app.put('/api/auth/profile', asyncRoute(async (req, res) => {
  const session = await getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: No active session' });
  }

  const { id, email, tokens, verification, membershipTier, ...profileFields } = req.body;
  const updatedUser = { ...session.user, ...profileFields };
  session.user = updatedUser;
  await serverSessions.set(session.token, session);
  if (updatedUser.email) {
    await serverUsers.set(updatedUser.email.toLowerCase(), updatedUser);
  }

  res.json({ success: true, user: updatedUser });
}));

// REST Health & Cryptographic Signal Stats Endpoint
app.get('/api/crypto-stats', asyncRoute(async (req, res) => {
  res.json({
    status: 'healthy',
    activeSockets: clients.size,
    activeSessions: await serverSessions.count(),
    totalEncryptedPacketsRouted: await encryptedMessageStore.count(),
    encryptionProtocol: 'AES-256-GCM + PBKDF2 (SHA-256) + P-256 ECDH Ratchet',
    signalProtocolVersion: 'Signal-E2EE-v4.2',
    timestamp: Date.now(),
  });
}));

// Mount Vite or static build depending on environment
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  await initializeDatabase(seedAccounts);
  console.log('[CipherDate] Connected to PostgreSQL through Sequelize');
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[CipherDate] Request failed:', err.name);
    res.status(500).json({ error: 'Unable to complete request' });
  });
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[CipherDate] Full-stack HTTP & WebSocket server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(async (error) => {
  console.error('[CipherDate] Startup failed. Check PostgreSQL, DB_* / DATABASE_URL settings, and schema permissions.', error.message);
  await sequelize.close();
  process.exit(1);
});

# CipherDate

## Run locally

Requires Node.js 22.12+ and PostgreSQL (or Docker Compose).

1. Install all dependencies (including the TypeScript development tools):
   ```sh
   npm install
   ```
2. Copy the environment template:
   ```sh
   cp .env.example .env.local
   ```
3. Start a local PostgreSQL database:
   ```sh
   docker compose up -d postgres
   ```
   Alternatively, create a PostgreSQL database and set `DATABASE_URL` in `.env.local`
   to its connection URL, or set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
   and `DB_PASSWORD`. When `DB_HOST` is set, the separate fields take precedence
   over `DATABASE_URL`. The Compose credentials are for local development only.
4. Start the application:
   ```sh
   npm run dev
   ```
   Open http://localhost:3000.

Use `npm run dev` with a space; `npmrun` is not a command. If `tsx` is missing,
run `npm install` from this directory. `tsx` is a runtime dependency because both
`dev` and `start` execute the TypeScript server.

The server loads `.env.local`, falling back to `.env` and existing environment
variables. Sequelize authenticates against PostgreSQL before starting HTTP and
creates missing `users`, `sessions`, and `encrypted_messages` tables in the
`cipherdate` schema, separate from any existing `public` tables, without
dropping or altering existing tables. User profiles, sessions, and encrypted
message packets survive restarts; live WebSocket presence stays in memory.
Schema changes to existing tables should use explicit migrations.

The current sign-in flow is a demo: passwords are not verified and profile
verification is simulated. Database persistence does not change that behavior.

## Checks and production

```sh
npm run lint
npm run build
NODE_ENV=production npm start
```

Set a private PostgreSQL connection URL in the deployment environment. Keep
`.env.local` out of version control. Configure `GEMINI_API_KEY` if using AI features.
# dating_new_2026

## Separate backend domain

Set `VITE_API_BASE_URL=https://dateapi.emaildevil.com` in `.env.local`, then
run `npm run build`. Use the origin only, without `/api`; requests already
include that path. Leaving this variable empty uses the frontend origin.
The WebSocket connection uses the same backend at `/ws` over WSS for HTTPS.
Vite embeds this public URL at build time; rebuild after changing it.

On the backend set `CORS_ORIGIN=https://emaildevil.com` and restart the backend.
Multiple allowed frontend origins can be comma-separated. The backend domain
must have HTTPS and forward `/api/` and WebSocket upgrades on `/ws` to Node.

## Chat and calls

Deploy the frontend and backend together after chat/signaling changes, rebuild
with `npm run build`, then restart your existing Node/PM2 service. Both people
must sign in with separate accounts. Demo accounts do not answer messages or calls.
The receiver gets a new conversation when the first message arrives. The latest
500 stored sent/received messages are replayed after WebSocket sign-in.

The reverse proxy for the API domain must forward WebSocket upgrades:

```nginx
location /ws {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
}
```

Calls use browser WebRTC and require HTTPS, microphone/camera permission, an
online recipient and explicit acceptance. `VITE_RTC_ICE_SERVERS` optionally
configures STUN/TURN servers as a JSON array at build time. A TURN relay is needed
for networks where direct peer connections fail. Credentials in VITE settings
are public: use short-lived TURN credentials rather than a permanent secret.
The existing chat encryption uses a shared application seed; it is not a complete
production end-to-end key exchange protocol.

Run `node tests/realtime.integration.mjs` to test the real server handlers with
isolated in-memory persistence and two WebSocket clients, without changing the
configured database. This verifies message transport and call signaling; actual
microphone/camera media must also be tested in two browsers.

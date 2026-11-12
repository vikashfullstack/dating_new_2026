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

### Sound alerts while the site is open

After signing in, tap **Enable sounds** on each phone/browser page. New incoming
messages play a chime, and incoming calls ring until accepted, declined, ended,
or timed out. **Mute alerts** silences both. Restored chat history does not chime.
Browsers require the initial tap to allow audio; tap Enable sounds again after a
reload or if the browser suspends audio. The recipient must stay signed in with
the site open. These alerts do not wake a locked phone or a closed browser.

Run `node --import tsx tests/notification-sounds.ts` for sound lifecycle tests.

### Mobile call relay setup

The backend now serves authenticated, non-cached `/api/rtc/config` responses.
Set `TURN_URLS` and `TURN_SHARED_SECRET` on the backend to use a coturn-compatible
REST relay. It generates credentials valid for one hour; the shared secret stays
on the server. Restart the backend after changing these settings. Rebuild and
deploy the frontend to use this endpoint and the ICE ordering/retry fixes.
Without TURN settings the app still attempts direct calls using STUN, which can
fail across mobile carrier NATs. Changing the error message alone cannot fix this.

For self-hosting, use a public server with coturn and DNS such as
`turn.example.com`. Configure `use-auth-secret`, `static-auth-secret` (matching
`TURN_SHARED_SECRET`), `realm`, `fingerprint`, and a bounded relay port range
(e.g. `min-port=49160`, `max-port=49200`). Allow inbound TCP/UDP 3478 and the
UDP relay range in both the host firewall and cloud security group. Configure
`external-ip` mapping when the relay host is behind NAT. For TLS, install a valid
certificate and key on coturn and expose TCP 5349; a dedicated TCP 443 listener
can help on networks blocking other ports. TURN is a separate protocol and cannot
be served through the app's ordinary HTTP reverse proxy. Keep shared secrets in
private server configuration, outside Git. Consult the official coturn manual:
https://github.com/coturn/coturn/blob/master/README.turnserver

Example backend settings (replace the hostname and secret):

```dotenv
TURN_URLS=turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp,turns:turn.example.com:5349?transport=tcp
TURN_SHARED_SECRET=your-private-coturn-secret
```

Verify audio and video with two signed-in devices on different networks, including
mobile data. A real relay allocation and media transfer are required to validate
the deployment; unit/signaling tests cannot establish external TURN reachability.

### Generate and run the coturn service

On the public Linux relay host, from this checkout, run:

```sh
node scripts/setup-turn.mjs --hostname turn.example.com --public-ip YOUR_PUBLIC_IPV4
```

If the cloud server has a private interface behind a public NAT, add
`--relay-ip YOUR_PRIVATE_IPV4`. This creates `.turn/compose.yaml`,
`.turn/turnserver.conf`, and `.turn/backend.env` with a matching random shared
secret. The directory is private and ignored by Git. Rerunning preserves the
secret. The Node backend loads `.turn/backend.env` automatically at startup;
existing process environment variables take precedence. If Node and coturn run
on separate hosts, securely copy only `.turn/backend.env` to the Node host's
checkout, keeping the directory private (700) and file private (600).

Point the TURN hostname's DNS A record at the relay public IPv4. Use DNS-only
mode if your DNS provider offers an HTTP proxy. Allow TCP/UDP 3478 and UDP
49160–49200 through the host firewall and cloud security group. This relay range
is a starting allocation limit; expand it for higher call concurrency.

For TLS, provide a readable certificate directory. The default filenames are
`fullchain.pem` and `privkey.pem`; `--tls-cert` and `--tls-key` accept paths relative
to that directory. Mount the complete certificate tree if files are symlinks:

```sh
node scripts/setup-turn.mjs --hostname turn.example.com --public-ip YOUR_PUBLIC_IPV4 --tls-dir /etc/letsencrypt --tls-cert live/turn.example.com/fullchain.pem --tls-key live/turn.example.com/privkey.pem
```

The container runs as the user who generates the files; that user must be able
to read the certificate and key. Generate as the intended service user. Open TCP
5349 for TLS. Renew certificates using your existing certificate tooling, then
restart coturn so it rereads them. Without TLS options, only UDP/TCP 3478 URLs
are advertised; TLS endpoints are never advertised without certificate files.

Start and inspect the relay (Docker Compose v2 on Linux):

```sh
docker compose -f .turn/compose.yaml up -d
docker compose -f .turn/compose.yaml ps
docker compose -f .turn/compose.yaml logs --tail 50 coturn
```

Restart the existing Node service and deploy a freshly built frontend. The relay
uses host networking for UDP performance, REST credential authentication,
restricted peer ranges, a read-only filesystem and bounded logs. Existing
PostgreSQL Compose services are independent. Shut down only the relay with
`docker compose -f .turn/compose.yaml down`.

Run `node tests/turn-setup.mjs`, `node --import tsx tests/rtc.ts`, and
`node tests/realtime.integration.mjs` to check generation, credentials and the
app signaling/API path. Then verify an actual two-device audio/video call over
mobile data and Wi-Fi; a relay candidate must be selected to prove TURN works.

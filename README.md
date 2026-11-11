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

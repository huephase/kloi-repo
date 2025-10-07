# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- TypeScript Fastify web app with server-side Handlebars views and static assets
- PostgreSQL (via Prisma) and Redis (sessions) are required for local development
- Theming via subdomain detection; wizard-style flow protected by session hooks

Commands
- Requirements
  - Node >= 18 (see package.json engines)
  - Copy .env.example to .env and configure values for local usage
  - Start services (Postgres, Redis) using Docker Compose

- Install
  ```bash path=null start=null
  npm ci
  ```

- Start dev server (with ts-node + nodemon)
  ```bash path=null start=null
  npm run dev
  ```

- Build (TypeScript compile + copy views)
  ```bash path=null start=null
  npm run build
  ```

- Start (after build)
  ```bash path=null start=null
  npm start
  ```

- Lint / Format
  ```bash path=null start=null
  npm run lint
  npm run format
  ```

- Tests (Jest)
  - Full test run
    ```bash path=null start=null
    npm test
    ```
  - Single test file
    ```bash path=null start=null
    npx jest path/to/your.test.ts
    ```
  - Filter by test name
    ```bash path=null start=null
    npx jest -t "test name substring"
    ```

- Prisma (via package scripts)
  ```bash path=null start=null
  npm run prisma:generate
  npm run prisma:migrate
  ```

- Docker Compose (local stack: app + Postgres + Redis)
  ```bash path=null start=null
  # start db and redis and app (dev container)
  docker compose up -d

  # view logs
  docker compose logs -f app

  # rebuild app container
  docker compose up --build app
  ```

Key endpoints and ports
- App: http://localhost:3000
- Health check dashboard: GET /kloiserverhealthcheck
- API samples (prefix registered at /api):
  - GET /api/server-time
  - GET /api/booked-dates
  - GET /api/db-test (diagnostics)

High-level architecture
- Entry point: src/app.ts
  - Configures Fastify using src/config/fastify.ts
  - Registers Handlebars view engine and serves static assets from public/
  - Sets up sessions via @fastify/session with a custom Redis-backed SessionStore (src/lib/session-store.ts using src/lib/redis.ts)
  - Adds detectThemeFromSubdomain preHandler to attach a theme based on the request hostname (src/lib/themeDetector.ts)
  - Registers a splash/landing route for / resolving theme assets under public/themes/{theme}
  - Registers health check routes early (src/routes/healthCheck.ts), then aggregates remaining routes via src/routes/index.ts
  - Global error handler returns JSON for unhandled errors

- Routing
  - src/routes/index.ts composes feature routes and applies session protection to wizard pages via validateWizardSession (src/hooks/sessionHooks.ts)
  - Public entry routes: landingPage, locationFinder
  - Wizard routes (session-protected): event-details, date-picker, event-setup, etc.
  - API router mounted at /api (src/routes/api)
    - Validation with Zod schemas in src/schemas
    - Database access via Prisma client (src/lib/prisma.ts)

- Rendering and assets
  - Handlebars templates in src/views with layouts/ and partials/
  - Static files in public/ (global CSS/JS, themed splash pages in public/themes)

- Data layer
  - Prisma schema: prisma/schema.prisma (PostgreSQL)
    - Models include Customers, Session, Menus, and kloiOrdersTable
    - OrderStatus enum supports lifecycle states
  - Prisma client singleton pattern prevents multiple instances during hot reload in dev

- Sessions
  - @fastify/session configured with Redis store (TTL configurable via REDIS_SESSION_TTL)
  - Session hook validateWizardSession enforces wizard flow ordering by checking session state

- Configuration and logging
  - src/config/fastify.ts centralizes Fastify options (logger, trustProxy, limits)
  - src/lib/logger.ts provides a pino-backed logger with console fallback

Environment configuration
- See .env.example for required variables:
  - Server: PORT, HOST, NODE_ENV
  - Database: DATABASE_URL
  - Redis: REDIS_URL, REDIS_SESSION_SECRET, REDIS_SESSION_TTL
  - Integrations: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
  - Theming/Security: THEME_DEFAULT, SESSION_COOKIE_NAME, SESSION_COOKIE_SECURE, SESSION_COOKIE_HTTP_ONLY
  - Misc: BASE_URL, GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_ID

Notes
- README.md currently contains minimal content; the authoritative development commands and architecture overview are in this file.

# DealPilot

AI shopping assistant and US price comparison app for the PayPal AI Hackathon.

Built from the [PayPal × AG Grid boilerplate](https://github.com/paypaldev/hackathon-paypal-ag-grid-boilerplate).

## Current build

- Live Channel3 search / browse / similar + AG Grid offers
- In-app PayPal checkout (`/product/[id]/buy`)
- **Real watchlist**, alerts (+ optional Resend email), AI buy timings
- **Bryntum Calendar** on `/watchlist` (no demo events)
- Wallet shows real DealPilot PayPal purchases
- Shopping agent chat (search / alerts / PayPal Q&A)
- Claude timing when `ANTHROPIC_API_KEY` has credits; else price rules

## Phase 2

- Live Channel3 US search (text), URL lookup, photo search
- Product detail with offers in AG Grid, variant selectors
- Server-only Channel3 client (`lib/channel3.ts`) with 3-hour response cache
- Seeded catalog kept as fallback if the API fails

## Phase 1

- Next.js App Router + TypeScript + Tailwind + AG Grid
- Prisma schema, auth shell, UI pages, seed data
- Boilerplate PayPal/AG Studio routes under `/dashboard`

## Setup

```bash
cd paypal
cp env.example .env   # or keep your existing .env
docker compose up -d
npx prisma migrate dev
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000

## Env

See `env.example`. Keep secrets in `.env` only (git-ignored).

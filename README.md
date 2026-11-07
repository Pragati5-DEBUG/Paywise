# DealPilot

AI shopping assistant and US price comparison app for the PayPal AI Hackathon.

Built from the [PayPal × AG Grid boilerplate](https://github.com/paypaldev/hackathon-paypal-ag-grid-boilerplate).

## Sponsors

Shoppers see Paywise. These tools run underneath.

- **PayPal** takes the payment. The gold button on `/product/[id]/buy` creates a sandbox order (`lib/paypal.ts`, `app/api/paypal/create-order`). The return page captures it, and the Wallet stores the purchase. `/dashboard` and the endpoint pages (`/balances`, `/invoices`, `/transactions`, `/products`, `/plans`) read the sandbox account.
- **Channel3** is the catalog. Search, category and brand browse, photo search, URL lookup, similar products, and the price history behind the buy-or-wait gauge all come from `lib/channel3.ts` and `lib/catalog.ts`.
- **AG Grid** draws the comparison tables: store offers on the product page, the Watchlist, the Wallet, and the dashboard endpoint grids.
- **AG Studio** is the report builder on `/dashboard`, including the assistant wired to OpenAI.
- **Bryntum** is the calendar on `/watchlist`. It shows saved alerts, buy windows, and checkouts.
- **Anthropic** can write the buy-timing note stored for that calendar (`lib/ai-timing.ts`) when `ANTHROPIC_API_KEY` is set. The gauge on the product page uses price rules either way.
- **Resend** sends the alert confirmation and the later price-drop email (`lib/email.ts`). On the test sender, delivery only works to the inbox that owns the Resend account.
- **OpenAI** answers inside the AG Studio dashboard through `app/api/ai/responses`.



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



<img width="1441" height="776" alt="Screenshot 2026-11-08 003530" src="https://github.com/user-attachments/assets/5377c68f-1a56-42ec-973e-7028eb9b58c8" />
<img width="1472" height="632" alt="Screenshot 2026-11-08 003737" src="https://github.com/user-attachments/assets/7f409097-8bbf-4a7b-8520-384648aac309" />
<img width="447" height="355" alt="Screenshot 2026-11-08 003753" src="https://github.com/user-attachments/assets/060fad73-82ad-437e-bdd1-223ec3e43cf5" />

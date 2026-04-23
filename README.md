# Meeting Rails

AI-powered structured meeting facilitator with timed sections, audio cues, attendance tracking, and compliance reporting.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up database
pnpm prisma migrate dev
pnpm prisma db seed

# Start development server
pnpm dev
```

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL via Prisma
- **Auth:** NextAuth.js v5 with Google OAuth
- **Payments:** Stripe
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Environment Variables

See `.env.example` for all required variables.

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
4. Copy Client ID and Client Secret to `.env.local`

### Stripe Setup

1. Create a [Stripe account](https://dashboard.stripe.com)
2. Copy your API keys to `.env.local`
3. Create products/prices for Pro and Enterprise plans
4. Set up webhook endpoint: `https://your-domain.com/api/v1/webhooks/stripe`
5. Listen for events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`

## Deployment

This project is configured for Vercel:

1. Push to GitHub
2. Import into Vercel
3. Add environment variables in Vercel dashboard
4. Set up Vercel Postgres
5. Run `prisma migrate deploy` after first deployment

## License

Proprietary — Sage Veterinary Imaging

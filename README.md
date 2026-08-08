# XPDX Rentals

XPDX Rentals is a long-term cargo van hire website for XPDX based in Condell Park, Sydney. The site offers fleet browsing, enquiry submission, programmatic SEO landing pages, and an admin dashboard for managing leads, vans, blog posts and settings.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Actions, `src/proxy.ts` middleware)
- **Styling**: Tailwind CSS v4, shadcn/ui, Framer Motion, Lenis smooth scroll
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, SSR auth)
- **Map**: Leaflet / react-leaflet with CARTO dark tiles
- **3D Viewer**: Three.js / @react-three/fiber (lazy-loaded, demand-only)
- **Rich Text**: CKEditor 5 (admin blog editor)
- **Email**: Nodemailer (SMTP / AWS SES)
- **Rate Limiting & Cache**: ioredis (optional — degrades gracefully without REDIS_URL)
- **Anti-Spam**: Cloudflare Turnstile (optional), honeypot field, time-to-submit check
- **Analytics**: Google Tag Manager (GTM-M7BWGFK5 default)

## Project Structure

```text
src/
├── app/
│   ├── (public)/         # Marketing pages, fleet, programmatic SEO
│   ├── admin/            # Staff dashboard (leads, vans, blog, settings)
│   ├── admin-login/      # Login page
│   ├── auth/             # Supabase OAuth callbacks
│   ├── api/
│   │   ├── v1/           # Public API (enquiries, CTA click tracking)
│   │   ├── cron/         # Scheduled jobs (lead reminders)
│   │   └── health/       # Health check endpoint
│   ├── geo-blocked/      # Geo-restriction landing page
│   └── offline/          # PWA offline fallback
├── components/           # UI components (public, admin, fleet, animations, SEO)
├── hooks/                # Custom React hooks
└── lib/                  # Core logic (auth, data, email, SEO, security, Redis)
public/                   # Static assets (videos, images, 3D model, van photos)
supabase/                 # Database migrations and config
scripts/                  # Developer utilities (media optimisation, SEO audit, security audit)
docs/                     # Architectural documentation and runbooks
```

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   # Fill in at minimum: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create an optimised production build |
| `npm run start` | Run the production build (port 3100) |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit/property tests |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run test:rls` | Run Supabase RLS integration tests (requires live project) |
| `npm run db:types` | Regenerate TypeScript types from linked Supabase project |

## Deployment (Vercel)

The project deploys to Vercel with zero configuration beyond setting environment variables. See [`.env.example`](.env.example) for the complete list. Key variables:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-only admin key |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public site URL (for SEO canonicals and email links) |
| `REDIS_URL` | Recommended | Distributed rate limiting and read cache |
| `CRON_SECRET` | Recommended | Authenticates `/api/cron/reminders` |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Optional | Transactional email |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Optional | Cloudflare Turnstile bot protection |

## Documentation

- [Codebase Guide](docs/CODEBASE_GUIDE.md)
- [Database Schema](docs/DATABASE.md)
- [API Reference](docs/API.md)
- [Deployment & Operations](docs/DEPLOYMENT.md)
- [SEO Strategy](docs/SEO.md)
- [Security Boundaries](docs/SECURITY.md)

# Placement Portal - Setup Guide

## Prerequisites

- Node.js 18+ or Bun 1.0+
- PostgreSQL database (Neon recommended)
- Cloudflare R2 account (for file storage)
- SMTP server or email service (for notifications)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd placement-next
bun install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# For migrations (direct connection without pooler)
DIRECT_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="Placement Portal <noreply@example.com>"

# Cloudflare R2 Storage
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="placement-portal"
R2_PUBLIC_URL=""

# Push Notifications (VAPID Keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_EMAIL="mailto:admin@example.com"

# Cron Job Security
CRON_SECRET="your-cron-secret"
```

### 3. Generate VAPID Keys (for Push Notifications)

```bash
npx web-push generate-vapid-keys
```

Copy the generated keys to your `.env` file.

### 4. Database Setup

```bash
# Generate Prisma Client
bun run db:generate

# Run migrations
bun run db:migrate

# (Optional) Open Prisma Studio
bun run db:studio
```

### 5. Run Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set:
- `NEXTAUTH_URL` to your production domain
- `DATABASE_URL` with connection pooling enabled
- All other required environment variables

### Cron Jobs

The project uses Vercel Cron for scheduled tasks:
- `/api/cron/deadline-reminders` - Runs hourly to send deadline reminders

Configure in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/deadline-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with Turbopack |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run lint:fix` | Fix ESLint errors |
| `bun run db:generate` | Generate Prisma Client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:studio` | Open Prisma Studio |
| `bun run db:push` | Push schema changes (dev) |

## Project Structure

```
placement-next/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── applications/      # Student applications
│   ├── dashboard/         # Student dashboard
│   ├── jobs/              # Job listings
│   ├── notifications/     # Notifications page
│   ├── profile/           # Profile management
│   └── settings/          # User settings
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   ├── ui/                # shadcn/ui components
│   └── ...                # Feature components
├── docs/                  # Documentation
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── prisma/                # Database schema & migrations
├── providers/             # React context providers
├── public/                # Static assets
└── types/                 # TypeScript type definitions
```

## Troubleshooting

### Database Connection Issues

1. Ensure your `DATABASE_URL` is correct
2. For Neon, add `?sslmode=require` to the connection string
3. If using connection pooling, use the pooler URL for `DATABASE_URL`

### Push Notifications Not Working

1. Verify VAPID keys are set correctly
2. Check browser supports Service Workers
3. Ensure HTTPS is enabled (required for push notifications)

### Build Errors

```bash
# Clear cache and rebuild
bun run clean
bun install
bun run build
```

## Support

For issues and feature requests, please open an issue on GitHub.

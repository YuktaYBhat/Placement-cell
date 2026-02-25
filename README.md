# Placement Portal

A modern placement management system built with Next.js 15, Prisma, and shadcn/ui.

## Features

- 🎓 **Student Management** - Profile management, KYC verification, document uploads
- 💼 **Job Postings** - Tier-based job listings with eligibility criteria
- 📝 **One-Click Applications** - Simplified application process
- 📊 **Admin Dashboard** - Analytics, student management, placement tracking
- 🔔 **Push Notifications** - Browser notifications for deadlines and updates
- 📅 **Event Scheduling** - Calendar integration with QR-based attendance
- 📧 **Email Notifications** - Automated emails for important updates

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: NextAuth.js v5
- **Storage**: Cloudflare R2

## Quick Start

```bash
# Install dependencies
bun install

# Setup environment variables
cp .env.example .env

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

## Documentation

- [Setup Guide](./docs/SETUP.md)
- [Implementation Status](./docs/IMPLEMENTATION_STATUS.md)
- [Full Documentation](./docs/README.md)

## License

MIT

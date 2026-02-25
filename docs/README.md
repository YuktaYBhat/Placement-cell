# 🎓 CampusConnect - Placement Management System

A modern, full-stack placement management system built with Next.js 15, designed for college placement cells. Features secure authentication, KYC verification, job management, application tracking, and comprehensive analytics.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [User Flow](#user-flow)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

---

## Overview

CampusConnect is the official placement portal for SDMCET, enabling students to:
- Complete comprehensive profiles with academic details
- Get KYC verified for accessing placement opportunities
- Discover and apply to job openings from visiting companies
- Track application status from submission to selection
- Receive real-time notifications about placement activities

Administrators can:
- Manage student profiles and KYC verification
- Post and manage job opportunities
- Track applications and update statuses
- View analytics and placement statistics
- Send bulk notifications to students

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Landing    │  │   Auth      │  │    Dashboard/Features   │  │
│  │   Page      │  │  (Login/    │  │  (Jobs, Applications,   │  │
│  │             │  │   Signup)   │  │   Profile, Admin)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App Router                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Server Components (RSC)                     │    │
│  │  • auth() session validation                            │    │
│  │  • Prisma database queries                              │    │
│  │  • Server-side rendering                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              API Routes (/api/*)                         │    │
│  │  • RESTful endpoints                                    │    │
│  │  • Auth middleware                                      │    │
│  │  • Request validation                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   NextAuth   │  │   Prisma     │  │   External Services  │   │
│  │   (Auth)     │  │   (ORM)      │  │   (Email, Storage)   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  PostgreSQL  │  │ Cloudflare   │  │      AWS SES         │   │
│  │   (Neon)     │  │     R2       │  │   (Email Service)    │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     User     │────▶│   Profile    │     │     Job      │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │     │ userId       │     │ id           │
│ email        │     │ personalInfo │     │ title        │
│ role         │     │ academics    │     │ company      │
│ password     │     │ kycStatus    │     │ eligibility  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Notification │     │ Application  │◀────│              │
├──────────────┤     ├──────────────┤     │              │
│ userId       │     │ userId       │     │              │
│ type         │     │ jobId        │     │              │
│ message      │     │ status       │     │              │
│ isRead       │     │ qrCode       │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## User Flow

### Student Journey

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Sign   │────▶│ Verify  │────▶│Complete │────▶│   KYC   │
│   Up    │     │  Email  │     │ Profile │     │ Review  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                                                     │
     ┌───────────────────────────────────────────────┘
     ▼
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  KYC    │────▶│ Browse  │────▶│  Apply  │────▶│  Track  │
│Verified │     │  Jobs   │     │  to Job │     │ Status  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
```

### Detailed User States

| State | Access Level | Actions Available |
|-------|-------------|-------------------|
| Unauthenticated | Public | View landing, Login, Signup |
| Email Unverified | Limited | Resend verification email |
| Profile Incomplete | Limited | Complete profile form |
| KYC Pending | Limited | View dashboard, await verification |
| KYC Verified | Full | Browse jobs, apply, track applications |
| Admin | Admin | All admin features + student access |

### Admin Journey

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Admin  │────▶│ Review  │────▶│ Approve/│
│  Login  │     │   KYC   │     │ Reject  │
└─────────┘     └─────────┘     └─────────┘
     │
     ├──────────────────────────────────────┐
     ▼                                      ▼
┌─────────┐     ┌─────────┐          ┌─────────┐
│  Post   │────▶│ Review  │          │  View   │
│  Jobs   │     │ Applics │          │Analytics│
└─────────┘     └─────────┘          └─────────┘
```

---

## Features

### For Students
- 📝 **Profile Management** - Multi-step profile with personal, academic, and engineering details
- 🔐 **KYC Verification** - Secure identity verification with document upload
- 💼 **Job Discovery** - Browse and search job opportunities with eligibility filters
- 📊 **Application Tracking** - Real-time status updates on applications
- 🔔 **Notifications** - In-app notifications for status changes and new opportunities
- 📱 **QR Code Attendance** - QR-based check-in for placement events

### For Administrators
- 👥 **Student Management** - View and manage student profiles
- ✅ **KYC Queue** - Review and approve student verifications
- 📋 **Job Posting** - Create and manage job listings with rich text editor
- 📈 **Analytics Dashboard** - Placement statistics and trends
- 📢 **Bulk Notifications** - Send targeted notifications to student groups
- 📅 **Event Scheduling** - Manage placement drives and interviews

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma 6 |
| **Authentication** | NextAuth.js v5 |
| **Styling** | Tailwind CSS + shadcn/ui |
| **File Storage** | Cloudflare R2 |
| **Email** | AWS SES |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |

---

## Getting Started

### Prerequisites

- **Bun** (recommended) or Node.js 18+
- PostgreSQL database (Neon recommended)
- AWS SES account
- Google Cloud Console access (for OAuth)
- Cloudflare R2 account (for file storage)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd placement-next

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Set up database
bunx prisma generate
bunx prisma db push

# Start development server
bun dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AWS SES
AWS_SES_ACCESS_KEY_ID="..."
AWS_SES_SECRET_ACCESS_KEY="..."
AWS_REGION="ap-south-1"
EMAIL_FROM="noreply@yourdomain.com"

# Cloudflare R2
CLOUDFLARE_R2_ENDPOINT="..."
CLOUDFLARE_R2_ACCESS_KEY_ID="..."
CLOUDFLARE_R2_SECRET_ACCESS_KEY="..."
CLOUDFLARE_R2_BUCKET_NAME="placement-documents"
```

---

## Project Structure

```
placement-next/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login, signup, verify)
│   │   ├── login/
│   │   ├── signup/
│   │   └── verify-email/
│   ├── admin/               # Admin dashboard
│   │   ├── analytics/       # Placement analytics
│   │   ├── jobs/           # Job management
│   │   ├── kyc-queue/      # KYC verification queue
│   │   └── students/       # Student management
│   ├── api/                # API routes
│   │   ├── admin/          # Admin-only endpoints
│   │   ├── auth/           # Auth endpoints
│   │   ├── jobs/           # Job endpoints
│   │   └── notifications/  # Notification endpoints
│   ├── applications/       # Student applications
│   ├── dashboard/          # Student dashboard
│   ├── jobs/               # Job discovery
│   └── profile/            # Profile completion
├── components/
│   ├── admin/              # Admin-specific components
│   ├── navbar-components/  # Navigation components
│   ├── steps/              # Profile form steps
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and configs
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client
│   ├── email.ts           # Email service
│   └── validations/       # Zod schemas
├── prisma/
│   └── schema.prisma      # Database schema
└── types/                 # TypeScript types
```

---

## API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signin` | POST | Sign in with credentials |
| `/api/auth/signup` | POST | Create new account |
| `/api/auth/verify` | GET | Verify email token |

### Jobs

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/jobs` | GET | List jobs with filters | Student |
| `/api/jobs/[id]` | GET | Get job details | Student |
| `/api/jobs/[id]` | POST | Apply to job | Student |
| `/api/admin/jobs` | POST | Create job | Admin |
| `/api/admin/jobs/[id]` | PUT | Update job | Admin |

### Applications

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/applications` | GET | List user applications | Student |
| `/api/admin/applications/[id]/status` | PUT | Update status | Admin |

### Notifications

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/notifications` | GET | List notifications | User |
| `/api/notifications/[id]/read` | PUT | Mark as read | User |
| `/api/admin/notifications` | POST | Send bulk | Admin |

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Setup for Production

1. Set all environment variables in your hosting platform
2. Update `NEXTAUTH_URL` to production domain
3. Configure AWS SES for production (verify domain)
4. Set up Cloudflare R2 CORS for production domain

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ❤️ for SDMCET
</p>

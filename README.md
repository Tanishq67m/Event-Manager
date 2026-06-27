# EventPulse 🎟️

EventPulse is a modern, high-performance, full-stack Event Management & Booking Platform built as a monorepo. It empowers organizers to create, manage, and track event ticket sales, while offering attendees a seamless booking experience complete with real-time analytics and QR-code-based check-ins.

---

## 🚀 Key Features

### 👤 Attendee Experience
- **Browse & Search**: Dynamic search, filtering, and pagination to discover upcoming events.
- **Smooth Booking Flow**: Flexible ticket selection and seat/category booking flow.
- **Ticket Wallet**: Access to ticket history with inline QR codes generated dynamically for swift check-in.

### 🏢 Organizer Dashboard
- **Analytics & Quick Stats**: Real-time sales, capacity tracking, and revenue overview.
- **Multi-Tier Event Creator**: Dynamic forms allowing the creation of events with multiple concurrent ticket categories (e.g., Early Bird, VIP, General Admission).
- **Live QR Scanner**: Real-time check-in validation interface with live entry counter updates.

---

## 🛠️ Tech Stack

- **Monorepo Manager**: NPM Workspaces
- **Frontend**: Next.js (App Router), React, Tailwind CSS v4, Lucide Icons
- **Backend API**: Express, TypeScript, Node.js
- **Database / ORM**: PostgreSQL, Prisma ORM
- **Key Integrations**: Razorpay (Payments), Resend (Transactional emails), Cloudinary (Asset storage)

---

## 📂 Project Structure

```text
eventpulse/
├── apps/
│   ├── api/             — Express API backend server
│   │   ├── prisma/      — Prisma schema & migration files
│   │   └── src/         — API routes, controllers, and services
│   └── web/             — Next.js frontend application
│       └── src/
│           ├── app/     — Next.js pages, auth screens & global layouts
│           ├── components/ — Reusable UI modules (Navbar, EventCard, etc.)
│           └── lib/     — Typed API client & global auth state manager
├── packages/            — Shared workspaces (e.g., shared TS types / utilities)
├── package.json         — Monorepo orchestrator (npm run scripts)
└── package-lock.json    — Shared lockfile
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
Ensure you have **Node.js** (v18+ recommended) and **NPM** (v9+) installed.

### 2. Configure Environment Variables
You need to configure env files for both the API backend and Web frontend.

#### Backend (`apps/api/.env`)
Create `apps/api/.env` and configure:
```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# JWT Secrets
JWT_ACCESS_SECRET="your-jwt-access-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Integrations (Optional / Test keys)
RAZORPAY_KEY_ID="rzp_test_xxxx"
RAZORPAY_KEY_SECRET="xxxx"
RESEND_API_KEY="re_xxxx"
CLOUDINARY_CLOUD_NAME="xxxx"
```

#### Frontend (`apps/web/.env.local`)
Create `apps/web/.env.local` pointing to the API port:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### 3. Install Dependencies
Run from the root directory:
```bash
PATH=/opt/homebrew/bin:$PATH npm install
```

### 4. Database Setup & Migrations
Sync your PostgreSQL database using Prisma from the root:
```bash
# Generate the Prisma client
PATH=/opt/homebrew/bin:$PATH npm run db:generate

# Run migrations to set up tables
PATH=/opt/homebrew/bin:$PATH npm run db:migrate
```

---

## 🏃 Running the Application

Start both the backend server and frontend development environments simultaneously using the monorepo dev script:

```bash
PATH=/opt/homebrew/bin:$PATH npm run dev
```

The apps will be available at:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api)

---

## 🛠️ Database Utility Commands (Root level)

Prisma database helpers are configured at the workspace root for convenience:
- `npm run db:generate`: Regenerates Prisma client types.
- `npm run db:migrate`: Performs DB migrations.
- `npm run db:studio`: Opens Prisma GUI to view and modify database records directly ([http://localhost:5555](http://localhost:5555)).

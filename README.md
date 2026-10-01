# GOLD ARMY FITNESS CLUB

> **Luxury Fitness Club + Sports Technology + Premium SaaS Platform**
> Complete Gym Management & Fitness Mobile Application for **Members**, **Trainers**, and **Mobile-First Admins**.

---

## 🏛️ System Architecture

- **Frontend**: React Native + Expo SDK 57, TypeScript, Expo Router, TanStack React Query, Zustand, Axios, React Hook Form, Zod, expo-camera, expo-secure-store.
- **Backend**: Node.js, Express 5, TypeScript, Prisma ORM 6, MySQL 8.0, JWT (Access + Refresh tokens with revocation), bcryptjs, Zod, Helmet, CORS, Pino Logger, Vitest.
- **Database**: MySQL 8.0 with Prisma ORM (431+ lines schema, strictly normalized).
- **Design System**: Luxury Black & Gold (`#080808`, `#151515`, `#1C1C1C`, `#D4AF37`, `#E6C76A`, `#E50914`, `#FF1E2D`, `#FFFFFF`).

---

## 🚀 Completed Phases (1–16)

1. **Phase 1 — Project Foundation & Design System**: Dark luxury color tokens, reusable UI components (`Card`, `PrimaryButton`, `Badge`, `RoleGate`, `RoleScreen`, `BrandMark`), typography, and base layout.
2. **Phase 2 — Member Core App**: Onboarding, member screens, navigation, profile view, membership countdown.
3. **Phase 3 — Trainer & Mobile-First Admin Panels**: 100% mobile-operated experience for gym owners and trainers (no PC required).
4. **Phase 4 — Express + Prisma + MySQL Backend**: Production-grade REST API, schema migrations, MySQL 8.0 database engine, seed scripts.
5. **Phase 5 — Real Authentication Integration**: JWT access + refresh tokens, bcrypt password hashing, token revocation, automatic 401 token refresh in Axios interceptors, SecureStore session persistence.
6. **Phase 6 — Member Profile & Live Subscriptions**: Live MySQL subscriptions, server-side days remaining calculation, React Query hooks.
7. **Phase 7 — Plans Catalog & Checkout Renewal**: Live plans catalog, subscription creation, renewal workflows, discount support.
8. **Phase 8 — Live Attendance & Server-Verified QR Check-in**: Server-verified QR check-in, duplicate prevention, streak calculation, weekly attendance trends.
9. **Phase 9 — Live Workouts & Exercise Catalog**: Exercise catalog, routine assignment, workout logging, completion tracking.
10. **Phase 10 — Live Diet Plans & Daily Nutrition**: Diet plan catalog, macro breakdowns (calories, protein, carbs, fats), meal assignments, budget-conscious meal plans.
11. **Phase 11 — Live Progress & Personal Records (PRs)**: Body weight tracking, body fat %, measurements (chest, waist, arms, thighs), dynamic mobile bar chart, Personal Records (PR) tracking with gold accents.
12. **Phase 12 — Personal Training (PT) & Booking**: 1-on-1 coach booking, trainer profiles & specializations, scheduling collision protection, session completion with notes, cancellation workflows.
13. **Phase 13 — Notifications & Automated Expiry Alerts**: Notification center, unread badge counters, admin composer with audience resolution (`ALL_MEMBERS`, `EXPIRING_MEMBERS`, `EXPIRED_MEMBERS`, `SELECTED_MEMBERS`), automated expiry alerts (7d, 3d, 1d, 0d) with deduplication logs.
14. **Phase 14 — Complete Mobile-First Admin Operations**: Real-time revenue dashboard, member 360 overview, expiry manager, plan manager, attendance inspector, payment audit trails.
15. **Phase 15 — Payment Gateway Architecture & Integration**: Server-side Razorpay order generation (`POST /api/payments/order`), server-side HMAC SHA256 signature verification (`POST /api/payments/verify`), webhook processing (`POST /api/payments/webhook`), refund tracking.
16. **Phase 16 — Production QA, Security Hardening & Deployment Readiness**: 79/79 backend tests passing (12 suites), zero TypeScript errors on frontend/backend, successful Expo web export, security headers, role authorization guards.

---

## 🔑 Test Accounts (Development Seed)

| Role | Email / Phone | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `owner@goldarmy.local` | `GoldArmy123!` | Gym Owner (Full Mobile Management Access) |
| **Trainer** | `trainer@goldarmy.local` | `GoldArmy123!` | Aditya Rao (Head Strength & Conditioning Coach) |
| **Member** | `+919822104000` | `GoldArmy123!` | Rohan Deshmukh (Active Member) |

---

## 🛠️ Setup & Running Locally

### 1. Backend Setup

```bash
cd gold-army-backend
npm install
cp .env.example .env

# Run Prisma migration & seed
npx prisma migrate dev
npm run db:seed

# Start backend development server
npm run dev
```

### 2. Frontend Setup

```bash
cd gold-army-app
npm install
cp .env.example .env

# Start Expo app
npx expo start
```

---

## 🧪 Testing & Validation Commands

### Backend Validation

```bash
cd gold-army-backend
npm test                  # 79/79 Integration tests passing across 12 suites
npm run build             # TypeScript build compilation
npx prisma validate       # Schema validation
```

### Frontend Validation

```bash
cd gold-army-app
npx tsc --noEmit                          # TypeScript type check
npx expo export --platform web            # Production web bundle build
```

---

## 🔒 Security & Payment Gateway Configuration

For production deployment with live Razorpay credentials, configure the following variables in `gold-army-backend/.env`:

```ini
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
```

The system automatically performs server-side HMAC SHA256 signature verification to prevent spoofing or unauthorized subscription activations.

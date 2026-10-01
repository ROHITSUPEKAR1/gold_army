# GOLD ARMY FITNESS CLUB — PRODUCTION CHECKLIST

## 1. System & Architecture Readiness

| Area | Item | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Backend** | TypeScript compilation | ✅ Passed | Clean compile via `npm run build` (`tsc -p tsconfig.json`) |
| **Backend** | Automated Integration Tests | ✅ Passed | 79 / 79 tests passing across 12 suites |
| **Backend** | Graceful Shutdown | ✅ Passed | Handlers for `SIGTERM` / `SIGINT` implemented in `server.ts` |
| **Backend** | Production Logging | ✅ Passed | Pino structured JSON logging enabled |
| **Backend** | Security Headers | ✅ Passed | Helmet & CORS origin whitelisting configured |
| **Backend** | Error Handling | ✅ Passed | Global centralized error handler with sanitization |
| **Database** | Schema Validation | ✅ Passed | `npx prisma validate` successful |
| **Database** | Migrations | ✅ Passed | `npx prisma migrate deploy` verified, no reset in prod |
| **Database** | Unique Constraints | ✅ Passed | Phone, Email, Transaction ID, Session slot collisions |
| **Frontend** | TypeScript Check | ✅ Passed | `npx tsc --noEmit` passed with 0 errors |
| **Frontend** | Static Asset Export | ✅ Passed | `npx expo export --platform web` verified |
| **Frontend** | Session Storage | ✅ Passed | `expo-secure-store` with automatic 401 refresh |
| **Mobile App** | Package Identifier | ✅ Passed | `com.goldarmy.fitnessclub` configured in `app.json` |
| **Mobile App** | Camera Permissions | ✅ Passed | Configured for in-app QR check-in |

---

## 2. Environment Variables Verification

Ensure `.env` in production contains real, high-entropy secrets and not placeholder values:

```env
# Database
DATABASE_URL="mysql://<user>:<password>@<host>:3306/<dbname>"

# Security & Tokens
JWT_SECRET="<64-byte-hex-secret>"
JWT_REFRESH_SECRET="<64-byte-hex-secret>"
GYM_QR_SECRET="<gym-specific-qr-token>"

# Server Config
PORT=4000
API_URL="https://api.goldarmy.club"
CORS_ORIGIN="https://goldarmy.club"

# Razorpay Live Credentials
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
```

---

## 3. Pre-Deployment Verification Protocol

Before going live with the public DNS and mobile app builds:

1. **Database Migration Check**:
   ```bash
   npx prisma migrate status
   ```
2. **Database Backup**:
   ```bash
   mysqldump -u gold_army_prod -p gold_army > pre_launch_backup.sql
   ```
3. **Health Check Endpoint**:
   ```bash
   curl -I https://api.goldarmy.club/api/health
   # Expected: HTTP/1.1 200 OK {"status":"UP","operational":true}
   ```
4. **Razorpay Webhook Registration**:
   - Webhook URL: `https://api.goldarmy.club/api/payments/webhook`
   - Events Subscribed: `payment.captured`, `payment.failed`, `refund.created`
   - Secret: Matches `RAZORPAY_WEBHOOK_SECRET` in `.env`
5. **Mobile Build Command**:
   ```bash
   eas build --platform android --profile production
   ```

---

## 4. Operational Sign-Off

- [x] Admin Mobile Journey: Member enrollment, payments, attendance monitoring, and diet/workout assignment verified on mobile viewport.
- [x] Trainer Journey: Assigned member inspection, workout/diet tailoring, and PT session completion verified.
- [x] Member Journey: Registration, plan selection, Razorpay order/verification, QR check-in, and PR progress logging verified.
- [x] Payment Safety: Server-side HMAC SHA256 signature verification & amount validation from database plan records.
- [x] Expiry Notifications: Deduplicated 7d/3d/1d/0d reminders with in-app unread tracking.

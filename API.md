# GOLD ARMY FITNESS CLUB — API SPECIFICATION

Base URL: `https://api.goldarmy.club/api` (Production) / `http://localhost:4000/api` (Development)

---

## 1. System & Health

### `GET /api/health`
Returns operational state, uptime, and database connectivity.
- **Auth**: None
- **Response `200 OK`**:
```json
{
  "status": "UP",
  "operational": true,
  "service": "Gold Army Fitness API",
  "timestamp": "2026-09-15T12:00:00.000Z",
  "uptime": 3482.1
}
```

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/login`
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Alex Hunter",
    "role": "MEMBER"
  },
  "tokens": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### `POST /api/auth/refresh`
- **Body**: `{ "refreshToken": "string" }`
- **Response `200 OK`**: `{ "accessToken": "new_jwt", "refreshToken": "new_refresh" }`

### `POST /api/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: `{ "success": true, "message": "Logged out successfully" }`

### `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: Full authenticated user profile object.

---

## 3. Members & Subscriptions (`/api/members`, `/api/plans`, `/api/subscriptions`)

### `GET /api/plans`
- **Response `200 OK`**: List of all active membership plans (Bronze, Silver, Gold, Platinum) with duration and pricing.

### `GET /api/members/me/subscription`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: Current active subscription, days remaining, start/end dates.

### `GET /api/members/me/subscription-history`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: Array of historical subscriptions.

---

## 4. Attendance & QR Check-In (`/api/attendance`)

### `POST /api/attendance/check-in`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "qrData": "GOLD_ARMY_OFFICIAL_CHECKIN_..." }`
- **Validation**:
  - Validates gym QR signature.
  - Verifies member has an `ACTIVE` subscription.
  - Prevents duplicate check-ins on the same calendar day.
- **Response `201 Created`**: Check-in record created.

### `GET /api/attendance/history`
- **Response `200 OK`**: Paginated log of member check-in timestamps.

### `GET /api/attendance/stats`
- **Response `200 OK`**: Total workouts, monthly count, active streak.

---

## 5. Workouts & Diet (`/api/workouts`, `/api/exercises`, `/api/diet-plans`)

### `GET /api/workouts`
- Returns assigned routine for member, or all routines if trainer/admin.

### `POST /api/workouts` *(Trainer/Admin)*
- Creates customized multi-exercise routine.

### `POST /api/workouts/complete`
- **Body**: `{ "workoutId": "uuid" }`
- Logs workout completion with timestamp.

### `GET /api/exercises`
- Returns full exercise library categorized by muscle group.

### `GET /api/diet-plans`
- Returns active meal plan with macros (Protein, Carbs, Fats, Calories).

---

## 6. Personal Records & Progress (`/api/progress`)

### `GET /api/progress/prs`
- Returns personal records across exercises (Bench, Squat, Deadlift, OHP).

### `POST /api/progress/prs`
- **Body**: `{ "exerciseId": "uuid", "weight": 140, "reps": 5 }`
- Updates PR record.

### `GET /api/progress/weight`
- Returns historical body weight tracking logs.

### `POST /api/progress/weight`
- **Body**: `{ "weight": 82.5, "bodyFatPercentage": 14.2 }`

---

## 7. Personal Training (`/api/pt`)

### `GET /api/pt/trainers`
- List of available coaches and specializations.

### `GET /api/pt/sessions`
- List of booked PT sessions for member or trainer.

### `POST /api/pt/book`
- **Body**: `{ "trainerId": "uuid", "scheduledAt": "2026-09-20T10:00:00.000Z", "notes": "Leg day" }`
- Verifies trainer availability; prevents booking collisions within ±45 mins.

### `POST /api/pt/sessions/:id/complete` *(Trainer)*
- **Body**: `{ "notes": "Completed 5x5 squats. Great form." }`
- Marks session completed.

---

## 8. In-App Notifications (`/api/notifications`)

### `GET /api/notifications`
- Returns member notifications sorted by newest first.

### `PATCH /api/notifications/:id/read`
- Marks notification as read.

### `POST /api/notifications/compose` *(Admin)*
- **Body**: `{ "title": "Gym Closed Tomorrow", "body": "Maintenance on Sunday", "targetAudience": "ALL" }`

### `POST /api/notifications/run-expiry-check` *(Cron/Admin)*
- Triggers automated scan for subscriptions expiring in 7d, 3d, 1d, or 0d (deduplicated).

---

## 9. Payments & Razorpay (`/api/payments`)

### `POST /api/payments/create-order`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "planId": "uuid" }`
- **Server Action**: Looks up plan price from database, creates order with Razorpay API, returns `orderId`, `currency`, `amount`.

### `POST /api/payments/verify`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "orderId": "order_12345",
  "paymentId": "pay_67890",
  "signature": "hmac_sha256_hex_digest",
  "planId": "uuid"
}
```
- **Server Action**: Verifies HMAC signature `crypto.createHmac('sha256', secret).update(orderId + "|" + paymentId).digest('hex')`. Persists `Payment` record with status `SUCCESS` and activates/extends `Subscription`.

### `POST /api/payments/webhook`
- **Headers**: `x-razorpay-signature`
- Listens for asynchronous payment failure, refund, and capture events.

---

## 10. Admin Operations (`/api/admin`)

### `GET /api/admin/dashboard`
- Aggregates active members, monthly revenue, daily check-ins, and expiring plans count.

### `GET /api/admin/members`
- Searchable, filterable list of all registered members.

### `POST /api/admin/members`
- Register new walk-in member with immediate plan assignment.

### `GET /api/admin/payments`
- Full financial transaction ledger.

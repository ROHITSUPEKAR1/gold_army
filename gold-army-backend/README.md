# Gold Army Backend

Independent Express + TypeScript + Prisma + MySQL API for Gold Army Fitness Club.

## Setup

1. Copy `.env.example` to `.env` and set a real MySQL `DATABASE_URL` plus 32+ character JWT secrets.
2. Install dependencies with `npm install`.
3. Validate and generate Prisma Client:

```powershell
npm run db:validate
npm run db:generate
```

4. Apply migrations and seed data:

```powershell
npx prisma migrate deploy
npm run db:seed
```

5. Start the API:

```powershell
npm run dev
```

## API groups

- `/api/auth`: login, registration, refresh, logout, current user
- `/api/members`, `/api/services`, `/api/plans`
- `/api/subscriptions`, `/api/payments`, `/api/attendance`
- `/api/exercises`, `/api/workouts`, `/api/diet-plans`, `/api/pt/sessions`
- `/api/progress`, `/api/notifications`
- `/api/admin/dashboard`, `/api/admin/revenue`, `/api/admin/attendance`, `/api/admin/expiry`
- `/api/reports/:report`

All responses use `{ success, data }` or `{ success, message, errors }`. Role authorization is based on the verified JWT, never a client-supplied role.

## Local database note

The source workspace's local MySQL instance currently rejects Prisma's connection with `Unknown authentication plugin sha256_password`. The schema validates, Prisma Client generates, and `prisma/migrations/0001_init/migration.sql` is checked in. Configure the MySQL user with a Prisma-supported authentication plugin or use a compatible MySQL instance before running migrations and seed.

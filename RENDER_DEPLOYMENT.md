# Deploying Gold Army Backend to Render

This guide walks you through deploying the **Gold Army Fitness Backend** to [Render](https://render.com) connected to your **TiDB Cloud Database**.

---

## 📋 Prerequisites Verified & Ready
- ✅ **Database**: Connected & seeded on TiDB Cloud Serverless (`gateway01.ap-northeast-1.prod.aws.tidbcloud.com`).
- ✅ **TypeScript Build**: Verified (`dist/server.js`).
- ✅ **Local Tests**: All health, authentication, memberships, workout routines, and diet APIs passed.

---

## 🚀 Step-by-Step Deployment on Render

### Step 1: Push Project to GitHub / GitLab
Ensure your latest codebase is pushed to your Git repository (e.g. GitHub):
```bash
git add .
git commit -m "feat: configure TiDB database and Render deployment"
git push origin main
```

---

### Step 2: Create Web Service on Render

1. Log into your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Fill in the following deployment settings:

| Setting | Value |
|---|---|
| **Name** | `gold-army-api` (or your preferred name) |
| **Region** | `Singapore (Southeast Asia)` or `Tokyo` *(closest to TiDB `ap-northeast-1`)* |
| **Root Directory** | `gold-army-backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` or `Starter` |

---

### Step 3: Configure Environment Variables

Under the **Environment Variables** section on Render, add the following keys:

| Key | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `mysql://27Qcqu8qe6yqAKq.root:xt2nzYuurKYgVOoj@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/gold_army?sslaccept=strict&connection_limit=10&pool_timeout=20` | Your TiDB Cloud URL |
| `NODE_ENV` | `production` | Production mode |
| `JWT_SECRET` | *(generate a 64-char random hex string)* | e.g. `c7b04e6e2f17088b907c126d405106ab04c478df8831f24ec499713532726359` |
| `JWT_REFRESH_SECRET` | *(generate a 64-char random hex string)* | e.g. `992a7e78051787c8808dc6f6d0f66fc88849b28b7e2a9b31d275727142faef81` |
| `API_URL` | `https://gold-army-api.onrender.com` | Your Render public URL |
| `CORS_ORIGIN` | `*` | Or specify frontend origins |
| `GYM_QR_SECRET` | `GOLD_ARMY_PRODUCTION_GYM_QR_2026` | Gym QR Check-in secret |
| `RAZORPAY_KEY_ID` | `rzp_test_...` (optional) | Payment Gateway Key |
| `RAZORPAY_KEY_SECRET` | `...` (optional) | Payment Gateway Secret |

---

### Step 4: Deploy & Verify
1. Click **Create Web Service** / **Manual Deploy** → **Deploy latest commit**.
2. Once deployed, test your live endpoint:
   - **Health Check**: `https://<your-service>.onrender.com/health` (should return `{ "success": true, "data": { "status": "healthy" } }`)
   - **Plans Catalog**: `https://<your-service>.onrender.com/api/plans`

---

### Step 5: Update Mobile App API URL
Update [gold-army-app/services/api.ts](file:///c:/Users/supek/OneDrive/Desktop/GOLD_ARMY/gold-army-app/services/api.ts) with your new Render URL:
```typescript
const API_BASE_URL = 'https://gold-army-api.onrender.com';
```

# GOLD ARMY FITNESS CLUB — PRODUCTION DEPLOYMENT GUIDE

> **Target Platform**: Production Linux Server (Ubuntu 22.04 LTS / 24.04 LTS) + MySQL 8.0 + Node.js 20+ / 22+

---

## 1. Prerequisites

- **Server**: Ubuntu 22.04 LTS / 24.04 LTS (Minimum 2 CPU Cores, 4GB RAM).
- **Domain**: `api.goldarmy.club` (pointing to server IP).
- **Software**:
  - Node.js 20.x or 22.x LTS (`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`)
  - MySQL Server 8.0 (`sudo apt install -y mysql-server`)
  - PM2 Process Manager (`sudo npm install -g pm2`)
  - Nginx (`sudo apt install -y nginx certbot python3-certbot-nginx`)

---

## 2. Production Database Setup

### Step 1: Initialize Database and User

```sql
-- Login to MySQL as root
sudo mysql -u root -p

-- Create dedicated production database
CREATE DATABASE gold_army CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user with strong password
CREATE USER 'gold_army_prod'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'StrongRandomProductionPassword!2026';

-- Grant required privileges
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, REFERENCES, INDEX, ALTER ON gold_army.* TO 'gold_army_prod'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

### Step 2: Apply Migrations (DO NOT USE `migrate reset`)

```bash
cd /var/www/gold-army/gold-army-backend
npx prisma migrate deploy
```

---

## 3. Backend Deployment with PM2

### Step 1: Clone Repository & Install Dependencies

```bash
sudo mkdir -p /var/www/gold-army
cd /var/www/gold-army
# Clone repo
git clone <YOUR_REPO_URL> .
cd gold-army-backend
npm ci
```

### Step 2: Configure Production Environment (`.env`)

```ini
DATABASE_URL="mysql://gold_army_prod:StrongRandomProductionPassword!2026@localhost:3306/gold_army"
JWT_SECRET="<generate-with-openssl-rand-hex-64>"
JWT_REFRESH_SECRET="<generate-with-openssl-rand-hex-64>"
PORT=4000
API_URL="https://api.goldarmy.club"
CORS_ORIGIN="https://goldarmy.club,http://localhost:8081"
GYM_QR_SECRET="GOLD_ARMY_PRODUCTION_GYM_QR_2026"

# Live Razorpay Credentials
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
```

### Step 3: Build TypeScript & Start PM2

```bash
npm run build

# Start process
pm2 start dist/server.js --name "gold-army-api" -i max

# Save PM2 startup script
pm2 save
pm2 startup
```

---

## 4. Nginx Reverse Proxy with HTTPS / SSL

### Step 1: Create Nginx Configuration (`/etc/nginx/sites-available/api.goldarmy.club`)

```nginx
server {
    server_name api.goldarmy.club;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 2: Enable Site and Obtain SSL Certificate

```bash
sudo ln -s /etc/nginx/sites-available/api.goldarmy.club /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Provision free SSL certificate via Let's Encrypt
sudo certbot --nginx -d api.goldarmy.club
```

---

## 5. Production Database Backup & Restore Procedure

### Automated Daily Backup Script (`/usr/local/bin/backup-goldarmy.sh`)

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/gold-army"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

mysqldump -u gold_army_prod -p'StrongRandomProductionPassword!2026' \
  --single-transaction \
  --quick \
  --lock-tables=false \
  gold_army | gzip > "$BACKUP_DIR/gold_army_$TIMESTAMP.sql.gz"

# Retain last 30 days of backups
find $BACKUP_DIR -type f -name "gold_army_*.sql.gz" -mtime +30 -exec rm {} \;
```

### Add to Crontab (Runs daily at 2:00 AM)

```bash
0 2 * * * /usr/local/bin/backup-goldarmy.sh
```

### Restore Procedure

```bash
gunzip < /var/backups/gold-army/gold_army_YYYYMMDD_HHMMSS.sql.gz | mysql -u gold_army_prod -p'StrongRandomProductionPassword!2026' gold_army
```

---

## 6. Android Mobile App Release (EAS Build)

```bash
cd gold-army-app

# 1. Login to Expo EAS
eas login

# 2. Configure build profile
eas build:configure

# 3. Build Production Android APK / AAB
eas build --platform android --profile production
```

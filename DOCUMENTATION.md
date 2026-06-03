# 🧱 BrickPro — Complete Technical Documentation

---

## 📐 ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                        USERS                                 │
│     Browser (Web)    │    Android (APK)    │   Admin Panel   │
└──────────┬───────────┴─────────┬───────────┴────────┬───────┘
           │                     │                    │
           ▼                     ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              NGINX (Reverse Proxy + SSL)                      │
│  brickpro.managementsystems.in → port 8080                  │
│  admin.brickpro.managementsystems.in → port 3001            │
│  api.brickpro.managementsystems.in → port 4000              │
└──────────┬───────────┬──────────────────────┬───────────────┘
           │           │                      │
           ▼           ▼                      ▼
┌──────────────┐ ┌──────────────┐ ┌────────────────────┐
│  Web App     │ │  Admin Panel │ │  Backend API       │
│  (React)     │ │  (React)     │ │  (Node.js/Express) │
│  Port: 8080  │ │  Port: 3001  │ │  Port: 4000        │
└──────────────┘ └──────────────┘ └─────────┬──────────┘
                                             │
                                             ▼
                                  ┌────────────────────┐
                                  │  PostgreSQL (DB)    │
                                  │  Port: 5432        │
                                  └────────────────────┘
```

---

## 🛠️ TECHNOLOGIES USED

### Frontend — Web App (`apps/web/`)
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2 | UI library |
| TypeScript | 5.3 | Type safety |
| Vite | 5.1 | Build tool (fast dev server + bundler) |
| React Router | 6.22 | Page navigation |
| Zustand | 4.5 | State management (stores) |
| Recharts | 2.12 | Charts & graphs |
| Axios | 1.6 | API calls (HTTP client) |
| React Hot Toast | 2.4 | Notification toasts |
| date-fns | 3.3 | Date formatting |
| vite-plugin-pwa | 0.19 | Progressive Web App (offline support) |

### Frontend — Admin Panel (`apps/admin/`)
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2 | UI library |
| TypeScript | 5.3 | Type safety |
| Vite | 5.1 | Build tool |
| React Router | 6.22 | Navigation |
| Recharts | 2.12 | Charts (Power BI style) |
| Axios | 1.6 | API calls |
| React Hot Toast | 2.4 | Toasts |
| date-fns | 3.3 | Dates |

### Frontend — Mobile App (`apps/mobile/`)
| Technology | Version | Purpose |
|-----------|---------|---------|
| React Native | 0.76.7 | Native mobile UI |
| Expo | 52 | React Native framework (easy build) |
| React Navigation | 6.x | Screen navigation (drawer + stack) |
| Zustand | 4.3 | State management |
| Axios | 1.6 | API calls |
| expo-notifications | 0.29 | Push notifications |
| expo-secure-store | 14.0 | Secure token storage |
| react-native-reanimated | 3.16 | Animations (swipe) |

### Backend (`backend/`)
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18 | JavaScript runtime |
| Express | 4.18 | HTTP server framework |
| TypeScript | 5.3 | Type safety |
| Prisma | 5.10 | Database ORM (SQL queries) |
| PostgreSQL | 15 | Database |
| JWT (jsonwebtoken) | 9.0 | Authentication tokens |
| bcryptjs | 2.4 | Password hashing |
| Nodemailer | - | Email (OTP via SMTP) |
| express-rate-limit | 7.1 | API rate limiting |
| helmet | 7.1 | Security headers |
| cors | 2.8 | Cross-origin requests |
| multer | 1.4 | File uploads |
| zod | 3.22 | Input validation |

### Database
| Technology | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 15 (Alpine) | Relational database |
| Prisma ORM | 5.10 | Schema management + queries |

### DevOps / Deployment
| Technology | Purpose |
|-----------|---------|
| Docker | Containerization (packages app) |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse proxy + SSL termination |
| Let's Encrypt (Certbot) | Free SSL certificates |
| AWS EC2 | Cloud server |
| Git + GitHub | Version control |
| EAS (Expo) | Mobile app builds (APK/AAB) |

### Email / Communication
| Technology | Purpose |
|-----------|---------|
| Google Workspace SMTP | Send OTP emails |
| Nodemailer | SMTP client library |
| WhatsApp (wa.me links) | Share challans/receipts |

---

## 📁 PROJECT STRUCTURE

```
BrickPro/
├── backend/                    # Node.js API Server
│   ├── prisma/
│   │   └── schema.prisma      # Database schema (all tables)
│   ├── src/
│   │   ├── config/index.ts    # Environment config
│   │   ├── common/
│   │   │   ├── prisma.ts      # Database connection
│   │   │   ├── middleware.ts  # Auth middleware
│   │   │   └── email/index.ts # Email (OTP sender)
│   │   └── modules/
│   │       ├── auth/          # Login, OTP, Signup
│   │       ├── production/    # Brick production
│   │       ├── dispatch/      # Sales/Dispatch
│   │       ├── customers/     # Customer management
│   │       ├── raw-materials/ # Raw material tracking
│   │       ├── labour/        # Labour & payments
│   │       ├── expenditure/   # Expenses
│   │       ├── fuel/          # Fuel entries
│   │       ├── invoice/       # GST Invoice
│   │       ├── reports/       # Reports + Charts + Notifications
│   │       ├── users/         # User management
│   │       ├── factories/     # Factory CRUD
│   │       ├── edit/          # Edit logs
│   │       └── super-admin/   # Admin panel APIs
│   ├── Dockerfile             # Docker build instructions
│   ├── .env                   # Environment variables (SECRETS)
│   └── package.json           # Dependencies
│
├── apps/
│   ├── web/                   # React Web Application
│   │   ├── src/
│   │   │   ├── components/    # Header, Sidebar, BottomNav
│   │   │   ├── pages/        # All page components
│   │   │   ├── store/        # Zustand stores
│   │   │   ├── lib/          # API client, i18n
│   │   │   └── index.css     # All styles
│   │   ├── Dockerfile         # Docker build
│   │   └── nginx.conf         # Nginx config for SPA
│   │
│   ├── admin/                 # Super Admin Panel
│   │   ├── src/
│   │   │   ├── pages/        # Dashboard, Clients, Charts, etc.
│   │   │   └── lib/api.ts    # Admin API client
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   │
│   └── mobile/                # React Native App
│       ├── src/
│       │   ├── screens/       # All screens
│       │   ├── store/         # Auth & App stores
│       │   └── lib/           # API, theme, i18n
│       ├── App.tsx            # Entry point
│       ├── app.json           # Expo config
│       ├── eas.json           # Build profiles
│       └── store-assets/      # Play Store assets
│
├── docker-compose.yml         # 4 containers definition
├── deploy.sh                  # EC2 deployment script
├── nginx.conf                 # Single-container nginx
├── .env                       # SMTP password
├── .gitignore                 # Files to ignore in git
├── CHANGES_TRACKER.md         # Changelog
└── README.md                  # Documentation
```

---

## 🔐 ALL PASSWORDS & CREDENTIALS

### Backend .env (on EC2: ~/brickpro/.env)
```
DATABASE_URL=postgresql://postgres:Rewari@123@db:5432/brickpro
JWT_SECRET=brickpro-dev-secret-2024
JWT_REFRESH_SECRET=brickpro-refresh-secret-2024
PORT=4000
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=admin@managementsystems.in
SMTP_PASS=qzsllfyadvnpxpni
SMTP_FROM=admin@managementsystems.in
```

### Database
| Field | Value |
|-------|-------|
| Host | `db` (Docker internal) or `localhost` |
| Port | 5432 |
| Database | brickpro |
| Username | postgres |
| Password | Rewari@123 |

### Super Admin Login
| Field | Value |
|-------|-------|
| Email | admin@managementsystems.in |
| Password | Admin@2024 |
| OTP | Sent to admin@managementsystems.in |

### Google Workspace SMTP (for OTP emails)
| Field | Value |
|-------|-------|
| Email | admin@managementsystems.in |
| App Password | qzsl lfya dvnp xpni |
| SMTP Host | smtp.gmail.com |
| SMTP Port | 465 |

### GitHub
| Field | Value |
|-------|-------|
| Repo | https://github.com/management-systems/BrickPro-management-System |
| Username | Mandy2555 / management-systems |

### AWS EC2
| Field | Value |
|-------|-------|
| IP | 3.27.214.168 |
| Username | ec2-user |
| Key | .pem file (keep safe) |
| Region | ap-southeast-2 (Sydney) or ap-south-1 (Mumbai) |

### Domain
| Field | Value |
|-------|-------|
| Main | managementsystems.in |
| Web App | brickpro.managementsystems.in |
| Admin | admin.brickpro.managementsystems.in |
| API | api.brickpro.managementsystems.in |

---

## 🚀 DEPLOYMENT STEPS (Complete)

### Step 1: Code Development (DONE ✅)
- Write code on local machine
- Test locally with `npm run dev`

### Step 2: Push to GitHub (DONE ✅)
```bash
git add .
git commit -m "message"
git push origin main
```

### Step 3: EC2 Setup (DONE ✅)
1. Launch EC2 instance on AWS
2. SSH into EC2
3. Install Docker + Docker Compose + Buildx

### Step 4: Deploy on EC2 (IN PROGRESS 🔄)
```bash
cd ~/brickpro
git pull
sudo docker compose up --build -d
```

### Step 5: Database Setup
```bash
sudo docker compose exec -T backend npx prisma db push
curl -X POST http://localhost:4000/api/super-admin/seed
```

### Step 6: Point DNS
Add A records in domain provider:
- brickpro → 3.27.214.168
- admin.brickpro → 3.27.214.168
- api.brickpro → 3.27.214.168

### Step 7: Setup Nginx + SSL (on EC2)
```bash
sudo yum install -y nginx
# Create config (proxy to Docker ports)
sudo systemctl start nginx
sudo certbot --nginx -d brickpro.managementsystems.in ...
```

### Step 8: Mobile App Build
```bash
cd apps/mobile
eas build --platform android --profile preview   # APK
eas build --platform android --profile production # AAB (Play Store)
```

### Step 9: Razorpay Integration (Later)
- Create account + plans
- Integrate payment SDK

---

## 🔄 HOW TO UPDATE (after code changes)

### On local machine:
```bash
# Make code changes
git add .
git commit -m "fix: description"
git push origin main
```

### On EC2:
```bash
cd ~/brickpro
git pull
sudo docker compose up --build -d
```

### Mobile app update (no re-download):
```bash
cd apps/mobile
eas update --branch production --message "Bug fixes"
```

---

## 📊 DATABASE TABLES (schema.prisma)

| Table | Purpose |
|-------|---------|
| SuperAdmin | Admin login |
| AdminLog | Admin action logs |
| Client | Brick factory owners (tenants) |
| User | Users of each client |
| Factory | Factories per client |
| UserFactory | User-factory permissions |
| BrickType | Brick types per client |
| ProductionEntry | Daily brick production |
| Customer | Customers of each client |
| Dispatch | Sales/dispatch records |
| FuelEntry | Fuel consumption |
| Labour | Labour workers |
| Attendance | Labour attendance |
| LabourPayment | Labour payments |
| LabourProduction | Labour production records |
| RawMaterial | Raw material types |
| Supplier | Material suppliers |
| RawMaterialPurchase | Purchases |
| RawMaterialConsumption | Usage tracking |
| Expenditure | Expenses |
| Invoice | GST Invoices |
| InvoiceItem | Invoice line items |
| InvoiceSettings | Company invoice config |
| CustomerInvoiceSettings | Per-customer settings |
| EditLog | Edit audit trail |
| Payment | Subscription payments |
| ActivityLog | User activity logs |
| Notification | Push notifications |

---

## 🌐 API ENDPOINTS (Main ones)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/login | Email/password login |
| POST | /api/auth/send-otp | Send OTP to email |
| POST | /api/auth/verify-otp | Verify OTP + login |
| POST | /api/auth/trial-signup | New user signup |
| GET | /api/auth/me | Get current user |
| GET | /api/production | List production entries |
| POST | /api/production | Add production |
| GET | /api/dispatch | List dispatches |
| POST | /api/dispatch | Add dispatch |
| GET | /api/customers | List customers |
| GET | /api/reports/dashboard | Dashboard stats |
| GET | /api/reports/charts | Chart data |
| GET | /api/reports/notifications | User notifications |
| GET | /api/invoices | List invoices |
| POST | /api/invoices | Create invoice |
| GET | /api/super-admin/dashboard | Admin stats |
| GET | /api/super-admin/clients | All clients |
| GET | /api/super-admin/charts | Analytics |
| POST | /api/super-admin/notifications | Send notification |
| GET | /api/super-admin/public-settings | App settings (no auth) |

---

## 💰 COSTS

| Service | Monthly Cost |
|---------|-------------|
| EC2 t3.small | ~₹1,200 |
| EC2 t2.micro (free tier) | ₹0 (12 months) |
| Domain (managementsystems.in) | ~₹800/year |
| Google Workspace (email) | ~₹130/month |
| SSL (Let's Encrypt) | ₹0 |
| GitHub | ₹0 |
| Docker | ₹0 |
| **Total (with free tier)** | **~₹130/month** |
| **Total (after free tier)** | **~₹1,330/month** |

---

## 🎯 REVENUE MODEL

| Plan | Price | Billing |
|------|-------|---------|
| Free Trial | ₹0 | 7 days |
| Monthly | ₹999/month | Manual UPI / Razorpay |
| Yearly | ₹9,999/year | Manual UPI / Razorpay |

**Break-even:** 2 clients × ₹999 = ₹1,998/month (covers all costs)

---

*Last Updated: June 2, 2026*

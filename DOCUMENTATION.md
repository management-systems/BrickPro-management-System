# 🧱 BrickPro — Technical Documentation

## 📌 What is BrickPro?

BrickPro is a **multi-platform SaaS application** for managing brick factory (kiln) operations in India. It runs on:
- **Web** (PWA — works like an app on any browser)
- **Android** (APK via Play Store)
- **iOS** (App Store)

All three platforms share **one backend API**.

---

## 🏗️ Project Structure

```
BrickPro/
├── backend/          → API Server (Brain of the app)
├── apps/
│   ├── web/          → Web App (PWA) — for browsers
│   ├── mobile/       → Mobile App — Android + iOS (single codebase)
│   ├── admin/        → SaaS Admin Panel (your control center)
│   └── landing/      → Marketing Landing Page
├── packages/         → Shared code between apps
├── infra/            → Docker & Terraform (deployment configs)
└── .github/workflows → CI/CD (auto-deploy on code push)
```

---

## 🔧 Technologies Used

### Backend (API Server)

| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime — runs the server |
| **Express.js** | Web framework — handles HTTP requests (routes, middleware) |
| **TypeScript** | Type-safe JavaScript — catches bugs before runtime |
| **Prisma** | ORM — talks to database using simple code instead of raw SQL |
| **PostgreSQL** | Database — stores all data (users, production, dispatch, etc.) |
| **JWT (JSON Web Token)** | Authentication — secure login tokens |
| **Redis** | Cache & Queue — fast data storage for sessions, background jobs |
| **AWS S3** | File storage — stores uploaded photos/PDFs (challans, invoices) |
| **Zod** | Validation — ensures incoming data is correct format |
| **Bull** | Job queue — background tasks (WhatsApp reports, notifications) |
| **Helmet** | Security — adds HTTP security headers |
| **express-rate-limit** | Security — prevents API abuse (too many requests) |

### Web App (PWA)

| Technology | Purpose |
|-----------|---------|
| **React** | UI library — builds the user interface |
| **Vite** | Build tool — super fast development server & bundler |
| **TypeScript** | Type safety |
| **React Router** | Navigation — handles page routing (Dashboard, Production, etc.) |
| **Zustand** | State management — stores app state (user, language, factory) |
| **Axios** | HTTP client — communicates with backend API |
| **Recharts** | Charts — production graphs, revenue charts |
| **vite-plugin-pwa** | PWA support — makes web app installable & works offline |
| **react-hot-toast** | Notifications — shows success/error messages |

### Mobile App (Android + iOS)

| Technology | Purpose |
|-----------|---------|
| **React Native** | Cross-platform framework — one code for both Android & iOS |
| **Expo** | Development toolkit — simplifies React Native development |
| **React Navigation** | Navigation — bottom tabs, screen transitions |
| **Expo SecureStore** | Secure storage — stores login tokens safely on device |
| **Expo Notifications** | Push notifications — alerts for overdue payments, low stock |
| **EAS Build** | Cloud build service — creates APK (Android) & IPA (iOS) |
| **Zustand** | State management (same as web) |
| **Axios** | API communication (same as web) |

---

## 🐳 Docker — What & Why?

### What is Docker?
Docker creates **containers** — lightweight, isolated environments that package your app with all its dependencies. Think of it as a "box" that contains everything needed to run a service.

### Why Docker in BrickPro?

| Container | What it does |
|-----------|-------------|
| **postgres** | Runs PostgreSQL database — no need to install PostgreSQL on your machine |
| **redis** | Runs Redis cache — for sessions and background job queues |
| **backend** | Runs the API server — same environment as production |
| **web** | Runs the web app with Nginx — serves the built React app |
| **admin** | Runs the admin panel — separate from main web app |
| **landing** | Runs the landing page |

### Docker Benefits:
- ✅ **One command setup** — `docker-compose up` starts everything
- ✅ **Same environment** — works the same on your machine, teammate's machine, and production server
- ✅ **No installation headaches** — don't need to install PostgreSQL, Redis separately
- ✅ **Easy deployment** — push Docker image to AWS, it runs exactly the same
- ✅ **Isolation** — each service runs independently, one crashing doesn't affect others

### Docker Commands:
```bash
# Start all services
cd infra
docker-compose up -d

# Start only database & cache
docker-compose up -d postgres redis

# Stop everything
docker-compose down

# View logs
docker-compose logs backend

# Rebuild after code changes
docker-compose up -d --build backend
```

---

## 🔌 Ports & Services

| Service | Port | URL | When to use |
|---------|------|-----|-------------|
| Backend API | **4000** | http://localhost:4000/api | Always running — all apps talk to this |
| Web App | **3000** | http://localhost:3000 | Open in browser for web version |
| Admin Panel | **3001** | http://localhost:3001 | Your SaaS management dashboard |
| Landing Page | **3002** | http://localhost:3002 | Marketing page for new customers |
| PostgreSQL | **5432** | localhost:5432 | Database — don't open in browser |
| Redis | **6379** | localhost:6379 | Cache — don't open in browser |
| Mobile (Expo) | **8081** | exp://192.168.x.x:8081 | Scan QR code with Expo Go app |

---

## 🔄 How It All Works Together

```
┌─────────────────────────────────────────────────────────────┐
│                        USERS                                 │
│  (Factory Owner, Manager, Operator on Phone/Computer)        │
└─────────────┬──────────────────┬──────────────────┬─────────┘
              │                  │                  │
              ▼                  ▼                  ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Web App       │  │  Android App     │  │   iOS App        │
│   (React PWA)   │  │  (React Native)  │  │  (React Native)  │
│   Port: 3000    │  │  Expo Build      │  │  Expo Build      │
└────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                    │                      │
         └────────────────────┼──────────────────────┘
                              │
                    All apps call same API
                              │
                              ▼
              ┌───────────────────────────────┐
              │        Backend API            │
              │     (Express + Node.js)       │
              │        Port: 4000             │
              │                               │
              │  /api/auth      → Login/OTP   │
              │  /api/production → Brick data │
              │  /api/dispatch  → Challans    │
              │  /api/customers → Parties     │
              │  /api/raw-materials → Stock   │
              │  /api/labour    → Attendance  │
              │  /api/fuel      → Fuel usage  │
              │  /api/reports   → Dashboard   │
              └───────────┬───────────────────┘
                          │
              ┌───────────┼───────────────┐
              │           │               │
              ▼           ▼               ▼
┌──────────────┐  ┌─────────────┐  ┌──────────────┐
│ PostgreSQL   │  │   Redis     │  │   AWS S3     │
│ (Database)   │  │  (Cache)    │  │  (Files)     │
│ Port: 5432   │  │ Port: 6379  │  │  (Cloud)     │
│              │  │             │  │              │
│ Stores:      │  │ Stores:     │  │ Stores:      │
│ - Users      │  │ - Sessions  │  │ - Challan    │
│ - Production │  │ - OTP codes │  │   photos     │
│ - Dispatch   │  │ - Cache     │  │ - Invoices   │
│ - Customers  │  │             │  │ - Attendance │
│ - Labour     │  │             │  │   sheets     │
│ - Raw Matl.  │  │             │  │              │
└──────────────┘  └─────────────┘  └──────────────┘
```

---

## 📱 How Mobile App Works

```
Developer Machine                    User's Phone
┌─────────────────┐                 ┌─────────────────┐
│  Write Code     │                 │  Expo Go App    │
│  (React Native) │   ──build──►   │  (Development)  │
│                 │                 │                 │
│  expo start     │                 │  OR             │
│                 │                 │                 │
│  EAS Build      │   ──build──►   │  APK/IPA        │
│  (Cloud)        │                 │  (Production)   │
└─────────────────┘                 └─────────────────┘
```

- **Development**: Run `expo start`, scan QR with Expo Go app on phone
- **Production Android**: `eas build --platform android` → generates APK → upload to Play Store
- **Production iOS**: `eas build --platform ios` → generates IPA → upload to App Store

---

## 🔐 Authentication & Login Credentials

### Super Admin (SaaS Control Panel)

| Field | Value |
|-------|-------|
| URL | http://localhost:3001 |
| Email | `admin@brickpro.in` |
| Password | `BrickPro@2024` |
| Access | Full platform control — all clients, factories, payments, logs |

> **First-time setup**: Run `POST http://localhost:4000/api/super-admin/seed` to create the super admin account.

### Factory Users (Web App + Mobile App)

| Field | Details |
|-------|--------|
| URL (Web) | http://localhost:3000 |
| Login Method | OTP-based (no password) |
| Roles | OWNER, MANAGER, SUPERVISOR, OPERATOR, ACCOUNTANT |

**New User Signup (Trial):**
```
POST http://localhost:4000/api/auth/trial-signup
{
  "name": "Factory Owner Name",
  "mobile": "9876543210",
  "factoryName": "My Brick Factory"
}
→ Returns JWT token immediately (7-day free trial starts)
```

**Existing User Login:**
```
1. POST /api/auth/send-otp → { "mobile": "9876543210" }
   → OTP printed in server console (dev mode)

2. POST /api/auth/verify-otp → { "mobile": "9876543210", "otp": "123456" }
   → Returns JWT token (24hr) + refresh token (30 days)
```

### Authentication Flow

```
User opens app
      │
      ▼
┌─ Enter Mobile Number ─┐
│                        │
│  POST /api/auth/send-otp
│  → Server generates 6-digit OTP
│  → Sends via SMS/WhatsApp
│  → In dev: OTP printed in server console
│                        │
└────────────────────────┘
      │
      ▼
┌─ Enter OTP ───────────┐
│                        │
│  POST /api/auth/verify-otp
│  → Server verifies OTP
│  → Returns JWT token (valid 24hr)
│  → Returns refresh token (valid 30 days)
│                        │
└────────────────────────┘
      │
      ▼
┌─ App stores token ────┐
│  Web: localStorage     │
│  Mobile: SecureStore   │
│                        │
│  Every API call sends: │
│  Authorization: Bearer <token>
└────────────────────────┘
```

### User Roles & Permissions

| Role | Access Level |
|------|-------------|
| **OWNER** | Full access — all modules, settings, user management |
| **MANAGER** | All operations — production, dispatch, labour, reports |
| **SUPERVISOR** | Production, dispatch, attendance entry |
| **OPERATOR** | Production entry only |
| **ACCOUNTANT** | Dispatch, payments, reports |

---

## 🗄️ Database (PostgreSQL)

PostgreSQL stores ALL application data in tables:

| Table | What it stores |
|-------|---------------|
| `clients` | Factory owners (your customers) |
| `users` | People who use the app (owner, manager, operator) |
| `factories` | Each brick factory/kiln |
| `production_entries` | Daily brick production data |
| `dispatches` | Truck dispatch & challan records |
| `customers` | Dealers/buyers of bricks |
| `fuel_entries` | Coal/wood/gas purchases |
| `labour` | Worker profiles |
| `attendance` | Daily attendance records |
| `labour_payments` | Salary/wage payments |
| `raw_materials` | Material master list (clay, sand, etc.) |
| `suppliers` | Raw material suppliers |
| `raw_material_purchases` | Purchase records |
| `raw_material_consumption` | Daily material usage |
| `raw_material_price_history` | Rate change tracking |

**Prisma** manages the database:
- `prisma migrate` → creates/updates tables
- `prisma generate` → creates TypeScript code to query database
- No need to write raw SQL

---
and delete all previous data and add 2 customers and add expenditure of all types 3 -3 and many more data so i can
all the working profeciency and all other with example  


## 🚀 Deployment (Production)

### Where each service runs:

| Service | Deployed On | URL |
|---------|------------|-----|
| Landing Page | AWS S3 + CloudFront (CDN) | brickpro.in |
| Web App | AWS ECS (Docker container) | app.brickpro.in |
| Admin Panel | AWS ECS | admin.brickpro.in |
| Backend API | AWS ECS | api.brickpro.in |
| Database | AWS RDS (managed PostgreSQL) | internal |
| Cache | AWS ElastiCache (managed Redis) | internal |
| Files | AWS S3 | internal |
| Android | Google Play Store | — |
| iOS | Apple App Store | — |

### CI/CD (Auto-Deploy):
```
Developer pushes code to GitHub
         │
         ▼
GitHub Actions detects which folder changed
         │
         ├── backend/ changed → Build & deploy API
         ├── apps/web/ changed → Build & deploy Web
         ├── apps/mobile/ changed → Build APK/IPA
         └── apps/admin/ changed → Build & deploy Admin
```

Each app deploys **independently** — updating the web app doesn't restart the backend.

---

## 🏃 How to Run Locally

### Quick Start (with Docker):
```powershell
cd infra
docker-compose up -d
# Everything starts automatically
```

### Manual Start (without Docker):

**Prerequisites:**
- Node.js **>= 20.19.4** (required for Expo SDK 54 + React Native 0.81)
- PostgreSQL running on port 5432
- Redis running on port 6379 (optional for dev)

```powershell
# Terminal 1 — Backend API
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
# → Running on http://localhost:4000

# Terminal 2 — Web App (Frontend)
cd apps/web
npm install
npm run dev
# → Running on http://localhost:3000

# Terminal 3 — Mobile App (Expo)
cd apps/mobile
npm install --legacy-peer-deps
npx expo start --clear
# → Scan QR code with Expo Go app on phone
# → Phone & computer must be on same WiFi network

# Terminal 4 — Admin Panel (Super Admin)
cd apps/admin
npm install
npm run dev
# → Running on http://localhost:3001
```

### Troubleshooting:

| Issue | Fix |
|-------|-----|
| `EADDRINUSE: port 4000` | Kill existing process: `taskkill /F /IM node.exe` then restart |
| `PlatformConstants` TurboModule error | Update Node.js to >= 20.19.4 (download from nodejs.org) |
| `Unable to resolve module` error | Run `npm install --legacy-peer-deps` in apps/mobile |
| Expo Go can't connect to API | Ensure phone & PC on same WiFi, check IP in `apps/mobile/src/lib/api.ts` |
| TypeScript compilation error in auth | Ensure `jsonwebtoken` types match — check `backend/src/modules/auth/routes.ts` |

---

## 📦 Key Libraries Explained

| Library | Simple Explanation |
|---------|-------------------|
| **Express** | Like a receptionist — receives requests, routes them to correct handler |
| **Prisma** | Translator between your code and database — you write JS, it writes SQL |
| **JWT** | Digital ID card — proves who you are without asking password every time |
| **React** | Builds UI from reusable components (like LEGO blocks for screens) |
| **Zustand** | Memory for the app — remembers who's logged in, which factory is selected |
| **Axios** | Messenger — sends requests from app to backend and brings back data |
| **Vite** | Super-fast development server — shows changes instantly in browser |
| **Expo** | Toolkit that makes React Native easier — handles builds, notifications, etc. |
| **Docker** | Shipping container for code — packages app + dependencies together |
| **Nginx** | Web server — serves the built web app files to browsers |
| **Redis** | Super-fast notepad — stores temporary data (OTPs, sessions) |
| **Turborepo** | Monorepo tool — manages multiple apps in one repository efficiently |

---

## 🌐 Bilingual (English + Hindi)

The app supports both languages:
- All labels, buttons, messages available in both
- User toggles language with one tap
- Language preference saved (persists across sessions)
- Implementation: Simple key-value translation file (`i18n.ts`)

```typescript
// Example
tr('production', 'en') → "Production"
tr('production', 'hi') → "उत्पादन"
```

---

## 📊 Modules Summary

| Module | What it does |
|--------|-------------|
| **Auth** | OTP login, trial signup, token management |
| **Super Admin** | Platform management — clients, subscriptions, payments, logs |
| **Production** | Daily brick production entry (raw, fired, scrap counts) |
| **Dispatch** | Truck dispatch, challan generation, delivery tracking |
| **Customers** | Dealer/buyer management, outstanding tracking |
| **Fuel** | Coal/wood purchase tracking, cost analytics |
| **Labour** | Worker profiles, attendance (one-tap), salary/payments |
| **Raw Materials** | Material master list, purchase entry, stock tracking, price history |
| **Reports** | Dashboard stats, WhatsApp reports |
| **Factories** | Multi-factory management |

---

## 🛡️ Super Admin Panel

### URL: http://localhost:3001

### Features:
| Feature | Description |
|---------|-------------|
| **Dashboard** | Total clients, paid/trial/expired counts, total factories & users |
| **Client Management** | View all clients, their factories, users |
| **Service Toggle** | Enable/Disable any client's access (ON/OFF switch) |
| **Subscription Status** | Change status: TRIAL → ACTIVE → EXPIRED → SUSPENDED |
| **Payment Tracking** | Add monthly payments, mark as collected/pending |
| **Logs** | Full audit trail — every admin action + all user activity |

### Super Admin API Endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/super-admin/seed` | Create default super admin (run once) |
| POST | `/api/super-admin/login` | Login with email/password |
| GET | `/api/super-admin/dashboard` | Overview stats |
| GET | `/api/super-admin/clients` | All clients with factories, users, payments |
| GET | `/api/super-admin/clients/:id` | Single client details |
| PATCH | `/api/super-admin/clients/:id/toggle` | Enable/disable service |
| PATCH | `/api/super-admin/clients/:id/status` | Change subscription status |
| POST | `/api/super-admin/clients/:id/payments` | Add monthly payment record |
| PATCH | `/api/super-admin/payments/:id` | Mark payment collected/pending |
| GET | `/api/super-admin/payments` | All payments (filter by month/year/status) |
| GET | `/api/super-admin/logs` | Admin action audit logs |
| GET | `/api/super-admin/activity` | User activity logs across platform |

---

## 📋 Logging System

### Admin Logs (AdminLog table)
Tracks every action the super admin performs:

| Logged Action | When |
|---------------|------|
| LOGIN | Admin logs into panel |
| ENABLE_SERVICE | Turns on a client's access |
| DISABLE_SERVICE | Turns off a client's access |
| CHANGE_STATUS | Changes subscription status |
| ADD_PAYMENT | Adds monthly payment record |
| UPDATE_PAYMENT | Marks payment as collected/pending |

Each log stores: admin name, action, target client, details, IP address, timestamp.

### Activity Logs (ActivityLog table)
Tracks all user actions across the platform:

| Field | Description |
|-------|-------------|
| clientId | Which client/factory owner |
| userId | Which user performed action |
| action | What they did (CREATE, UPDATE, DELETE) |
| module | Which module (production, dispatch, etc.) |
| target | What was affected |
| details | Additional info |
| ip | User's IP address |
| createdAt | When it happened |

---

## 💰 Payment & Subscription Model

| Status | Meaning |
|--------|--------|
| **TRIAL** | 7-day free trial (starts on signup) |
| **ACTIVE** | Paid & active subscription |
| **EXPIRED** | Trial/subscription ended, not renewed |
| **SUSPENDED** | Manually disabled by super admin |

### Payment Flow:
1. Client signs up → 7-day free trial starts
2. Trial ends → Status changes to EXPIRED
3. Super admin adds monthly payment (amount, month, year) → Status: "pending"
4. Payment collected manually (cash/UPI) → Super admin marks as "collected"
5. Super admin changes client status to ACTIVE
6. If client doesn't pay → Super admin can DISABLE service

---

*Document version: 2.0 | Last updated: May 2025*

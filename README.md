# 🧱 BrickPro — Brick Factory Management System

A complete SaaS platform for managing brick factories — production, sales, customers, raw materials, labour, expenses, invoices, and reports.

**Built by [managementsystems.in](https://managementsystems.in)**

---

## 🚀 Live Demo

| Platform | URL |
|----------|-----|
| Web App | `brickpro.managementsystems.in` |
| Admin Panel | `admin.brickpro.managementsystems.in` |
| API | `api.brickpro.managementsystems.in` |
| Android APK | `managementsystems.in/download` |

---

## 📱 Screenshots

### Web App
- Dashboard with monthly stats
- Production tracking (brick types, shifts)
- Sell/Dispatch with challan management
- GST Invoice generation (Indian format)
- Reports with charts (Revenue, Profit, Expenses)
- Dark mode support

### Mobile App (Android)
- Native React Native app
- Drawer navigation
- Push notifications
- Swipe-to-dismiss notifications
- UPI payment integration

### Super Admin Panel
- Multi-client management
- Power BI style charts & analytics
- Payment collection tracking
- Notification broadcasting
- Client-wise P&L reports

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (Web) | React 18, TypeScript, Vite, Recharts, Zustand |
| Frontend (Mobile) | React Native, Expo 52, React Navigation |
| Admin Panel | React 18, TypeScript, Vite, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + OTP via Email (Nodemailer) |
| Email | Google Workspace SMTP (admin@managementsystems.in) |
| Deployment | Docker, Nginx, AWS EC2 |

---

## 📦 Project Structure

```
BrickPro/
├── backend/                 # Node.js API
│   ├── prisma/             # Database schema & migrations
│   ├── src/
│   │   ├── common/        # Middleware, Prisma client, Email utility
│   │   ├── config/        # Environment config
│   │   └── modules/       # Feature modules
│   │       ├── auth/      # Login, OTP, Signup
│   │       ├── production/
│   │       ├── dispatch/
│   │       ├── customers/
│   │       ├── raw-materials/
│   │       ├── labour/
│   │       ├── expenditure/
│   │       ├── fuel/
│   │       ├── invoice/
│   │       ├── reports/
│   │       ├── users/
│   │       ├── edit/
│   │       ├── factories/
│   │       └── super-admin/
│   ├── Dockerfile
│   └── package.json
├── apps/
│   ├── web/                # React Web App (PWA)
│   │   ├── src/
│   │   │   ├── components/ # Header, Sidebar, BottomNav
│   │   │   ├── pages/     # All page components
│   │   │   ├── store/     # Zustand stores (auth, app)
│   │   │   └── lib/       # API client, i18n
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   ├── admin/              # Super Admin Panel
│   │   ├── src/pages/     # Dashboard, Clients, Charts, Notifications, etc.
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── mobile/             # React Native (Expo) App
│       ├── src/
│       │   ├── screens/   # All screens
│       │   ├── store/     # Auth & App stores
│       │   └── lib/       # API, theme, i18n
│       ├── app.json
│       └── eas.json
├── docker-compose.yml      # 4 containers (db, backend, web, admin)
├── nginx.conf              # Single-container nginx config
├── CHANGES_TRACKER.md      # Detailed changelog
└── README.md
```

---

## ✨ Features

### 👤 Multi-Tenant SaaS
- Multiple clients (brick factories) on single platform
- Each client has own factories, users, customers
- Role-based access: OWNER, MANAGER, SUPERVISOR, OPERATOR, ACCOUNTANT, WORKER
- 7-day free trial → ₹999/month subscription

### 🧱 Production
- Daily brick production tracking
- Multiple brick types (Fly Ash, Red, etc.)
- Shift-wise entry (Morning, Evening, Night)
- Monthly summaries with charts

### 🚛 Sell / Dispatch
- Challan-based dispatch system
- Customer selection with auto-rate
- Payment tracking (Paid, Partial, Credit)
- WhatsApp share (challan + payment receipt)
- Distance (KM) tracking

### 📄 Invoice (Indian GST Format)
- Proper Indian GST invoice layout
- SGST/CGST/IGST split
- HSN codes, Amount in words (Indian format)
- Bank details, Terms & conditions
- A4 print-ready

### 👥 Customers
- Customer ledger (bank-style running balance)
- Credit limit tracking
- GSTIN, address, multiple contacts
- Outstanding alerts (30+ days)

### 🪨 Raw Materials
- Material inventory with suppliers
- Purchase tracking with payment status
- Price history
- Stock consumption tracking

### 👷 Labour
- Per-brick rate calculation
- Production-based earnings
- Payment tracking with pending balance
- Monthly summaries

### 💸 Expenditure
- 12+ categories (Electricity, Diesel, JCB, Repair, etc.)
- Category-wise breakdown
- Monthly filters

### ⛽ Fuel
- Fuel entry tracking
- Multiple fuel types
- Supplier management

### 📊 Reports & Charts
- Revenue vs Expenses (12 months)
- Profit trend
- Production charts
- Payment status distribution
- Expense by category
- Top customers
- PDF & Excel download

### 📅 Calendar
- Activity dots on calendar
- Single date detail view
- Date range P&L summary

### 🔔 Notifications
- Admin broadcasts to all/specific clients
- 10 pre-built templates
- Push notifications on Android
- Swipe-to-dismiss
- Auto welcome notifications on signup

### 🔐 Authentication
- Email/Password login
- OTP via email (Google Workspace SMTP)
- JWT + Refresh tokens
- Role-based authorization
- Account suspend/trial expiry handling

### 🌙 Dark Mode
- Full dark mode support (web + mobile)
- System-aware theme

### 🌐 Bilingual
- English + Hindi (हिंदी)
- Toggle in header

---

## 🐳 Docker Deployment

### Prerequisites
- Docker & Docker Compose installed
- Domain pointed to server IP

### Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/BrickPro.git
cd BrickPro

# Set environment
echo "SMTP_PASS=your_google_app_password" > .env

# Build & Run
docker-compose up --build -d

# Run database migrations
docker-compose exec backend npx prisma db push

# Seed super admin
curl -X POST http://localhost:4000/api/super-admin/seed
```

### Access
| Service | URL |
|---------|-----|
| Web App | http://localhost |
| Admin Panel | http://localhost:3001 |
| API | http://localhost:4000 |
| Database | localhost:5432 |

---

## 🔧 Local Development

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev

# Web App
cd apps/web
npm install
npm run dev

# Admin Panel
cd apps/admin
npm install
npm run dev

# Mobile App
cd apps/mobile
npm install
npx expo start
```

---

## 🔑 Default Credentials

### Super Admin
| Email | Password |
|-------|----------|
| admin@managementsystems.in | Admin@2024 |

### OTP
All OTPs are sent to user's registered email via `admin@managementsystems.in`

---

## 📱 Mobile APK Build

```bash
cd apps/mobile
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

APK download link will be provided after build completes (~10 min).

---

## 🌐 AWS Deployment

### Recommended Setup
- EC2 `t3.small` (~₹1000/month)
- PostgreSQL on same instance or RDS
- Nginx reverse proxy + Let's Encrypt SSL
- Docker Compose for orchestration

### Domain Structure
| Subdomain | Points To |
|-----------|-----------|
| `brickpro.managementsystems.in` | Web App (port 80) |
| `admin.brickpro.managementsystems.in` | Admin Panel (port 3001) |
| `api.brickpro.managementsystems.in` | Backend API (port 4000) |

---

## 📄 License

Proprietary — © 2024 managementsystems.in. All rights reserved.

---

## 📞 Contact

| Channel | Details |
|---------|---------|
| Email | admin@managementsystems.in |
| WhatsApp | +91 9992662555 |
| Website | [managementsystems.in](https://managementsystems.in) |

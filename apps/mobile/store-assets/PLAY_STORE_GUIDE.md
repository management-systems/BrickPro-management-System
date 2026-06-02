# 📱 BrickPro — Play Store / APK Release Guide

## 📁 Folder Structure
```
apps/mobile/store-assets/
├── PLAY_STORE_GUIDE.md      ← This file
├── icon-512x512.png         ← App icon (you need to create/export)
├── banner-1024x500.png      ← Feature graphic (you need to create/export)
├── screenshots/             ← 5 screenshots (9:16 ratio - 1080x1920px)
│   ├── 01-dashboard.png
│   ├── 02-production.png
│   ├── 03-dispatch.png
│   ├── 04-reports.png
│   └── 05-settings.png
└── privacy-policy.html      ← Host this on managementsystems.in/privacy
```

---

## 🔑 App Details

### Short Description (80 chars max)
```
Brick factory management — production, sales, invoices, reports & more.
```

### Long Description (4000 chars max)
```
BrickPro — Complete Brick Factory Management System

Manage your entire brick factory from your phone. Track production, sales, customers, raw materials, labour, expenses, and generate professional GST invoices — all in one app.

🧱 PRODUCTION TRACKING
• Daily brick production entry (shift-wise)
• Multiple brick types (Fly Ash, Red, AAC, etc.)
• Monthly production summaries & charts

🚛 SELL / DISPATCH
• Challan-based dispatch management
• Auto-fill customer rates
• Payment tracking (Paid, Partial, Credit)
• Share challan on WhatsApp instantly

📄 GST INVOICE
• Professional Indian GST invoice format
• SGST/CGST/IGST auto-calculation
• HSN codes, Amount in words
• Bank details & signatory
• Print-ready A4 format

👥 CUSTOMER MANAGEMENT
• Customer ledger (bank-style balance)
• Outstanding & credit tracking
• GSTIN, address, contacts
• 30-day pending alerts

🪨 RAW MATERIALS
• Material inventory & stock tracking
• Supplier management
• Purchase history with payment status
• Price history tracking

👷 LABOUR MANAGEMENT
• Per-brick rate calculation
• Production-based earnings
• Payment tracking with pending balance
• Monthly summaries

💸 EXPENDITURE & FUEL
• 12+ expense categories
• Category-wise breakdown
• Fuel consumption tracking
• Monthly filters & reports

📊 REPORTS & CHARTS
• Revenue vs Expenses charts
• Profit trend analysis
• Production & dispatch analytics
• Payment status distribution
• PDF & Excel export

📅 CALENDAR VIEW
• Activity dots on calendar dates
• Single date detail view
• Date range P&L summary

🔔 NOTIFICATIONS
• Real-time notifications from admin
• Payment reminders
• System updates

✨ MORE FEATURES
• Multi-factory support
• Role-based access (Owner, Manager, Supervisor, Operator)
• Dark mode & Hindi language support
• WhatsApp integration for challans & receipts
• Offline-ready (PWA)
• Secure OTP-based login

💰 PRICING
• 7-day FREE trial (all features)
• ₹999/month after trial
• Unlimited users, factories & data

📞 SUPPORT
• WhatsApp support
• Email: admin@managementsystems.in
• Website: managementsystems.in

Made for Indian brick factory owners, managers & accountants. Simplify your brick kiln operations today!
```

---

## 🔒 Privacy Policy URL
```
https://managementsystems.in/privacy
```

Host the privacy-policy.html file (included in this folder) at the above URL.

---

## 🔑 Demo Login Credentials

### For Play Store Review Team
```
Email: demo@managementsystems.in
Password: Demo@2024
```
OR
```
Mobile: 9876543210
OTP: Will be sent to registered email
```

### Test Account Details
- **Name:** Rajesh Sharma
- **Factory:** Sharma Brick Industries
- **Role:** OWNER (full access)
- **Features to test:** Production, Dispatch, Customers, Reports, Invoice, Settings

---

## 📐 Asset Specifications

### App Icon (512×512 px)
- Format: PNG (32-bit, no alpha for Play Store)
- Background: Solid #2563eb (blue) or #6C63FF (purple)
- Foreground: White brick emoji 🧱 or custom brick icon
- Rounded corners: Play Store auto-applies
- File: `icon-512x512.png`

### Feature Graphic / Banner (1024×500 px)
- Format: PNG or JPEG
- Content suggestion:
  - Left: "🧱 BrickPro" logo + tagline
  - Right: Phone mockup showing dashboard
  - Background: Gradient blue (#2563eb → #1d4ed8)
  - Text: "Brick Factory Management Made Easy"
- File: `banner-1024x500.png`

### Screenshots (1080×1920 px — 9:16 ratio)
- Minimum: 4 screenshots, Recommended: 5-8
- Format: PNG or JPEG
- Suggested screens:
  1. **Dashboard** — Stats cards, quick actions
  2. **Production** — Brick type cards, entries
  3. **Dispatch/Sell** — Challan list with payment status
  4. **Reports/Charts** — Revenue/profit charts
  5. **Settings** — Premium plan, UPI payment, dark mode

### How to take screenshots:
1. Open Expo Go on phone
2. Navigate to each screen
3. Take screenshot (Power + Volume Down)
4. Resize to exactly 1080×1920 if needed

---

## 🏗️ Build AAB File

### Prerequisites
```bash
npm install -g eas-cli
cd apps/mobile
eas login
```

### Build AAB (for Play Store)
```bash
eas build --platform android --profile production
```
This generates an `.aab` file (Android App Bundle) — required by Play Store.

### Build APK (for direct install / testing)
```bash
eas build --platform android --profile preview
```
This generates an `.apk` file — for testing or direct distribution.

### First time setup
```bash
# Link to EAS project
eas init

# Update app.json with your EAS project ID
# Then build
eas build --platform android --profile production
```

---

## 📋 Play Store Console Checklist

### Before Upload
- [ ] App icon 512×512 created
- [ ] Feature graphic 1024×500 created
- [ ] 5 screenshots (1080×1920) captured
- [ ] Short description written (80 chars)
- [ ] Long description written (4000 chars)
- [ ] Privacy policy hosted at URL
- [ ] Demo login credentials ready
- [ ] AAB file built via EAS
- [ ] App tested on real device

### Play Store Console Steps
1. Go to https://play.google.com/console
2. Create new app → "BrickPro"
3. Fill in:
   - App name: `BrickPro - Brick Factory Management`
   - Short description: (from above)
   - Full description: (from above)
4. Upload graphics:
   - App icon → icon-512x512.png
   - Feature graphic → banner-1024x500.png
   - Phone screenshots → 5 images
5. Content rating → Complete questionnaire
6. Target audience → "General" (not children)
7. Privacy policy → Enter URL
8. App access → "All functionality available without special access" OR provide demo login
9. Upload AAB → Production track
10. Review → Submit

---

## 🚀 Without Play Store (Direct APK)

If you want to distribute without Play Store:

1. Build APK: `eas build --platform android --profile preview`
2. Download the APK from EAS dashboard
3. Host on your website: `managementsystems.in/download/brickpro.apk`
4. Share download link with clients
5. Users enable "Install from unknown sources" → Install

### OTA Updates (no re-download needed)
```bash
eas update --branch production --message "Bug fixes"
```
Users get updates automatically next time they open the app!

---

## 📝 App Categorization

| Field | Value |
|-------|-------|
| Category | Business |
| Content rating | Everyone |
| Target audience | 18+ (business app) |
| Countries | India (primary), All |
| Language | English, Hindi |
| Pricing | Free (in-app subscription) |

---

*Created: May 2026*
*Contact: admin@managementsystems.in*

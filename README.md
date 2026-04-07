# Gym Management System

A fully client-side gym management web app built with HTML, CSS, and vanilla JS. All data is stored in `localStorage`.

## Features
- Member management (add, edit, delete, photo upload)
- Membership plans (add, edit, delete)
- Attendance tracking with history and CSV export
- Payments & invoicing with WhatsApp reminders
- Store POS & inventory management
- Class scheduling (weekly view)
- Notifications for expiring/expired memberships and overdue payments
- Settings: gym profile, admin management, data export/clear

## Default Login
- Username: `admin`
- Password: `gym@2024`

## Deploy to Vercel

### Option 1 — Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option 2 — Vercel Dashboard
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo
4. Framework: **Other** (no build step needed)
5. Click Deploy

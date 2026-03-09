# Tenant Manager

A production-ready web application for Indian property owners to manage properties, flats, tenants, rent collection, deposits, expenses, and monthly balance sheets.

## Tech Stack

- **Next.js 14** (App Router)
- **Node.js API routes** (Next.js Route Handlers)
- **MongoDB** (Mongoose)
- **TailwindCSS** for UI
- **JWT** authentication (jose)
- **bcrypt** for password hashing

## Features

- **Authentication**: Register, Login, JWT, bcrypt
- **Multi-user**: Owner can create sub-users (Manager, Accountant, Viewer) with role-based permissions
- **Property & Flat management**: CRUD, soft delete
- **Tenant management**: Add/edit tenants, track deposit and rent
- **Rent management**: Rent due list, collect rent, prorated rent (full month, half month, mid-month leave)
- **Deposit tracking**: Pending deposit list on dashboard
- **Expenses**: Add and list expenses
- **Balance sheet**: Monthly rent income, expenses, final balance
- **Notes**: Create notes, pin to dashboard
- **Global search**: Search tenants, properties, flats
- **Dashboard**: Stats, recent payments, pending rent, pending deposits, pinned notes

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.local.example` to `.env.local` and set:

   - `MONGODB_URI` – MongoDB connection string (e.g. `mongodb://localhost:27017/tenant_manager`)
   - `JWT_SECRET` – Strong random string for JWT signing

3. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Register a new user (owner), then use the dashboard.

## Project Structure

```
/app
  /api          – API routes (auth, properties, flats, tenants, rent, expenses, notes, users, dashboard, search, balance-sheet)
  /(main)       – Dashboard layout (sidebar, search, protected)
    /dashboard
    /properties, /flats, /tenants, /rent, /expenses, /balance-sheet, /notes, /users
  /login, /register
/components     – ProtectedRoute, Sidebar, GlobalSearch
/lib
  db.ts         – MongoDB connection
  auth.ts       – JWT & bcrypt helpers
  api-auth.ts   – getCurrentUser for API routes
  api-client.ts – Frontend API helper (token in localStorage)
  permissions.ts – Role permissions
  rent-calc.ts  – Prorated rent logic
  /models       – Mongoose models (User, Property, Flat, Tenant, RentPayment, Expense, Note)
```

## Roles & Permissions

- **Owner**: Full access; can create/edit/deactivate sub-users.
- **Manager**: Tenants, rent, reports (no payments/expenses).
- **Accountant**: Payments, expenses, balance sheet, notes, reports.
- **Viewer**: Read-only.

Data is scoped by owner: sub-users see the same data as the owner they belong to.

## Rent Calculation

- Full month: full rent.
- Join mid-month: prorated by days remaining.
- Leave mid-month: prorated by days stayed.
- Pending rent includes current month and previous unpaid months (simplified to last 3 months in due list).

## Soft Delete

Properties, flats, and tenants use `isDeleted: true` instead of hard delete. List and detail APIs filter these out.

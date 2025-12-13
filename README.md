# Tenant Management SaaS

A modern, simple, and scalable SaaS Tenant Management System for the Indian local market.

## Tech Stack

- **Frontend:** Next.js (JavaScript)
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Authentication:** JWT
- **File Storage:** Cloudinary
- **Payments:** Razorpay / Cashfree
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion

## Features

- 🏠 Property Management
- 👥 Tenant Management
- 💰 Rent & Payment Tracking
- 📘 Tenant Ledger (Passbook-style)
- 🧾 Expense Management
- 📊 Reports (PDF & Excel Export)
- 🔔 Reminders & Alerts
- 🧑‍💼 Admin Panel
- 🎁 60-Day Free Trial

## Setup

1. Install dependencies:
```bash
npm run install-all
```

2. Set up environment variables:
- Create `.env` in `server/` directory
- Create `.env.local` in `client/` directory

3. Run development servers:
```bash
npm run dev
```

## Environment Variables

### Server (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

### Client (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
```

## License

ISC


# Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for document storage)
- Razorpay account (for payments - optional for development)

## Installation

1. **Install dependencies:**
```bash
npm run install-all
```

2. **Set up environment variables:**

   **Server (.env in `server/` directory):**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/tenant_management
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ```

   **Client (.env.local in `client/` directory):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

3. **Start MongoDB:**
   - If using local MongoDB, ensure it's running
   - Or use MongoDB Atlas (cloud)

4. **Run the application:**
```bash
npm run dev
```

This will start both the server (port 5000) and client (port 3000).

## Creating Admin User

To create an admin user, you can use MongoDB shell or a tool like MongoDB Compass:

```javascript
// In MongoDB shell or Compass
use tenant_management
db.users.insertOne({
  name: "Admin",
  email: "admin@example.com",
  password: "$2a$10$...", // bcrypt hash of your password
  role: "admin",
  subscription: {
    plan: "yearly",
    trialStartDate: new Date(),
    trialEndDate: new Date(Date.now() + 60*24*60*60*1000),
    isActive: true
  },
  isBlocked: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or use a tool to hash your password first, then insert.

## Features

✅ User Authentication (JWT)
✅ 60-day Free Trial
✅ Property Management
✅ Tenant Management
✅ Document Upload (Cloudinary)
✅ Payment Tracking
✅ Tenant Ledger (Passbook-style)
✅ Expense Management
✅ Reports (Balance Sheet, Property Income, Yearly Summary)
✅ PDF & Excel Export
✅ Admin Panel
✅ Mobile-responsive Design

## Payment Integration

Razorpay integration is set up in the codebase but needs to be completed in the subscription page. The payment flow should:

1. Create a Razorpay order
2. Handle payment success callback
3. Update user subscription in database

## Email Reminders

Email reminders for rent due and agreement expiry can be implemented using the nodemailer setup. Create a cron job or scheduled task to:

1. Check for upcoming rent due dates
2. Check for agreement expiry dates
3. Send email reminders

## Production Deployment

1. Set up production MongoDB (MongoDB Atlas recommended)
2. Configure production environment variables
3. Set up Cloudinary for production
4. Configure Razorpay for production
5. Deploy server (Heroku, Railway, AWS, etc.)
6. Deploy client (Vercel, Netlify, etc.)
7. Update CORS settings
8. Set up SSL certificates

## Notes

- The trial logic automatically starts a 60-day trial on registration
- After trial expiry, users get read-only access
- Admin can extend trials and manage users
- All sensitive operations require authentication
- File uploads are handled via Cloudinary


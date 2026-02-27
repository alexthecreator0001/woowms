# WooWMS Onboarding Flow Design

## Flow
Register → Email Verification (6-digit code) → Connect WooCommerce Store → Dashboard

## Step 1: Email Verification
- After registration, redirect to /onboarding/verify-email
- Send 6-digit code via Resend API
- 6 individual digit inputs, centered UI
- Code expires after 10 minutes
- Resend button with 60-second cooldown
- Mark user emailVerified: true on success

## Step 2: Connect WooCommerce Store
- Navigate to /onboarding/connect-store
- Store Name, URL, Consumer Key, Consumer Secret, Webhook Secret
- Clean onboarding card with step indicator
- "Skip for now" option
- Trigger initial sync on success

## Step 3: Done → Dashboard

## Backend Changes
- User model: add emailVerified, verificationCode, verificationCodeExpiresAt
- Endpoints: POST /auth/send-verification, POST /auth/verify-email
- Resend npm package for email
- Middleware: block unverified users from protected routes

## Frontend Changes
- /onboarding/verify-email page
- /onboarding/connect-store page
- PrivateRoute checks verification status
- Step indicator component

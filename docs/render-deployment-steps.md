# Deploying Express Auth Frontend to Render - Complete Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Understanding the Authentication Architecture](#understanding-the-authentication-architecture)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Critical Cookie Configuration](#critical-cookie-configuration)
- [Environment Variables](#environment-variables)
- [Backend Configuration Requirements](#backend-configuration-requirements)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Security Considerations](#security-considerations)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Prerequisites

Before deploying to Render, ensure you have:

- ✅ GitHub repository with your frontend code
- ✅ Backend API deployed and running on Render (`https://express-auth-rkti.onrender.com`)
- ✅ Backend configured to accept requests from your frontend domain
- ✅ Render account (free tier works, but paid tier recommended for production)
- ✅ Understanding of httpOnly cookie authentication requirements

---

## Understanding the Authentication Architecture

Your application uses **httpOnly cookies** for JWT tokens, which has specific requirements:

### How It Works

1. **Login Flow:**

   ```
   Frontend → POST /api/v1/auth/login → Backend
   Backend → Sets httpOnly cookies (accessToken, refreshToken) → Frontend
   Frontend → Stores user data in Zustand → Redirects to dashboard
   ```

2. **Authenticated Requests:**

   ```
   Frontend → GET /api/v1/auth/sessions (cookies sent automatically) → Backend
   Backend → Validates accessToken cookie → Returns data
   ```

3. **Token Refresh:**
   ```
   Frontend → Receives 401 (expired token) → Axios interceptor triggered
   Interceptor → POST /api/v1/auth/refresh → Backend
   Backend → Issues new tokens as cookies → Frontend retries original request
   ```

### Critical Requirements

- **Same-Site Cookies:** Backend and frontend must be on same domain OR backend must set `sameSite=none; secure=true`
- **HTTPS Required:** Cookies with `secure` flag only work over HTTPS
- **CORS Configuration:** Backend must allow credentials from frontend origin
- **Cookie Domain:** Backend must set appropriate cookie domain for cross-site scenarios

---

## Pre-Deployment Checklist

### 1. Review Backend Configuration

**CRITICAL:** Your backend MUST be configured properly for cross-origin cookie authentication.

Check your backend `.env` file has these settings:

```env
# Backend Environment Variables (on Render)
NODE_ENV=production
FRONTEND_URL=https://your-app-name.onrender.com

# Cookie Settings
COOKIE_DOMAIN=.onrender.com  # IMPORTANT: Leading dot allows subdomains
COOKIE_SAME_SITE=none        # Required for cross-origin cookies
COOKIE_SECURE=true           # Required in production

# CORS Settings
CORS_ORIGIN=https://your-app-name.onrender.com
CORS_CREDENTIALS=true        # CRITICAL: Must be true for cookies

# Your existing backend settings
DATABASE_URL=your-database-url
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
# ... other backend vars
```

### 2. Verify Backend Endpoints

Test your backend is accessible and returning correct CORS headers:

```bash
# Test health endpoint
curl -I https://express-auth-rkti.onrender.com/health

# Should return headers including:
# Access-Control-Allow-Origin: https://your-frontend-domain
# Access-Control-Allow-Credentials: true
```

### 3. Test Backend Cookie Configuration

Create a test HTML file and open in browser:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Cookie Test</title>
  </head>
  <body>
    <script>
      fetch('https://express-auth-rkti.onrender.com/api/v1/auth/login', {
        method: 'POST',
        credentials: 'include', // CRITICAL
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPass123!',
        }),
      })
        .then((r) => r.json())
        .then((d) => console.log('Login response:', d))
        .catch((e) => console.error('Login error:', e));
    </script>
  </body>
</html>
```

**Expected Results:**

- No CORS errors in console
- Cookies appear in Application → Cookies tab
- Login response has user data

**If you see CORS errors:**

- Backend CORS configuration is incorrect
- `CORS_CREDENTIALS=true` not set
- Frontend origin not whitelisted

### 4. Update Frontend Configuration

Update your local files before deploying:

**File: `.env.production`**

```env
# Production API URL - Your backend on Render
VITE_API_BASE_URL=https://express-auth-rkti.onrender.com

# Optional: Enable production logging
VITE_DEBUG=false
```

**File: `vite.config.ts`**

**⚠️ IMPORTANT:** Remove or comment out the `server.proxy` configuration for production:

```typescript
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // REMOVE OR COMMENT OUT PROXY IN PRODUCTION
  // Proxy is only needed for local development
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'https://express-auth-rkti.onrender.com',
  //       changeOrigin: true,
  //       secure: true,
  //       cookieDomainRewrite: 'localhost',
  //     },
  //   },
  // },
});
```

**Why remove proxy?**

- Proxy is for local development only
- In production, frontend makes direct requests to backend
- Proxy can cause cookie domain mismatches
- Static site on Render has no proxy capability

**File: `src/lib/api.ts`**

Verify your API configuration:

```typescript
import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

export const api = axios.create({
  baseURL: API_BASE_URL, // Uses VITE_API_BASE_URL from env
  withCredentials: true, // CRITICAL: Sends cookies with every request
  headers: { 'Content-Type': 'application/json' },
});

// Your existing interceptors...
```

### 5. Test Production Build Locally

Build and preview your app to catch any issues:

```bash
# Build with production environment
npm run build

# Preview production build
npm run preview

# Open browser to http://localhost:4173
# Test login flow completely
```

**Verify:**

- ✅ No console errors
- ✅ Environment variables loaded correctly
- ✅ API calls use correct backend URL
- ✅ No references to localhost

---

## Step-by-Step Deployment

### Step 1: Prepare Your Repository

**Option A: Clean Main Branch**

```bash
# Commit all changes
git add .
git commit -m "chore: prepare for Render deployment"

# Push to GitHub
git push origin main
```

**Option B: Create Deployment Branch**

```bash
# Create production branch
git checkout -b production

# Commit production-ready code
git add .
git commit -m "chore: production deployment configuration"

# Push to GitHub
git push origin production
```

### Step 2: Create Static Site on Render

1. **Log into Render Dashboard**

   - Go to https://dashboard.render.com

2. **Create New Static Site**

   - Click "New +" button
   - Select "Static Site"

3. **Connect GitHub Repository**

   - Choose "Connect a repository"
   - Authorize Render to access your GitHub
   - Select your repository
   - Click "Connect"

4. **Configure Build Settings**

   Fill in the following fields:

   **Name:** `express-auth-frontend` (or your preferred name)

   - This becomes your URL: `https://express-auth-frontend.onrender.com`
   - Choose wisely - changing it later requires new deployment

   **Branch:** `main` (or `production` if you created one)

   **Root Directory:** Leave blank (uses repository root)

   **Build Command:**

   ```bash
   npm install && npm run build
   ```

   **Publish Directory:**

   ```
   dist
   ```

   **Auto-Deploy:** `Yes`

   - Automatically deploys when you push to the branch

5. **Add Environment Variables**

   Click "Advanced" → "Add Environment Variable"

   Add the following:

   | Key                 | Value                                    |
   | ------------------- | ---------------------------------------- |
   | `VITE_API_BASE_URL` | `https://express-auth-rkti.onrender.com` |
   | `VITE_DEBUG`        | `false`                                  |
   | `NODE_VERSION`      | `18`                                     |

   **Important Notes:**

   - Environment variables MUST start with `VITE_` to be exposed to the client
   - Use your actual backend URL
   - NODE_VERSION ensures consistent Node.js version

6. **Create Static Site**
   - Click "Create Static Site"
   - Render will start building your application

### Step 3: Monitor Initial Build

Watch the build logs in real-time:

1. **Build Process Takes 2-5 Minutes:**

   ```
   ==> Cloning from GitHub...
   ==> Installing dependencies...
   ==> Running build command...
   ==> Build successful
   ==> Deploy live at https://your-app.onrender.com
   ```

2. **Common Build Issues:**

   - **TypeScript errors:** Fix locally, commit, push
   - **Missing dependencies:** Ensure `package.json` is up to date
   - **Build timeout:** Free tier has limits; consider paid tier

3. **Build Success Indicators:**
   - Green "Live" badge on dashboard
   - "Deploy successful" message
   - URL becomes clickable

### Step 4: Update Backend CORS Configuration

**CRITICAL:** Update your backend to allow your new frontend domain.

1. **Access Backend Environment Variables on Render**

   - Go to your backend service on Render
   - Navigate to "Environment" tab

2. **Update CORS Settings**

   Update these environment variables:

   ```env
   FRONTEND_URL=https://express-auth-frontend.onrender.com
   CORS_ORIGIN=https://express-auth-frontend.onrender.com
   ```

   **If supporting multiple origins:**

   ```env
   CORS_ORIGIN=https://express-auth-frontend.onrender.com,http://localhost:5173
   ```

3. **Verify Cookie Settings Are Correct**

   Ensure these are set:

   ```env
   COOKIE_DOMAIN=.onrender.com
   COOKIE_SAME_SITE=none
   COOKIE_SECURE=true
   CORS_CREDENTIALS=true
   ```

4. **Save and Deploy Backend**
   - Click "Save Changes"
   - Backend will automatically redeploy (takes 1-2 minutes)
   - Wait for "Live" status before testing frontend

### Step 5: Configure SPA Routing Support

**CRITICAL:** This step is required for client-side routing to work properly.

Without this configuration, you'll get 404 errors when:

- Navigating directly to any route (e.g., `https://your-app.onrender.com/login`)
- Refreshing the page on any route except home
- Sharing deep links to your app

**Why This Happens:**

When you visit `https://your-app.onrender.com/login`:

1. Browser requests `/login` from Render's static server
2. Server looks for a file at `public/login/index.html`
3. That file doesn't exist (routing is handled by React Router)
4. Server returns 404 error

**The Solution:**

Configure redirects and headers directly in the Render Dashboard.

#### Configure Redirects/Rewrites

1. **Go to Render Dashboard** → Your static site
2. **Click "Redirects/Rewrites"** in the left sidebar
3. **Click "Add Rule"**
4. **Configure the rewrite rule:**
   ```
   Type: Rewrite
   Source: /*
   Destination: /index.html
   ```
5. **Click "Save"**

**What This Does:**

- Catches all route requests (`/*`)
- Serves `index.html` for every route
- Returns 200 status (success)
- React Router then takes over and displays the correct component

#### Configure Custom Headers (Optional but Recommended)

While in the Render Dashboard, also add security and performance headers:

1. **Click "Headers"** in the left sidebar
2. **Add the following header rules:**

**Security Headers:**

```
Path: /*
Name: X-Frame-Options
Value: DENY

Path: /*
Name: X-Content-Type-Options
Value: nosniff

Path: /*
Name: Referrer-Policy
Value: strict-origin-when-cross-origin
```

**Performance Headers (Cache Control):**

```
Path: /assets/*
Name: Cache-Control
Value: public, max-age=31536000, immutable

Path: /*.html
Name: Cache-Control
Value: no-cache, no-store, must-revalidate
```

3. **Click "Save"** after adding each header

#### Verify After Deployment

1. **Test direct route access:**

   ```bash
   curl -I https://your-app.onrender.com/login

   # Expected response:
   # HTTP/2 200
   # content-type: text/html
   # x-frame-options: DENY
   # x-content-type-options: nosniff
   ```

2. **In browser:**
   - Navigate to `https://your-app.onrender.com/login` directly
   - Refresh any page in your app
   - All routes should work ✅

**Important Notes:**

- ⚠️ Configure these settings **BEFORE** first deployment or clear cache and redeploy after adding
- ⚠️ Changes to Redirects/Rewrites take effect immediately
- ⚠️ No code changes or rebuilds required
- ✅ This is Render's official recommendation for SPAs
- ✅ Works with all client-side routing libraries (React Router, Vue Router, etc.)

### Step 6: Configure Backend CORS and Cookies

**CRITICAL:** This step is required for your backend to work with the deployed frontend.

Without this configuration, your frontend will not be able to communicate with the backend due to CORS and cookie issues.

#### Update Backend Environment Variables

1. **Go to Render Dashboard** → Your backend service
2. **Click "Environment"** in the left sidebar
3. **Update the following variables:**

   ```env
   FRONTEND_URL=https://express-auth-frontend.onrender.com
   CORS_ORIGIN=https://express-auth-frontend.onrender.com
   ```

   **If supporting multiple origins:**

   ```env
   CORS_ORIGIN=https://express-auth-frontend.onrender.com,http://localhost:5173
   ```

4. **Ensure Cookie Settings Are Correct**

   ```env
   COOKIE_DOMAIN=.onrender.com
   COOKIE_SAME_SITE=none
   COOKIE_SECURE=true
   CORS_CREDENTIALS=true
   ```

5. **Save Changes**

   - Click "Save Changes"
   - Wait for the backend to redeploy (1-2 minutes)

#### Verify Backend Configuration

1. **Test CORS Configuration**

   From your frontend (browser console):

   ```javascript
   fetch('https://express-auth-rkti.onrender.com/api/v1/auth/login', {
     method: 'POST',
     credentials: 'include',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'test@example.com',
       password: 'TestPass123!',
     }),
   })
     .then((response) => {
       console.log('CORS test response:', response);
       return response.json();
     })
     .then((data) => console.log('Data:', data))
     .catch((error) => console.error('Error:', error));
   ```

   **Expected:**

   - No CORS errors in console
   - Response contains user data

2. **Verify Cookie Settings**

   After logging in, check cookies:

   ```javascript
   document.cookie.split(';').forEach((cookie) => {
     console.log('Cookie:', cookie);
   });
   ```

   **Expected:**

   - `accessToken` and `refreshToken` cookies are visible
   - Cookies have correct attributes (httpOnly, secure, sameSite)

---

## Critical Cookie Configuration

### Understanding Cookie Challenges with Render

**The Problem:**

- Frontend: `https://your-app.onrender.com`
- Backend: `https://express-auth-rkti.onrender.com`
- These are **different subdomains** under `onrender.com`

**The Solution:**

Your backend must set cookies with these attributes:

```javascript
// Backend cookie configuration (for reference)
res.cookie('accessToken', token, {
  httpOnly: true, // Prevents JavaScript access (security)
  secure: true, // HTTPS only (required in production)
  sameSite: 'none', // CRITICAL: Allows cross-site cookies
  domain: '.onrender.com', // CRITICAL: Allows all *.onrender.com subdomains
  maxAge: 900000, // 15 minutes
});
```

**Why `sameSite: 'none'` and `domain: '.onrender.com'`?**

Without these settings:

- ❌ Browser blocks cookies from `express-auth-rkti.onrender.com` when on `your-app.onrender.com`
- ❌ Login succeeds but cookies aren't saved
- ❌ Subsequent requests fail with 401 Unauthorized

With correct settings:

- ✅ Browser accepts cookies from backend
- ✅ Cookies sent automatically with every request
- ✅ Authentication works seamlessly

### Verify Cookie Configuration

**Test in Browser Console (on deployed frontend):**

```javascript
// After logging in, check cookies
document.cookie.includes('accessToken');
// Should return: false (because httpOnly, but cookies exist in browser)

// Check Application → Cookies in DevTools
// Should see: accessToken, refreshToken, possibly rememberedDeviceToken
// Domain should be: .onrender.com
// SameSite should be: None
// Secure should be: ✓ (checked)
```

### Alternative: Custom Domain (Recommended for Production)

For production apps, use a custom domain to avoid cross-origin issues:

1. **Purchase domain** (e.g., from Namecheap, Google Domains)

2. **Set up subdomains:**

   - Frontend: `app.yourdomain.com`
   - Backend: `api.yourdomain.com`

3. **Configure DNS:**

   ```
   app.yourdomain.com  → CNAME → your-app.onrender.com
   api.yourdomain.com  → CNAME → express-auth-rkti.onrender.com
   ```

4. **Update backend cookie settings:**

   ```env
   COOKIE_DOMAIN=.yourdomain.com
   COOKIE_SAME_SITE=lax  # Can use 'lax' instead of 'none' with same domain
   ```

5. **Update frontend environment:**
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com
   ```

**Benefits:**

- Same domain = simpler cookie handling
- More professional appearance
- Better SEO
- `sameSite: 'lax'` instead of 'none' (better security)

---

## Environment Variables

### Production Environment Variables

Your deployed frontend will use these variables:

```env
# Required
VITE_API_BASE_URL=https://express-auth-rkti.onrender.com

# Optional
VITE_DEBUG=false
NODE_VERSION=18
```

### How Vite Handles Environment Variables

**Build Time Replacement:**

```typescript
// In your code
const apiUrl = import.meta.env.VITE_API_BASE_URL;

// After build (in dist/assets/*.js)
const apiUrl = 'https://express-auth-rkti.onrender.com';
```

**Important:**

- Variables are **embedded at build time**
- Changing variables requires a **rebuild**
- Only variables starting with `VITE_` are exposed
- Never put secrets in `VITE_` variables (they're visible in browser)

### Updating Environment Variables

**To change variables after deployment:**

1. Go to Render dashboard → Your static site
2. Click "Environment" tab
3. Update variable values
4. Click "Save Changes"
5. Trigger manual deploy (or push to trigger auto-deploy)

**Render will:**

- Rebuild your application
- Replace old environment variables
- Deploy new build
- Takes 2-5 minutes

---

## Backend Configuration Requirements

### Required Backend Environment Variables

Your backend needs these settings for the frontend to work:

```env
# Node environment
NODE_ENV=production

# Frontend configuration
FRONTEND_URL=https://express-auth-frontend.onrender.com
APP_BASE_URL=https://express-auth-rkti.onrender.com

# CORS settings
CORS_ORIGIN=https://express-auth-frontend.onrender.com
CORS_CREDENTIALS=true

# Cookie settings
COOKIE_DOMAIN=.onrender.com
COOKIE_SAME_SITE=none
COOKIE_SECURE=true

# JWT secrets (your existing ones)
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here

# Database
DATABASE_URL=your-database-url

# Email (your existing configuration)
EMAIL_PROVIDER=your-provider
EMAIL_FROM=your-email
# ... other email settings

# Two-factor authentication (optional)
TWO_FACTOR_REMEMBER_DAYS=30

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Backend CORS Middleware Configuration

Your backend should have CORS configured like this:

```typescript
// Backend CORS setup (for reference)
import cors from 'cors';

const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || [],
  credentials: true, // CRITICAL for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
```

### Backend Cookie Middleware Configuration

```typescript
// Backend cookie configuration (for reference)
import cookieParser from 'cookie-parser';

app.use(cookieParser());

// When setting cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  domain: process.env.COOKIE_DOMAIN,
};

res.cookie('accessToken', token, {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000, // 15 minutes
});

res.cookie('refreshToken', refreshToken, {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

---

## Post-Deployment Verification

### Comprehensive Testing Checklist

After deployment completes, test every feature:

#### 1. Basic Connectivity

Open your deployed frontend: `https://your-app.onrender.com`

**Check:**

- ✅ Page loads without errors
- ✅ No 404 errors in console
- ✅ No CORS errors in console
- ✅ UI renders correctly
- ✅ Dark/light theme toggle works

**Open Browser DevTools:**

- Press F12
- Go to Console tab
- Look for any red error messages

**Common Issues:**

- 404 on assets: Build configured incorrectly
- CORS errors: Backend CORS not configured
- Blank page: JavaScript error during initialization

#### 2. Registration Flow

**Test:**

1. Go to `/register` page
2. Fill out registration form:
   ```
   Email: test@example.com
   Password: TestPass123!
   Full Name: Test User
   ```
3. Submit form

**Expected:**

- ✅ Success toast appears
- ✅ "Confirmation email sent" message
- ✅ No console errors
- ✅ Redirects to login page after 2 seconds

**Check Backend:**

- Registration endpoint called: `POST /api/v1/auth/register`
- Returns 201 Created status
- Email sent (check logs if using console provider)

**If registration fails:**

- Check Network tab for failed requests
- Verify backend URL is correct
- Check backend is running and accessible

#### 3. Email Confirmation

**Note:** In development, backend logs confirmation links to console.

**Test:**

1. Get confirmation link from backend logs
2. Visit the link in your browser
3. Should redirect to frontend with success message

**Expected:**

- ✅ Email confirmed successfully
- ✅ User can now log in
- ✅ Database updated (`isEmailConfirmed = true`)

#### 4. Login Flow (Without 2FA)

**Test:**

1. Go to `/login` page
2. Enter credentials:
   ```
   Email: test@example.com
   Password: TestPass123!
   ```
3. Click "Login"

**Expected:**

- ✅ Login endpoint called: `POST /api/v1/auth/login`
- ✅ Success response received
- ✅ Cookies set in browser (check DevTools → Application → Cookies)
- ✅ User redirected to home page
- ✅ Navbar shows user name and logout button

**Verify Cookies (DevTools → Application → Cookies):**

You should see:

```
Name: accessToken
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Domain: .onrender.com
Path: /
Expires: (15 minutes from now)
HttpOnly: ✓
Secure: ✓
SameSite: None

Name: refreshToken
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Domain: .onrender.com
Path: /
Expires: (7 days from now)
HttpOnly: ✓
Secure: ✓
SameSite: None
```

**If cookies are NOT set:**

- ❌ Backend cookie configuration incorrect
- ❌ CORS credentials not enabled
- ❌ Cookie domain mismatch

**Solution:** Go back to [Critical Cookie Configuration](#critical-cookie-configuration)

#### 5. Authenticated Requests

After logging in, test protected endpoints:

**Test:**

1. Click "Profile" in navbar
2. Should show user profile information
3. Open Network tab
4. Refresh page

**Expected:**

- ✅ Request to `/api/v1/auth/sessions` or user endpoint
- ✅ Cookies sent automatically with request
- ✅ Response contains user data
- ✅ No 401 Unauthorized errors

**Verify in Network Tab:**

```
Request Headers:
Cookie: accessToken=eyJ...; refreshToken=eyJ...
```

**If 401 Unauthorized:**

- Cookies not being sent
- `withCredentials: true` missing in axios config
- Backend not accepting credentials

#### 6. Token Refresh Flow

**Test automatic token refresh:**

1. Stay logged in for 15+ minutes (access token expiration)
2. Make any authenticated request (click Profile, Messages, etc.)
3. Watch Network tab

**Expected:**

- ✅ First request gets 401 (access token expired)
- ✅ Axios interceptor triggers
- ✅ Refresh endpoint called: `POST /api/v1/auth/refresh`
- ✅ New tokens issued
- ✅ Original request retried and succeeds
- ✅ User stays logged in (no redirect to login)

**If refresh fails:**

- ❌ Interceptor not working
- ❌ Refresh token expired (> 7 days)
- ❌ Backend refresh endpoint issues

**Solution:** Check [`src/lib/api.ts`](src/lib/api.ts) interceptor configuration

#### 7. Logout Flow

**Test:**

1. Click "Logout" in navbar
2. Confirm logout if prompted

**Expected:**

- ✅ Logout endpoint called: `POST /api/v1/auth/logout`
- ✅ Cookies cleared from browser
- ✅ User redirected to login page
- ✅ Auth store cleared
- ✅ Cannot access protected routes

**Verify Cookies Cleared:**

- DevTools → Application → Cookies
- `accessToken` and `refreshToken` should be gone

#### 8. Password Reset Flow

**Test Three-Tier Flow:**

**TIER 1: Request Reset**

1. Go to `/forgot-password`
2. Enter email: `test@example.com`
3. Submit

**Expected:**

- ✅ Generic success message (prevents email enumeration)
- ✅ Email sent with reset link (check backend logs)

**TIER 2: Click Email Link**

1. Get reset link from backend logs
2. Format: `http://backend-url/reset-password?token=abc123`
3. Click link (or paste in browser)

**Expected:**

- ✅ Backend redirects to frontend
- ✅ URL: `https://your-app.onrender.com/reset-password?token=abc123`
- ✅ Frontend validates token
- ✅ Shows password reset form

**TIER 3: Submit New Password**

1. Enter new password: `NewPass123!`
2. Confirm password: `NewPass123!`
3. Submit

**Expected:**

- ✅ Password updated in database
- ✅ All sessions logged out
- ✅ Success message shown
- ✅ Redirect to login
- ✅ Can log in with new password

#### 9. Two-Factor Authentication (If Enabled)

**Test Login with 2FA:**

1. Enable 2FA in settings
2. Log out
3. Log in again

**Expected:**

- ✅ Login returns `twoFactorRequired: true`
- ✅ 2FA code sent to email
- ✅ Frontend shows code input form
- ✅ Enter 6-digit code
- ✅ Tokens issued after code verification
- ✅ User logged in successfully

**Test Remember Device:**

1. Check "Remember this device" during 2FA
2. Complete 2FA
3. Log out
4. Log in again

**Expected:**

- ✅ 2FA skipped (no code required)
- ✅ Direct login with credentials only
- ✅ `rememberedDeviceToken` cookie set

#### 10. Admin Features (If Admin User)

**Test User Management:**

1. Log in as admin
2. Go to `/users` page

**Expected:**

- ✅ List of all users shown
- ✅ Can change user roles
- ✅ Cannot change own role
- ✅ Changes reflect immediately

**Test Message Management:**

1. Go to `/messages` page
2. Create a new message
3. Edit existing message
4. Delete a message

**Expected:**

- ✅ All CRUD operations work
- ✅ No console errors
- ✅ Database updated correctly

#### 11. Error Handling

**Test Error Scenarios:**

**Invalid Credentials:**

1. Try to log in with wrong password
2. Expected: Error message "Invalid credentials"

**Email Not Confirmed:**

1. Register new user
2. Try to log in without confirming email
3. Expected: Error message "Please confirm your email"

**Expired Reset Token:**

1. Wait for reset token to expire (1 hour)
2. Try to use it
3. Expected: Error message "Token expired or invalid"

**Network Errors:**

1. Stop backend temporarily
2. Try to make request
3. Expected: Error toast "Unable to connect to server"

#### 12. Mobile Responsiveness

**Test on Different Screen Sizes:**

1. Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Test on:
   - Mobile: 375x667 (iPhone SE)
   - Tablet: 768x1024 (iPad)
   - Desktop: 1920x1080

**Verify:**

- ✅ Layout responsive
- ✅ Navigation works (hamburger menu on mobile)
- ✅ Forms usable
- ✅ Tables scrollable on small screens
- ✅ No horizontal overflow

#### 13. Performance Check

**Use Lighthouse Audit:**

1. Open DevTools
2. Go to Lighthouse tab
3. Run audit

**Target Scores:**

- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**Common Issues:**

- Large JavaScript bundles: Implement code splitting
- Unoptimized images: Use WebP format
- Missing meta tags: Add to `index.html`

---

## Troubleshooting Common Issues

### Issue 1: CORS Errors

**Symptoms:**

```
Access to XMLHttpRequest at 'https://backend.onrender.com/api/v1/auth/login'
from origin 'https://frontend.onrender.com' has been blocked by CORS policy:
The value of the 'Access-Control-Allow-Credentials' header in the response
is '' which must be 'true' when the request's credentials mode is 'include'.
```

**Root Cause:**

- Backend CORS not configured to allow credentials
- Frontend origin not whitelisted

**Solution:**

1. **Check Backend CORS Configuration:**

   ```env
   CORS_ORIGIN=https://your-frontend.onrender.com
   CORS_CREDENTIALS=true
   ```

2. **Verify CORS Middleware:**

   ```typescript
   // Backend
   app.use(
     cors({
       origin: process.env.CORS_ORIGIN,
       credentials: true, // MUST be true
     })
   );
   ```

3. **Verify Frontend Axios Config:**

   ```typescript
   // Frontend
   const api = axios.create({
     withCredentials: true, // MUST be true
   });
   ```

4. **Restart Backend Service:**

   - Environment changes require restart
   - Wait for "Live" status

5. **Clear Browser Cache:**
   - Ctrl+Shift+Delete
   - Clear "Cached images and files"
   - Close and reopen browser

**Test Fix:**

```javascript
// In browser console on frontend
fetch('https://your-backend.onrender.com/health', {
  credentials: 'include',
})
  .then((r) => r.text())
  .then((t) => console.log('Response:', t))
  .catch((e) => console.error('Error:', e));
```

Should return health response with no CORS errors.

---

### Issue 2: Cookies Not Being Set

**Symptoms:**

- Login succeeds (200 OK)
- No cookies appear in DevTools
- Subsequent requests get 401 Unauthorized

**Root Cause:**

- Cookie `sameSite` or `domain` misconfigured
- Cookies marked `secure` but using HTTP
- Browser blocking third-party cookies

**Solution:**

1. **Verify Backend Cookie Configuration:**

   ```env
   COOKIE_DOMAIN=.onrender.com
   COOKIE_SAME_SITE=none
   COOKIE_SECURE=true
   ```

2. **Check Response Headers in Network Tab:**

   ```
   Look for:
   Set-Cookie: accessToken=...; Domain=.onrender.com; Path=/; HttpOnly; Secure; SameSite=None
   Set-Cookie: refreshToken=...; Domain=.onrender.com; Path=/; HttpOnly; Secure; SameSite=None
   ```

   **If missing `SameSite=None`:**

   - Backend not setting it correctly
   - Update backend cookie options

3. **Check Browser Cookie Settings:**

   - Some browsers block third-party cookies by default
   - Chrome: Settings → Privacy → Cookies → "Allow all cookies"
   - Firefox: Settings → Privacy → Standard
   - Test in incognito mode

4. **Verify HTTPS:**

   - Cookies with `Secure` flag only work over HTTPS
   - Render provides HTTPS automatically
   - Never disable `secure` in production

5. **Check Domain Match:**

   ```javascript
   // In browser console
   console.log(window.location.hostname);
   // Should output: your-app.onrender.com

   // Cookie domain should be: .onrender.com (with leading dot)
   ```

**Test Fix:**

```javascript
// After login, check cookies
document.cookie;
// Should show some cookies (not httpOnly ones)

// Or check in DevTools → Application → Cookies → https://your-app.onrender.com
// Should see accessToken and refreshToken
```

---

### Issue 3: "Network Error" or "ERR_CONNECTION_REFUSED"

**Symptoms:**

- All API requests fail
- Console shows "Network Error"
- Backend URL unreachable

**Root Cause:**

- Wrong backend URL in environment variables
- Backend service down
- Typo in `VITE_API_BASE_URL`

**Solution:**

1. **Verify Backend URL:**

   ```bash
   # Test backend directly
   curl https://express-auth-rkti.onrender.com/health

   # Should return:
   # {"success":true,"message":"Server is running",...}
   ```

2. **Check Render Dashboard:**

   - Go to backend service
   - Verify status is "Live" (green)
   - Check for recent crashes in logs

3. **Verify Frontend Environment Variable:**

   ```javascript
   // In browser console on deployed frontend
   console.log(import.meta.env.VITE_API_BASE_URL);
   // Should output: https://express-auth-rkti.onrender.com
   ```

   **If shows `undefined` or wrong URL:**

   - Environment variable not set correctly
   - Go to Render dashboard → Static Site → Environment
   - Update `VITE_API_BASE_URL`
   - Manual deploy required (variables are build-time)

4. **Check for Typos:**

   ```
   ❌ Wrong: https://express-auth-rkti.onrender.com/
   ✅ Right: https://express-auth-rkti.onrender.com

   # No trailing slash!
   ```

5. **Verify in Built Files:**
   ```bash
   # Download and check dist files
   # In dist/assets/*.js, search for:
   baseURL:"https://express-auth-rkti.onrender.com"
   ```

---

### Issue 4: 401 Unauthorized After Login

**Symptoms:**

- Login succeeds
- Cookies are set
- First authenticated request works
- Subsequent requests fail with 401

**Root Cause:**

- Access token expired (> 15 minutes)
- Token refresh interceptor not working
- Refresh token expired (> 7 days)

**Solution:**

1. **Check Token Expiration:**

   ```javascript
   // In DevTools → Application → Cookies
   // Check accessToken expiration
   // Should be ~15 minutes from login
   ```

2. **Test Refresh Manually:**

   ```javascript
   // In browser console
   fetch('https://your-backend.onrender.com/api/v1/auth/refresh', {
     method: 'POST',
     credentials: 'include',
   })
     .then((r) => r.json())
     .then((d) => console.log('Refresh response:', d))
     .catch((e) => console.error('Refresh failed:', e));
   ```

   **Should:**

   - Return 200 OK
   - Include new user data
   - Set new cookies

3. **Verify Interceptor Configuration:**

   Check [`src/lib/api.ts`](src/lib/api.ts):

   ```typescript
   api.interceptors.response.use(
     (response) => response,
     async (error) => {
       // Should check for 401
       // Should call /api/v1/auth/refresh
       // Should retry original request
     }
   );
   ```

4. **Check Network Tab During 401:**

   - Original request: 401
   - Refresh request: 200
   - Retry original: 200

   **If refresh request missing:**

   - Interceptor not triggering
   - Check error.response.status === 401
   - Check PUBLIC_ENDPOINTS array

5. **Check Refresh Token Validity:**
   - Refresh tokens last 7 days
   - After 7 days, user must log in again
   - This is expected behavior

---

### Issue 5: Build Fails on Render

**Symptoms:**

- Build logs show errors
- Deployment fails
- Site not updated

**Common Build Errors:**

**Error: TypeScript Compilation Failed**

```
error TS2322: Type 'string' is not assignable to type 'number'
```

**Solution:**

```bash
# Fix locally first
npm run type-check

# Fix all TypeScript errors
# Commit and push
git add .
git commit -m "fix: resolve TypeScript errors"
git push
```

**Error: ESLint Errors**

```
error: 'React' must be in scope when using JSX
```

**Solution:**

```bash
# Run lint locally
npm run lint

# Fix errors or update eslint config
# Commit and push
```

**Error: Missing Dependencies**

```
Module not found: Can't resolve '@/components/ui/button'
```

**Solution:**

```bash
# Install missing dependency
npm install

# Verify package.json updated
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push
```

**Error: Out of Memory**

```
FATAL ERROR: Reached heap limit
```

**Solution:**

1. Upgrade to paid Render plan (more memory)
2. Or optimize build:
   ```json
   // package.json
   {
     "scripts": {
       "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
     }
   }
   ```

**Error: Build Timeout**

```
Build exceeded 15 minute limit
```

**Solution:**

- Free tier has 15-minute build limit
- Optimize build (remove large dependencies)
- Upgrade to paid plan (no time limit)

---

### Issue 6: 404 Errors on Page Refresh

**Symptoms:**

- Direct navigation to `/login` from browser works initially
- Refresh browser on any route (e.g., `/profile`, `/messages`) → 404 error
- Sharing direct links to routes → 404 error
- Router works for internal navigation but not for direct URL access

**Root Cause:**

- Static hosting server trying to find physical files at each route path
- Server looks for `/profile/index.html` which doesn't exist
- React Router handles routing client-side, but server doesn't know this

**Solution:**

Configure SPA routing support in Render Dashboard (see [Step 5: Configure SPA Routing Support](#step-5-configure-spa-routing-support) for detailed instructions).

**Quick Fix:**

1. **Go to Render Dashboard** → Your static site
2. **Click "Redirects/Rewrites"** in the left sidebar
3. **Click "Add Rule"**
4. **Configure:**
   ```
   Type: Rewrite
   Source: /*
   Destination: /index.html
   ```
5. **Click "Save"**
6. **Test immediately** - No rebuild required

**Verify Fix:**

```bash
# Test direct route access
curl -I https://your-app.onrender.com/login

# Expected response:
# HTTP/2 200
# content-type: text/html
```

**In Browser:**

1. Navigate to `https://your-app.onrender.com/login` directly
2. Refresh the page
3. Should show login page, not 404 ✅

**What This Does:**

- Catches all route requests (`/*`)
- Serves `index.html` for every route
- Returns 200 status code (not 404)
- React Router takes over and displays the correct component

**Important Notes:**

- ⚠️ Changes to Redirects/Rewrites take effect **immediately**
- ⚠️ No code changes or rebuilds required
- ⚠️ If you still see 404s, clear browser cache (Ctrl+Shift+Delete)
- ✅ This is Render's official recommended approach for SPAs
- ✅ Works with all client-side routing libraries

**Alternative Check - Headers:**

While configuring redirects, also verify security headers are set (optional but recommended):

1. **Click "Headers"** in the left sidebar
2. **Verify these headers exist:**

   ```
   Path: /*
   Name: X-Frame-Options
   Value: DENY

   Path: /*
   Name: X-Content-Type-Options
   Value: nosniff
   ```

If missing, add them for better security.

**Why Previous Approaches Don't Work:**

- ❌ `_redirects` file: Works on some platforms (Netlify) but not reliably on Render static sites
- ❌ `render.yaml`: Only applies when creating service via "Blueprint", not regular static sites
- ❌ Custom 404 page: Hacky workaround with poor SEO and user experience
- ✅ **Dashboard Redirects/Rewrites**: Official Render solution, works immediately

**Debugging Steps if Still Not Working:**

1. **Clear Browser Cache:**

   ```
   Ctrl+Shift+Delete → Clear "Cached images and files"
   Close and reopen browser
   ```

2. **Check Redirect Rule Syntax:**

   ```
   Source: /*          (must include asterisk)
   Destination: /index.html   (must start with /)
   Type: Rewrite       (not Redirect)
   ```

3. **Verify in Network Tab:**

   - Navigate to failing route
   - Open DevTools → Network tab
   - Refresh page
   - Look at request for the route
   - Should return `index.html` content with 200 status

4. **Test in Incognito Mode:**

   - Rules out caching issues
   - Should work immediately

5. **Check Render Service Logs:**
   - Dashboard → Your static site → Logs
   - Look for 404 errors
   - Should see 200 responses after fix

**Expected Behavior After Fix:**

| Action                        | Before Fix       | After Fix              |
| ----------------------------- | ---------------- | ---------------------- |
| Navigate to `/login` directly | ❌ 404 Not Found | ✅ Shows login page    |
| Refresh on `/profile`         | ❌ 404 Not Found | ✅ Shows profile page  |
| Share link to `/messages`     | ❌ 404 Not Found | ✅ Shows messages page |
| Back button navigation        | ✅ Works         | ✅ Works               |
| Internal routing              | ✅ Works         | ✅ Works               |

**SEO Consideration:**

Using a rewrite (200 status) instead of redirect (301/302) is correct for SPAs:

- ✅ Search engines index the page normally
- ✅ No redirect chain penalty
- ✅ Proper status codes for each route
- ✅ React Router handles meta tags per route

---

## Security Considerations

### 1. Environment Variables

**✅ DO:**

- Use `VITE_API_BASE_URL` for backend URL
- Keep non-sensitive configs in frontend env vars

**❌ DON'T:**

- Put API keys in `VITE_` variables (visible in browser)
- Put JWT secrets in frontend
- Put database credentials in frontend

**Example of What's Safe:**

```env
# Safe - Public configuration
VITE_API_BASE_URL=https://api.example.com
VITE_APP_NAME=My App
VITE_VERSION=1.0.0

# NEVER DO THIS - These will be visible in JavaScript!
# VITE_JWT_SECRET=xxx ❌
# VITE_DATABASE_URL=xxx ❌
# VITE_API_KEY=xxx ❌
```

### 2. Cookie Security

**Verify Cookie Attributes:**

All authentication cookies MUST have:

- ✅ `HttpOnly: true` - Prevents JavaScript access
- ✅ `Secure: true` - HTTPS only
- ✅ `SameSite: none` - Cross-origin allowed (or `lax` for same domain)
- ✅ `Domain: .onrender.com` - Shared across subdomains

**Never:**

- ❌ Store tokens in localStorage
- ❌ Store tokens in sessionStorage
- ❌ Access tokens via JavaScript
- ❌ Send tokens in URL parameters

### 3. HTTPS Enforcement

**Render provides HTTPS automatically**, but verify:

1. **Force HTTPS Redirect:**

   - Render does this automatically
   - All HTTP requests redirect to HTTPS

2. **Check Certificate:**

   - Click padlock in browser address bar
   - Certificate should be valid
   - Issued by Let's Encrypt

3. **HSTS Headers:**
   ```
   # Add to public/_headers
   /*
     Strict-Transport-Security: max-age=31536000; includeSubDomains
   ```

### 4. Content Security Policy

Add to `public/_headers`:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://express-auth-rkti.onrender.com; frame-ancestors 'none';
```

**Explanation:**

- `default-src 'self'` - Only load resources from same origin
- `connect-src` - Allow API calls to backend
- `frame-ancestors 'none'` - Prevent clickjacking
- `'unsafe-inline'` - Required for Vite's development mode

### 5. Rate Limiting

**Backend handles rate limiting**, but monitor:

1. **Check Backend Configuration:**

   ```env
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

2. **Handle 429 Responses:**
   ```typescript
   // src/lib/api.ts
   api.interceptors.response.use(
     (response) => response,
     (error) => {
       if (error.response?.status === 429) {
         const retryAfter = error.response.data?.error?.details?.retryAfterSeconds;
         toast.error(`Too many requests. Retry after ${retryAfter} seconds.`);
       }
       return Promise.reject(error);
     }
   );
   ```

### 6. XSS Protection

**Built-in Protection:**

- React escapes all user input by default
- Don't use `dangerouslySetInnerHTML` unless necessary

**If you must render HTML:**

```typescript
import DOMPurify from 'dompurify';

// Sanitize before rendering
const cleanHTML = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
```

### 7. Dependency Security

**Regularly Update Dependencies:**

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

**Automate with:**

- Dependabot (GitHub feature)
- Renovate Bot
- Snyk

### 8. CORS Restrictions

**Production CORS should be strict:**

```env
# Backend .env
# ❌ DON'T: Allow all origins
CORS_ORIGIN=*

# ✅ DO: Specific origins only
CORS_ORIGIN=https://your-app.onrender.com

# ✅ DO: Multiple specific origins
CORS_ORIGIN=https://app.yourdomain.com,https://staging.yourdomain.com
```

### 9. Error Messages

**Don't expose sensitive information:**

```typescript
// ❌ DON'T: Show detailed errors to users
catch (error) {
  toast.error(error.stack); // Exposes internals
}

// ✅ DO: Show generic user-friendly messages
catch (error) {
  const userMessage = error.response?.data?.error?.message || 'An error occurred';
  toast.error(userMessage);
  // Log full error to monitoring service
  console.error('Detailed error:', error);
}
```

### 10. Monitoring & Logging

**Set up monitoring:**

1. **Frontend Error Tracking:**

   - Sentry
   - LogRocket
   - Rollbar

2. **Backend Logging:**

   - Render native logs
   - Papertrail
   - Logtail

3. **Uptime Monitoring:**
   - UptimeRobot
   - Pingdom
   - Better Uptime

**Implementation:**

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

---

## Monitoring and Maintenance

### Daily Checks

**Use Render Dashboard:**

1. **Check Service Status:**

   - Frontend: Should show "Live" (green)
   - Backend: Should show "Live" (green)

2. **Monitor Logs:**

   - Click service → Logs tab
   - Look for errors or warnings
   - Check for unusual activity

3. **Check Uptime:**
   - Render shows last 24 hours uptime
   - Should be 100% or very close

### Weekly Tasks

1. **Review Error Logs:**

   - Look for recurring errors
   - Identify patterns
   - Fix root causes

2. **Check Response Times:**

   - Monitor API response times
   - Slow endpoints need optimization
   - Consider caching strategies

3. **Update Dependencies:**

   ```bash
   npm outdated
   npm update
   npm audit fix
   ```

4. **Review Analytics:**
   - User login patterns
   - Failed authentication attempts
   - Most used features

### Monthly Tasks

1. **Security Audit:**

   ```bash
   npm audit
   npm audit fix
   ```

2. **Performance Review:**

   - Run Lighthouse audit
   - Check bundle sizes
   - Optimize as needed

3. **Database Maintenance:**

   - Clean up expired tokens
   - Remove old sessions
   - Optimize queries

4. **Backup Verification:**
   - Test database backups
   - Verify restore process
   - Update backup strategy

### Setting Up Alerts

**Render Notifications:**

1. Go to Render Dashboard
2. Click on service
3. Settings → Notifications
4. Add email or Slack webhook
5. Enable alerts for:
   - Deploy failures
   - Service down
   - High error rates

**External Monitoring:**

**UptimeRobot Setup:**

1. Sign up at uptimerobot.com
2. Add new monitor:
   ```
   Type: HTTPS
   URL: https://your-app.onrender.com
   Interval: 5 minutes
   ```
3. Add alert contacts
4. Get notified of downtime

**Custom Health Check Endpoint:**

```typescript
// Backend: Add comprehensive health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: await checkDatabaseConnection(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  };
  res.json(health);
});
```

### Scaling Considerations

**When to Upgrade:**

1. **Consistent High Traffic:**

   - Free tier: 100GB bandwidth/month
   - Paid tier: Unlimited bandwidth

2. **Long Build Times:**

   - Free tier: Slower build machines
   - Paid tier: Faster builds

3. **Need for Always-On:**

   - Free tier: Services sleep after 15 minutes
   - Paid tier: Always on

4. **Custom Domains:**
   - Free tier: \*.onrender.com subdomain
   - Paid tier: Custom domains included

**Render Pricing (as of 2024):**

- Free: $0/month (good for testing)
- Starter: $7/month (personal projects)
- Standard: $25/month (small businesses)
- Pro: Custom pricing (enterprises)

---

## Conclusion

You now have a **comprehensive guide** for deploying your Express Auth Frontend to Render with **dual JWT cookie authentication**.

### Key Takeaways

1. **Cookie Configuration is Critical:**

   - `domain: .onrender.com`
   - `sameSite: none`
   - `secure: true`

2. **CORS Must Allow Credentials:**

   - `credentials: true` on frontend
   - `Access-Control-Allow-Credentials: true` on backend

3. **Environment Variables are Build-Time:**

   - Must start with `VITE_`
   - Require rebuild to update

4. **HTTPS is Required:**

   - Render provides automatically
   - Cookies won't work without it

5. **Test Thoroughly:**
   - Every authentication flow
   - Token refresh mechanism
   - Error scenarios

### Next Steps

1. ✅ Deploy frontend following this guide
2. ✅ Verify all authentication flows work
3. ✅ Set up monitoring and alerts
4. ✅ Plan for custom domain (recommended)
5. ✅ Consider upgrading to paid tier for production

### Support Resources

- **Render Documentation:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Your Backend API Docs:** `https://express-auth-rkti.onrender.com/docs`
- **OpenAPI Spec:** [`docs/openapi.yaml`](openapi.yaml)

### Deployment Success Checklist

Before considering deployment complete, verify:

- [ ] Frontend accessible at public URL
- [ ] No CORS errors in console
- [ ] Cookies set correctly after login
- [ ] All protected routes require authentication
- [ ] Token refresh works automatically
- [ ] Logout clears cookies and redirects
- [ ] Password reset flow works end-to-end
- [ ] 2FA works (if enabled)
- [ ] Admin features work (if admin user)
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance acceptable (Lighthouse > 90)
- [ ] Monitoring and alerts configured

**When all checkboxes are complete: 🎉 Your app is production-ready!**

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Maintained By:** Your Team

For questions or issues, refer to the troubleshooting section or contact your backend team.

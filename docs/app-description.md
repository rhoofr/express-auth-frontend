# Express Auth TypeScript — Frontend Developer Integration Guide

## What is this?

A secure, production-ready authentication and authorization REST API built with Node.js, Express 5, TypeScript, and Knex. Supports JWT-based sessions, password hashing, two-factor authentication (2FA), and centralized message management.

---

## Core Concepts

- **Authentication:** Dual JWT tokens (access + refresh) set as httpOnly cookies
- **Session Management:** Access token (short-lived, 15 minutes), refresh token (long-lived, 7 days), automatic rotation/revocation
- **2FA:** Optional email-based verification codes
- **User Roles:** `user` and `admin` (admin can manage messages)
- **Centralized Messages:** All user-facing and operational messages managed via message service
- **Cookie-Based Auth:** httpOnly cookies prevent XSS attacks, tokens never exposed to JavaScript

---

## Token Expiration & Refresh Strategy

### Token Lifetimes

- **Access Token:** 15 minutes

  - Used for authenticating API requests
  - Short-lived for security
  - Set as httpOnly cookie named `accessToken`

- **Refresh Token:** 7 days
  - Used to obtain new access tokens
  - Long-lived for user convenience
  - Set as httpOnly cookie named `refreshToken`
  - Stored hashed in database for revocation

### How Token Refresh Works

1. User makes authenticated request with expired access token
2. Server returns 401 with message: `"Access token has expired. Please refresh your session."`
3. Frontend automatically calls `/api/v1/auth/refresh` endpoint
4. Server validates refresh token and issues **new** access + refresh tokens (token rotation)
5. Old refresh token marked as "replaced" in database (prevents reuse)
6. Frontend retries original request with new access token

**Key Point:** Frontend never directly handles tokens. All token management happens via httpOnly cookies sent automatically by the browser.

---

## Authentication Flow

### 1. Registration & Email Confirmation

#### Register New User

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "fullName": "John Doe"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Registration successful. Please check your email to confirm your account.",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "requestId": "req-abc123"
}
```

**What Happens:**

- Password hashed using bcrypt (12 rounds)
- Email confirmation token generated and stored in database
- Confirmation email sent to user
- User account created with `isEmailConfirmed: false`

**Common Errors:**

- 409 Conflict: Email already registered
- 400 Bad Request: Invalid email format or weak password

#### Confirm Email Address

**Endpoint:** `GET /api/v1/auth/confirm-email?token={token}`

**Query Parameters:**

- `token`: Email confirmation token from email link (32+ hex characters)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Email confirmed successfully. You can now log in.",
  "requestId": "req-def456"
}
```

**What Happens:**

- Token validated against database
- User's `isEmailConfirmed` set to `true`
- Token marked as used (single-use only)

**Common Errors:**

- 404 Not Found: Token not found in database
- 410 Gone: Token expired or already used

#### Resend Confirmation Email

**Endpoint:** `POST /api/v1/auth/resend-confirmation`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Confirmation email sent. Please check your inbox.",
  "requestId": "req-ghi789"
}
```

**What Happens:**

- New confirmation token generated
- Previous unused tokens for this user invalidated
- New confirmation email sent

**Common Errors:**

- 404 Not Found: User not found
- 409 Conflict: Email already confirmed

---

### 2. Login (Without 2FA)

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "rememberDevice": true // Optional: remember this device for 30 days
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user",
    "isEmailConfirmed": true,
    "twoFactorEnabled": false
  },
  "requestId": "req-jkl012"
}
```

**Cookies Set:**

- `accessToken`: httpOnly, secure (production), sameSite=strict, maxAge=15m
- `refreshToken`: httpOnly, secure (production), sameSite=strict, maxAge=7d
- `rememberedDeviceToken`: **(Optional)** Only set if `rememberDevice: true`. httpOnly, secure (production), sameSite=strict, maxAge=30d

**Remember Device Feature:**

When `rememberDevice: true` is included in the login request:

1. **Backend creates remembered device record** with:

   - Secure random cookie token (32 bytes, SHA-256 hashed)
   - Device identifier (user-agent hash, SHA-256)
   - Expiration: 30 days (configurable via `TWO_FACTOR_REMEMBER_DAYS` env var)

2. **Backend sets `rememberedDeviceToken` cookie** (httpOnly, 30 days)

3. **Future logins from same browser/device:**
   - System checks for valid `rememberedDeviceToken` cookie
   - If device is remembered and 2FA is enabled: **2FA is skipped**
   - User logs in directly with email/password only

**Frontend Implementation Example:**

```typescript
// Login form with remember device checkbox
const [rememberDevice, setRememberDevice] = useState(false);

async function handleLogin(email: string, password: string) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      rememberDevice  // Send checkbox state to backend
    })
  });

  const data = await response.json();

  if (data.success) {
    // Login successful - redirect to dashboard
    redirectToDashboard();
  }
}

// In JSX:
<input
  type="checkbox"
  checked={rememberDevice}
  onChange={(e) => setRememberDevice(e.target.checked)}
/>
<label>Remember this device for 30 days</label>
```

**What Happens:**

- Email and password validated
- Password compared using bcrypt
- Access token (15m) and refresh token (7d) generated
- Refresh token hash stored in database
- User's `lastLogin` timestamp updated
- Failed login attempts reset to 0
- **If `rememberDevice: true`:** Remembered device record created and cookie set

**Common Errors:**

- 401 Unauthorized: Invalid credentials
- 403 Forbidden: Account locked (too many failed attempts)
- 403 Forbidden: Email not confirmed

---

### 3. Login with 2FA (Two-Factor Authentication)

When a user has 2FA enabled, login is a two-step process.

#### Step 1: Initial Login

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "rememberDevice": true // Optional: will be used after 2FA confirmation
}
```

**Note:** If `rememberDevice: true` is sent during initial login BUT 2FA is required, the remember device setting is **ignored at this step**. You must send `rememberDevice: true` in the **confirm-2fa** request (Step 2) to remember the device after successful 2FA verification.

**2FA Required Response (200):**

```json
{
  "success": true,
  "message": "Two-factor authentication required. Please check your email for the verification code.",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "twoFactorRequired": true
  },
  "requestId": "req-2fa001"
}
```

**What Happens:**

- Email and password validated
- 6-digit verification code generated (valid for 10 minutes)
- Code stored hashed in database
- Verification email sent to user
- **No tokens issued yet** (requires code verification first)
- **No remembered device cookie set** (wait for Step 2)

**Frontend Action:**

- Display 2FA code input form
- Store `userId` temporarily (needed for next step)
- Wait for user to enter code from email
- **Preserve `rememberDevice` state** to send in next request

#### Step 2: Verify 2FA Code

**Endpoint:** `POST /api/v1/auth/confirm-2fa`

**Request Body:**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "code": "123456",
  "rememberDevice": true // Optional: remember this device for 30 days
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Two-factor authentication successful",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user",
    "isEmailConfirmed": true,
    "twoFactorEnabled": true
  },
  "requestId": "req-2fa002"
}
```

**Cookies Set:**

- `accessToken`: httpOnly, secure (production), sameSite=strict, maxAge=15m
- `refreshToken`: httpOnly, secure (production), sameSite=strict, maxAge=7d
- `rememberedDeviceToken`: **(Optional)** Only set if `rememberDevice: true`. httpOnly, secure (production), sameSite=strict, maxAge=30d

**Remember Device Feature (After 2FA):**

When `rememberDevice: true` is included in the confirm-2fa request:

1. **Backend creates remembered device record** (same as standard login)
2. **Backend sets `rememberedDeviceToken` cookie** (httpOnly, 30 days)
3. **Future logins from same browser/device:**
   - System checks for valid `rememberedDeviceToken` cookie **before** sending 2FA email
   - If device is remembered: **2FA is skipped entirely**
   - User logs in directly with email/password only (no OTP required)

**Frontend Implementation Example:**

```typescript
// 2FA verification form with remember device checkbox
const [rememberDevice, setRememberDevice] = useState(false);

async function handleVerify2FA(userId: string, code: string) {
  const response = await fetch('/api/v1/auth/confirm-2fa', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      code,
      rememberDevice  // Send checkbox state to backend
    })
  });

  const data = await response.json();

  if (data.success) {
    // 2FA verified, tokens issued, redirect to dashboard
    redirectToDashboard();
  }
}

// In JSX:
<input
  type="checkbox"
  checked={rememberDevice}
  onChange={(e) => setRememberDevice(e.target.checked)}
/>
<label>Don't ask for codes on this device for 30 days</label>
```

**What Happens:**

- Code validated against database (hashed comparison)
- Code marked as used (single-use only)
- Access token (15m) and refresh token (7d) generated
- Refresh token hash stored in database
- User's `lastLogin` timestamp updated
- **If `rememberDevice: true`:** Remembered device record created and cookie set
- User redirected to application

**Common Errors:**

- 401 Unauthorized: Invalid or expired code
- 404 Not Found: User not found
- 410 Gone: Code already used

---

### 4. Making Authenticated Requests

All protected endpoints require the `accessToken` cookie to be sent with the request.

**Example Request:**

```javascript
// Axios
const response = await axios.get('/api/v1/auth/sessions', {
  withCredentials: true, // Send cookies
});

// Fetch
const response = await fetch('http://localhost:5004/api/v1/auth/sessions', {
  credentials: 'include', // Send cookies
});
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Sessions retrieved successfully",
  "data": [
    {
      "tokenId": "session-uuid-1",
      "createdAt": "2024-01-20T14:22:00.000Z",
      "expiresAt": "2024-01-27T14:22:00.000Z",
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.100"
    },
    {
      "tokenId": "session-uuid-2",
      "createdAt": "2024-01-19T10:15:00.000Z",
      "expiresAt": "2024-01-26T10:15:00.000Z",
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.101"
    }
  ],
  "count": 2,
  "requestId": "req-sessions001"
}
```

**What Happens:**

- Server reads `accessToken` from cookie
- JWT signature verified using `JWT_ACCESS_SECRET`
- Token expiration checked (automatic with jwt.verify)
- User payload extracted from token
- Request proceeds with authenticated user context

---

### 5. Token Refresh (Automatic)

When access token expires (after 15 minutes), the next authenticated request returns 401.

**401 Response (Expired Access Token):**

```json
{
  "success": false,
  "error": {
    "message": "Access token has expired. Please refresh your session.",
    "code": "AUTHENTICATION_ERROR",
    "statusCode": 401,
    "requestId": "req-expired001"
  }
}
```

**Frontend must detect this error and call refresh endpoint.**

#### Refresh Token Endpoint

**Endpoint:** `POST /api/v1/auth/refresh`

**Request:** No body required, uses `refreshToken` cookie

```javascript
// Axios
const response = await axios.post(
  '/api/v1/auth/refresh',
  {},
  {
    withCredentials: true,
  }
);

// Fetch
const response = await fetch('http://localhost:5004/api/v1/auth/refresh', {
  method: 'POST',
  credentials: 'include',
});
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user",
    "isEmailConfirmed": true,
    "twoFactorEnabled": false
  },
  "requestId": "req-refresh001"
}
```

**New Cookies Set:**

- `accessToken`: New access token (15m expiration)
- `refreshToken`: New refresh token (7d expiration)

**What Happens (Token Rotation for Security):**

1. Server verifies `refreshToken` JWT signature using `JWT_REFRESH_SECRET`
2. Token hash looked up in database
3. Token validated (not expired, not revoked, not already replaced)
4. User fetched from database
5. **New** access token generated (15m expiration)
6. **New** refresh token generated (7d expiration)
7. New refresh token hash stored in database
8. **Old refresh token marked as "replaced"** in database (prevents reuse)
9. New tokens set in cookies
10. Old refresh token can no longer be used (security: token rotation)

**After refresh succeeds, retry the original request.**

**Refresh Failed Response (401):**

```json
{
  "success": false,
  "error": {
    "message": "Refresh token has expired",
    "code": "AUTHENTICATION_ERROR",
    "statusCode": 401,
    "requestId": "req-refresh-err001"
  }
}
```

**Action:** Redirect user to login page (both tokens expired).

---

### 6. Automatic Token Refresh Implementation

Frontend should implement automatic token refresh using an interceptor pattern.

#### Axios Interceptor Pattern (Recommended)

```typescript
// src/api/axios-instance.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5004',
  withCredentials: true, // Send cookies with every request
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Subscribe pending requests to refresh completion
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Notify all subscribers when refresh completes
function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb('refreshed'));
  refreshSubscribers = [];
}

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorMessage = error.response?.data?.error?.message || '';

      // Check if it's an expired access token
      if (errorMessage.includes('expired') || errorMessage.includes('refresh your session')) {
        // Prevent multiple simultaneous refresh calls
        if (isRefreshing) {
          // Another request is already refreshing, wait for it
          return new Promise((resolve) => {
            subscribeTokenRefresh(() => {
              resolve(api(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Call refresh endpoint
          await api.post('/api/v1/auth/refresh');

          // Refresh succeeded, notify all waiting requests
          isRefreshing = false;
          onRefreshed();

          // Retry original request with new tokens
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token also expired/invalid
          isRefreshing = false;
          refreshSubscribers = [];

          // Redirect to login page
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

**Usage:**

```typescript
// Simply use the api instance - refresh happens automatically
import api from './api/axios-instance';

async function fetchUserSessions() {
  try {
    const response = await api.get('/api/v1/auth/sessions');
    console.log(response.data);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
  }
}
```

#### Fetch API Pattern (Alternative)

```typescript
// src/api/fetch-wrapper.ts

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const config: RequestInit = {
    ...options,
    credentials: 'include', // Always send cookies
  };

  let response = await fetch(url, config);

  // If 401 and expired access token, try refresh
  if (response.status === 401) {
    const errorData = await response.json();
    const errorMessage = errorData.error?.message || '';

    if (errorMessage.includes('expired') || errorMessage.includes('refresh')) {
      try {
        // Try to refresh tokens
        const refreshResponse = await fetch('http://localhost:5004/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          // Retry original request with new tokens
          response = await fetch(url, config);
        } else {
          // Refresh failed, redirect to login
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      } catch (refreshError) {
        window.location.href = '/login';
        throw refreshError;
      }
    }
  }

  return response;
}

export { fetchWithAuth };
```

**Usage:**

```typescript
import { fetchWithAuth } from './api/fetch-wrapper';

async function fetchUserSessions() {
  try {
    const response = await fetchWithAuth('http://localhost:5004/api/v1/auth/sessions');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
  }
}
```

---

### 7. Session Management

#### List All Sessions

**Endpoint:** `GET /api/v1/auth/sessions`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Sessions retrieved successfully",
  "data": [
    {
      "tokenId": "session-uuid-1",
      "createdAt": "2024-01-20T14:22:00.000Z",
      "expiresAt": "2024-01-27T14:22:00.000Z",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "ipAddress": "192.168.1.100"
    }
  ],
  "count": 1,
  "requestId": "req-sessions002"
}
```

**What Happens:**

- Current user's ID extracted from access token
- All active refresh tokens for user fetched from database
- Current session identified by matching refresh token
- Session list returned with device/location info

#### Logout Current Session

**Endpoint:** `POST /api/v1/auth/logout`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logout successful",
  "requestId": "req-logout001"
}
```

**What Happens:**

- Current refresh token extracted from cookie
- Token marked as revoked in database
- Both `accessToken` and `refreshToken` cookies cleared
- User redirected to login page

**Frontend Action:**

```typescript
async function logout() {
  await api.post('/api/v1/auth/logout');
  // Clear any stored user data
  localStorage.removeItem('user');
  // Redirect to login
  window.location.href = '/login';
}
```

#### Logout All Sessions

**Endpoint:** `POST /api/v1/auth/logout-all`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "All sessions have been logged out successfully",
  "requestId": "req-logout-all001"
}
```

**What Happens:**

- All refresh tokens for current user marked as revoked in database
- Current session cookies cleared
- User logged out from all devices
- Other devices will get 401 on next request

**Frontend Action:**

```typescript
async function logoutAllDevices() {
  await api.post('/api/v1/auth/logout-all');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
```

---

### 8. Password Management (Three-Tier Reset Flow)

#### Three-Tier Architecture

**TIER 1:** User requests reset → Email sent with link to backend GET endpoint  
**TIER 2:** User clicks email link → Backend redirects to frontend with token  
**TIER 3:** User submits new password → Frontend POSTs to API

---

#### Request Password Reset (TIER 1)

**Endpoint:** `POST /api/v1/auth/request-password-reset`

**Request:** `{ "email": "user@example.com" }`

**Response (200):** Always returns success (prevents email enumeration)

```json
{
  "success": true,
  "message": "If that email address is registered, you will receive password reset instructions.",
  "requestId": "req-pwd-reset001"
}
```

#### Validate Reset Token (TIER 2)

**Endpoint:** `GET /api/v1/auth/validate-reset-token?token={token}`

**Query Parameters:**

- `token`: Password reset token from email link

**Success Response (200):**

```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "email": "user@example.com"
  },
  "requestId": "req-validate-token001"
}
```

**What Happens:**

- Token looked up in database
- Token expiration checked (1 hour validity)
- Token usage status checked (single-use only)
- User email returned if valid

**Common Errors:**

- 404 Not Found: Token not found
- 410 Gone: Token expired or already used

#### Reset Password (TIER 3)

**Endpoint:** `POST /api/v1/auth/reset-password`

**Request Body:**

```json
{
  "token": "abc123def456...",
  "newPassword": "NewPassword123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in with your new password.",
  "requestId": "req-pwd-reset002"
}
```

**What Happens:**

- Token validated (same checks as validate endpoint)
- New password hashed using bcrypt (12 rounds)
- User's password updated in database
- Token marked as used (single-use)
- All user sessions revoked (forces re-login)
- Failed login attempts reset to 0

**Common Errors:**

- 404 Not Found: Token not found
- 410 Gone: Token expired or already used
- 400 Bad Request: Weak password

#### Change Password (Authenticated)

**Endpoint:** `POST /api/v1/auth/change-password`

**Authentication:** Required

**Request Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully",
  "requestId": "req-pwd-change001"
}
```

**What Happens:**

- User ID extracted from access token
- Current password verified against database
- New password hashed using bcrypt (12 rounds)
- User's password updated in database
- Failed login attempts reset to 0
- Current session remains active (user not logged out)

**Common Errors:**

- 401 Unauthorized: Current password incorrect
- 400 Bad Request: New password same as old password or weak password

**Error Example:**

```json
{
  "success": false,
  "error": {
    "message": "Current password is incorrect",
    "code": "INVALID_CREDENTIALS",
    "statusCode": 401,
    "requestId": "req-pwd-change-err001"
  }
}
```

---

### 9. Two-Factor Authentication Management

#### Enable 2FA

**Endpoint:** `POST /api/v1/auth/2fa/enable`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Two-factor authentication has been enabled successfully",
  "requestId": "req-2fa-enable001"
}
```

**What Happens:**

- User ID extracted from access token
- User's `twoFactorEnabled` flag set to `true` in database
- Next login will require 2FA verification

#### Disable 2FA

**Endpoint:** `POST /api/v1/auth/2fa/disable`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Two-factor authentication has been disabled successfully",
  "requestId": "req-2fa-disable001"
}
```

**What Happens:**

- User ID extracted from access token
- User's `twoFactorEnabled` flag set to `false` in database
- Future logins will not require 2FA verification

---

## Messages Endpoints

All user-facing and operational messages are managed via the message service. **Admin authentication required for write operations.**

### List All Messages

**Endpoint:** `GET /api/v1/messages`

**Authentication:** Optional (public read access)

**Query Parameters (Optional):**

- `type`: Filter by message type (success, error, authLog, systemLog, validationLog, securityLog)
- `category`: Filter by category (user, auth, system, validation, security)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "id": "msg-uuid-1",
      "key": "REGISTRATION_SUCCESS",
      "type": "success",
      "category": "user",
      "value": "Registration successful. Please check your email to confirm your account.",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "requestId": "req-messages001"
}
```

### Get Message by Key

**Endpoint:** `GET /api/v1/messages/key/{key}`

**Authentication:** Optional (public read access)

**Path Parameters:**

- `key`: Message key (e.g., `REGISTRATION_SUCCESS`)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Message retrieved successfully",
  "data": {
    "id": "msg-uuid-1",
    "key": "REGISTRATION_SUCCESS",
    "type": "success",
    "category": "user",
    "value": "Registration successful. Please check your email to confirm your account.",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "requestId": "req-messages002"
}
```

**Common Errors:**

- 404 Not Found: Message key not found

### Get Message by ID

**Endpoint:** `GET /api/v1/messages/{id}`

**Authentication:** Optional (public read access)

**Path Parameters:**

- `id`: Message UUID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Message retrieved successfully",
  "data": {
    "id": "msg-uuid-1",
    "key": "REGISTRATION_SUCCESS",
    "type": "success",
    "category": "user",
    "value": "Registration successful. Please check your email to confirm your account.",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "requestId": "req-messages003"
}
```

**Common Errors:**

- 404 Not Found: Message ID not found

### Create Message (Admin Only)

**Endpoint:** `POST /api/v1/messages`

**Authentication:** Required (admin role)

**Request Body:**

```json
{
  "key": "CUSTOM_SUCCESS_MESSAGE",
  "type": "success",
  "category": "user",
  "value": "Your custom action was successful!"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Message created successfully",
  "data": {
    "id": "msg-uuid-new",
    "key": "CUSTOM_SUCCESS_MESSAGE",
    "type": "success",
    "category": "user",
    "value": "Your custom action was successful!",
    "createdAt": "2024-01-20T15:00:00.000Z",
    "updatedAt": "2024-01-20T15:00:00.000Z"
  },
  "requestId": "req-messages004"
}
```

**Common Errors:**

- 403 Forbidden: User is not admin
- 409 Conflict: Message key already exists

### Update Message (Admin Only)

**Endpoint:** `PUT /api/v1/messages/{id}`

**Authentication:** Required (admin role)

**Path Parameters:**

- `id`: Message UUID

**Request Body:**

```json
{
  "key": "CUSTOM_SUCCESS_MESSAGE",
  "type": "success",
  "category": "user",
  "value": "Your custom action was completed successfully!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Message updated successfully",
  "data": {
    "id": "msg-uuid-new",
    "key": "CUSTOM_SUCCESS_MESSAGE",
    "type": "success",
    "category": "user",
    "value": "Your custom action was completed successfully!",
    "createdAt": "2024-01-20T15:00:00.000Z",
    "updatedAt": "2024-01-20T15:30:00.000Z"
  },
  "requestId": "req-messages005"
}
```

**Common Errors:**

- 403 Forbidden: User is not admin
- 404 Not Found: Message ID not found

### Delete Message (Admin Only)

**Endpoint:** `DELETE /api/v1/messages/{id}`

**Authentication:** Required (admin role)

**Path Parameters:**

- `id`: Message UUID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Message deleted successfully",
  "requestId": "req-messages006"
}
```

**Common Errors:**

- 403 Forbidden: User is not admin
- 404 Not Found: Message ID not found

### Refresh Message Cache (Admin Only)

**Endpoint:** `POST /api/v1/messages/refresh-cache`

**Authentication:** Required (admin role)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Message cache refreshed successfully",
  "data": {
    "loadedCount": 150
  },
  "requestId": "req-messages007"
}
```

**What Happens:**

- Message service reloads all messages from database into memory cache
- Ensures latest messages are used for responses and logging

**Common Errors:**

- 403 Forbidden: User is not admin

---

## Admin User Management Endpoints

### List All Users (Admin Only)

**Endpoint:** `GET /api/v1/auth/users`

**Authentication:** Required (admin role)

**Description:**

- Returns a list of all users except the requesting admin.
- Sorted by role (`admin` first), then by `full_name` alphabetically.
- Used for admin user management interfaces.

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "email": "admin@example.com",
      "full_name": "Jane Admin",
      "role": "admin"
    }
  ],
  "count": 2,
  "message": "Users retrieved successfully",
  "requestId": "req-users-001"
}
```

**Common Errors:**

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Not admin

---

### Update User Role (Admin Only)

**Endpoint:** `PUT /api/v1/auth/users/role`

**Authentication:** Required (admin role)

**Request Body:**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "admin"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "admin"
  },
  "message": "User role updated successfully",
  "status": 200
}
```

**Common Errors:**

- 400 Bad Request: Admin attempting to demote themselves
- 401 Unauthorized: Not authenticated
- 403 Forbidden: Not admin
- 404 Not Found: User not found

---

## Common Error Codes

Frontend developers can use the `error.code` field for programmatic error handling.

| Error Code                | Status | Description                            | Typical Cause                              |
| ------------------------- | ------ | -------------------------------------- | ------------------------------------------ |
| `AUTHENTICATION_ERROR`    | 401    | Authentication failed or token invalid | Expired/invalid token, missing credentials |
| `INVALID_CREDENTIALS`     | 401    | Email or password incorrect            | Wrong login credentials                    |
| `EMAIL_NOT_CONFIRMED`     | 403    | Email address not verified             | User hasn't confirmed email                |
| `ACCOUNT_LOCKED`          | 403    | Account temporarily locked             | Too many failed login attempts             |
| `PERMISSION_DENIED`       | 403    | Insufficient permissions               | Non-admin trying admin operation           |
| `RESOURCE_NOT_FOUND`      | 404    | Requested resource doesn't exist       | Invalid ID, deleted resource               |
| `EMAIL_ALREADY_EXISTS`    | 409    | Email already registered               | Registration with existing email           |
| `TOKEN_EXPIRED`           | 410    | Token no longer valid                  | Expired confirmation/reset token           |
| `VALIDATION_ERROR`        | 400    | Request data invalid                   | Missing fields, wrong format               |
| `RATE_LIMIT_EXCEEDED`     | 429    | Too many requests                      | Exceeded rate limit threshold              |
| `INVALID_TWO_FACTOR_CODE` | 401    | 2FA code wrong or expired              | Incorrect/expired 2FA verification code    |

**Error Handling Example:**

```typescript
try {
  await api.post('/api/v1/auth/login', { email, password });
} catch (error) {
  const errorCode = error.response?.data?.error?.code;
  const errorMessage = error.response?.data?.error?.message;

  switch (errorCode) {
    case 'INVALID_CREDENTIALS':
      showError('Invalid email or password');
      break;
    case 'EMAIL_NOT_CONFIRMED':
      showError('Please confirm your email before logging in');
      showResendConfirmationButton();
      break;
    case 'ACCOUNT_LOCKED':
      showError(errorMessage); // Display server message with unlock time
      break;
    default:
      showError(errorMessage || 'An error occurred');
  }
}
```

---

## Request & Response Format

### Success Response Structure

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* ... */
  },
  "count": 1 // Optional: for list endpoints
}
```

**Fields:**

- `success`: Always `true` for successful responses
- `message`: Human-readable success message (from message service)
- `data`: Response payload (object or array)
- `count`: Total count (only for list endpoints)
- `requestId`: Unique request identifier for debugging

### Error Response Structure

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": [
      /* validation errors */
    ], // Optional
    "requestId": "req-def456"
  }
}
```

**Fields:**

- `success`: Always `false` for error responses
- `error.message`: Human-readable error message (from message service)
- `error.code`: Machine-readable error code for programmatic handling
- `error.statusCode`: HTTP status code
- `error.details`: Validation errors array (only for 400 validation errors)
- `error.requestId`: Unique request identifier for debugging

### Validation Error Example

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ],
    "requestId": "req-validation001"
  }
}
```

**Important:** All error and success messages come from the centralized message service. Never hard-code user-facing strings in your frontend; always use the `message` field from the response.

---

## Frontend Integration Checklist

### 1. HTTP Client Setup

- [ ] Configure `withCredentials: true` (Axios) or `credentials: 'include'` (Fetch) for all requests
- [ ] Set base URL to API server (e.g., `http://localhost:5004`)
- [ ] Implement response interceptor for automatic token refresh (see Axios example above)
- [ ] Handle network errors gracefully (timeout, connection refused, etc.)

### 2. Authentication Flow

- [ ] Login page sends credentials to `/api/v1/auth/login`
- [ ] Handle 2FA flow if `twoFactorRequired: true` in response
- [ ] Store user data from response in state (but NOT tokens - they're httpOnly cookies)
- [ ] Redirect to protected route after successful login

### 3. Token Refresh Handling

- [ ] Implement automatic refresh on 401 "expired" errors
- [ ] Handle refresh failure by redirecting to login
- [ ] Prevent multiple simultaneous refresh calls (use flag/queue pattern)
- [ ] Retry original request after successful refresh

### 4. Error Handling

- [ ] Use `error.message` from response for user display
- [ ] Use `error.code` for programmatic handling (see error codes table)
- [ ] Handle 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 429 (rate limit) appropriately
- [ ] Display validation errors from `error.details` array

### 5. Session Management

- [ ] Implement logout functionality (call `/api/v1/auth/logout`)
- [ ] Clear stored user data from state on logout
- [ ] Redirect to login page after logout
- [ ] Provide "logout all devices" option (call `/api/v1/auth/logout-all`)

### 6. Registration & Email Confirmation

- [ ] Validate email and password on frontend (UX only - backend validates)
- [ ] Display registration success message
- [ ] Implement email confirmation flow (handle token from email link)
- [ ] Provide "resend confirmation email" option

### 7. Password Management

- [ ] Implement password reset flow (request → validate token → reset)
- [ ] Display password strength indicator
- [ ] Implement change password (authenticated users)
- [ ] Handle password reset token expiration gracefully

### 8. Two-Factor Authentication

- [ ] Handle 2FA required response during login
- [ ] Display 2FA code input form with timer (10 minutes validity)
- [ ] Allow users to enable/disable 2FA in settings
- [ ] Verify 2FA code and handle invalid/expired codes

---

## Security Best Practices

### For Frontend Developers

1. **Never try to access tokens directly**

   - Tokens are httpOnly cookies - JavaScript cannot and should not read them
   - This prevents XSS attacks from stealing authentication tokens
   - Trust the automatic cookie handling by the browser

2. **Always use `credentials: 'include'` or `withCredentials: true`**

   - Required for cookies to be sent with cross-origin requests
   - Without this, authentication will silently fail
   - Apply to **every** API request (authenticated or not)

3. **Don't store sensitive data in localStorage/sessionStorage**

   - Use httpOnly cookies for tokens (already implemented server-side)
   - Only store non-sensitive user data (email, name, role) in frontend state
   - Never store passwords, tokens, or PII in browser storage

4. **Handle 401 errors properly**

   - Implement automatic token refresh (see interceptor examples)
   - Don't show "unauthorized" errors to users for expired tokens - refresh silently
   - Only show error if refresh also fails (then redirect to login)

5. **Validate on backend, not frontend**

   - Frontend validation is for user experience only
   - Backend validates everything with Zod schemas
   - Don't rely solely on frontend checks for security

6. **Use HTTPS in production**

   - Cookies are marked `secure` in production, meaning they only work over HTTPS
   - Never deploy authentication to production without HTTPS
   - Use tools like Let's Encrypt for free SSL certificates

7. **Implement proper error handling**

   - Don't expose stack traces or detailed error messages to users
   - Use `error.code` for programmatic handling, `error.message` for display
   - Log errors to monitoring service (Sentry, LogRocket, etc.)

8. **Respect rate limits**
   - Handle 429 responses gracefully (show retry timer)
   - Implement client-side rate limiting for expensive operations
   - Don't hammer endpoints in a loop

---

## Common Scenarios

### Scenario 1: User Closes Browser and Returns

**Behavior:**

- If user returns within 7 days: Still authenticated (refresh token valid)
- If user returns after 7 days: Must login again (refresh token expired)

**Why:**

- Refresh token persists as cookie with 7-day expiration
- Access token expired, but refresh endpoint automatically gets new access token
- Seamless experience for returning users

**Frontend Implementation:**

```typescript
// On app initialization
async function checkAuthStatus() {
  try {
    // Try to fetch user data (will auto-refresh if access token expired)
    const response = await api.get('/api/v1/auth/sessions');
    // User is authenticated
    setUser(response.data.data[0]); // Access first session
  } catch (error) {
    // Not authenticated or refresh failed
    redirectToLogin();
  }
}
```

### Scenario 2: Multiple Tabs/Windows

**Behavior:**

- All tabs share same cookies (single browser session)
- Token refresh in one tab applies to all tabs
- All tabs can make authenticated requests

**Edge Case:**

- If one tab calls logout, cookies are cleared globally
- Other tabs will get 401 on next request
- Interceptor will try refresh, which also fails (tokens cleared)
- All tabs redirect to login

**Frontend Implementation:**

```typescript
// Listen for storage events to sync logout across tabs
window.addEventListener('storage', (event) => {
  if (event.key === 'user' && event.newValue === null) {
    // User logged out in another tab
    window.location.href = '/login';
  }
});

// On logout, clear storage to trigger event
function logout() {
  localStorage.removeItem('user'); // Triggers storage event
  api.post('/api/v1/auth/logout');
  window.location.href = '/login';
}
```

### Scenario 3: API Call While Token Refresh in Progress

**Behavior:**

- First request triggers refresh (gets 401, calls `/api/v1/auth/refresh`)
- Subsequent requests wait for refresh to complete
- After refresh, all pending requests retry automatically with new tokens

**Implementation:**

- `isRefreshing` flag prevents multiple simultaneous refresh calls
- `refreshSubscribers` array queues pending requests
- All requests resume after refresh completes
- See Axios interceptor code above for complete implementation

### Scenario 4: Registration with Email Confirmation

**Typical Flow:**

1. User fills out registration form
2. Frontend calls `/api/v1/auth/register`
3. Display success message: "Check your email to confirm your account"
4. User clicks link in email (contains token)
5. Frontend extracts token from URL query parameter
6. Frontend calls `/api/v1/auth/confirm-email?token={token}`
7. Display success message: "Email confirmed! Please log in"
8. Redirect to login page

**Frontend Implementation:**

```typescript
// Registration page
async function handleRegister(email: string, password: string, fullName: string) {
  try {
    const response = await api.post('/api/v1/auth/register', {
      email,
      password,
      fullName,
    });
    showSuccess(response.data.message);
    redirectToCheckEmail();
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message;
    showError(errorMessage);
  }
}

// Email confirmation page
async function handleConfirmEmail(token: string) {
  try {
    const response = await api.get(`/api/v1/auth/confirm-email?token=${token}`);
    showSuccess(response.data.message);
    setTimeout(() => redirectToLogin(), 2000);
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message;
    showError(errorMessage);
  }
}
```

### Scenario 5: Password Reset Flow

**Typical Flow:**

1. User clicks "Forgot Password" on login page
2. User enters email address
3. Frontend calls `/api/v1/auth/request-password-reset`
4. Display message: "If an account exists, reset email has been sent"
5. User clicks link in email (contains token)
6. Frontend extracts token from URL, calls `/api/v1/auth/validate-reset-token`
7. If valid, show password reset form
8. User enters new password
9. Frontend calls `/api/v1/auth/reset-password` with token and new password
10. Display success message: "Password reset successful"
11. Redirect to login page

**Frontend Implementation:**

```typescript
// Request reset
async function handleRequestReset(email: string) {
  try {
    const response = await api.post('/api/v1/auth/request-password-reset', { email });
    showSuccess(response.data.message);
  } catch (error) {
    showError('Unable to send reset email. Please try again.');
  }
}

// Validate token
async function handleValidateToken(token: string) {
  try {
    const response = await api.get(`/api/v1/auth/validate-reset-token?token=${token}`);
    setEmail(response.data.data.email);
    showResetForm();
  } catch (error) {
    showError('Invalid or expired reset link');
    redirectToLogin();
  }
}

// Reset password
async function handleResetPassword(token: string, newPassword: string) {
  try {
    const response = await api.post('/api/v1/auth/reset-password', {
      token,
      newPassword,
    });
    showSuccess(response.data.message);
    setTimeout(() => redirectToLogin(), 2000);
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message;
    showError(errorMessage);
  }
}
```

---

## Environment-Specific Notes

### Development

- **Base URL:** `http://localhost:5004`
- **Cookies:** `secure` flag disabled (allows HTTP)
- **CORS:** Enabled for frontend development servers
- **Email:** Use `EMAIL_PROVIDER=console` in `.env` to see emails in server logs
- **Additional Endpoints:**
  - Health check: `GET /health`
  - Metrics: `GET /metrics`
  - API docs: `/docs` (Swagger UI)

### Production

- **Base URL:** Your production domain (e.g., `https://api.yourdomain.com`)
- **Cookies:** `secure` flag enabled (HTTPS required)
- **sameSite:** `strict` (prevents CSRF attacks)
- **CORS:** Restricted to specific origins
- **HTTPS Required:** Cookies won't work without HTTPS
- **Rate Limiting:** Stricter limits enforced
- **Logging:** Reduced verbosity, no stack traces exposed

**Production Deployment Checklist:**

- [ ] Environment uses HTTPS (Let's Encrypt, Cloudflare, etc.)
- [ ] `NODE_ENV=production` set in environment
- [ ] Strong JWT secrets configured (64+ random hex characters)
- [ ] Database backed up regularly
- [ ] Error monitoring enabled (Sentry, Rollbar, etc.)
- [ ] Rate limiting configured appropriately
- [ ] CORS origins restricted to frontend domains

---

## Summary

### Authentication Flow Overview

1. **Register** → Confirm email → Login
2. **Login** → If 2FA enabled, verify code → Tokens issued
3. **Access token** (15m) used for API requests
4. **Refresh token** (7d) used to get new access tokens
5. **Token expires** → Automatic refresh (transparent to user)
6. **Refresh fails** → Redirect to login (both tokens expired)
7. **Logout** → Revoke current session
8. **Logout all** → Revoke all sessions (all devices)

### Key Integration Points

1. **Always send cookies:** Use `withCredentials: true` or `credentials: 'include'`
2. **Implement automatic refresh:** Use interceptor pattern (see examples above)
3. **Handle errors gracefully:** Use `error.code` for logic, `error.message` for display
4. **Never store tokens:** They're httpOnly cookies managed automatically
5. **Trust the backend:** All validation and security handled server-side

### Quick Reference

| Operation       | Endpoint                            | Auth Required | Cookie Changes |
| --------------- | ----------------------------------- | ------------- | -------------- |
| Register        | `POST /api/v1/auth/register`        | No            | None           |
| Confirm Email   | `GET /api/v1/auth/confirm-email`    | No            | None           |
| Login           | `POST /api/v1/auth/login`           | No            | Sets tokens    |
| Confirm 2FA     | `POST /api/v1/auth/confirm-2fa`     | No            | Sets tokens    |
| Refresh         | `POST /api/v1/auth/refresh`         | Cookie        | Rotates tokens |
| Logout          | `POST /api/v1/auth/logout`          | Yes           | Clears tokens  |
| Logout All      | `POST /api/v1/auth/logout-all`      | Yes           | Clears tokens  |
| Change Password | `POST /api/v1/auth/change-password` | Yes           | None           |
| Enable 2FA      | `POST /api/v1/auth/2fa/enable`      | Yes           | None           |
| Disable 2FA     | `POST /api/v1/auth/2fa/disable`     | Yes           | None           |

---

## Additional Resources

- **OpenAPI Specification:** [`docs/openapi.yaml`](docs/openapi.yaml) - Complete API documentation with request/response schemas
- **Message Service:** All user-facing and operational messages centrally managed
- **Error Codes:** Use `error.code` field for programmatic error handling
- **Security:** JWT-based, httpOnly cookies, bcrypt password hashing, token rotation

---

For questions or issues, refer to the OpenAPI specification or contact the backend team.

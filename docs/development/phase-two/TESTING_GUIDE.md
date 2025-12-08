# TicoBot API - Testing Guide

Complete guide for testing the TicoBot API using various tools.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Testing with cURL](#testing-with-curl)
- [Testing with Swagger UI](#testing-with-swagger-ui)
- [Testing with Postman](#testing-with-postman)
- [Testing with HTTPie](#testing-with-httpie)
- [Test Scenarios](#test-scenarios)

---

## Prerequisites

1. **Backend server running**:
   ```bash
   cd backend
   pnpm dev:server
   ```

2. **Supabase local running**:
   ```bash
   cd backend
   pnpm supabase start
   ```

3. **Environment variables configured** (`.env` file in `backend/`):
   ```env
   JWT_SECRET=<your-secret>
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   BCRYPT_ROUNDS=10
   FRONTEND_URL=http://localhost:3000
   ```

---

## Setup

### 1. Start the Server

```bash
cd /path/to/ticobot
pnpm --filter backend dev:server
```

Server will start on `http://localhost:3001`

### 2. Verify Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ticobot-backend",
  "timestamp": "2025-12-08T19:00:00.000Z",
  "version": "0.1.0"
}
```

---

## Testing with cURL

### 1. Register a New User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "name": "Test User",
    "tier": "free"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Save the tokens** for subsequent requests!

### 2. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

### 3. Get Current User Info

```bash
TOKEN="your-access-token-here"

curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "name": "Test User",
    "tier": "free",
    "emailVerified": false,
    "createdAt": "2025-12-08T19:00:00.000Z"
  },
  "queryStats": {
    "count": 0,
    "limit": 10,
    "remaining": 10
  }
}
```

### 4. Test Protected Endpoint (Chat)

```bash
TOKEN="your-access-token-here"

curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Qué propone el PLN sobre educación?",
    "topK": 5,
    "temperature": 0.7
  }'
```

### 5. Test Refresh Token

```bash
REFRESH_TOKEN="your-refresh-token-here"

curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'$REFRESH_TOKEN'"
  }'
```

### 6. Logout

```bash
REFRESH_TOKEN="your-refresh-token-here"

curl -X POST http://localhost:3001/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'$REFRESH_TOKEN'"
  }'
```

### 7. Test Rate Limiting

Run this command 11 times (free tier limit is 10):

```bash
TOKEN="your-access-token-here"

for i in {1..11}; do
  echo "Request $i:"
  curl -X POST http://localhost:3001/api/chat \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"question":"test"}' | grep -E "(error|limit)"
  echo ""
done
```

After 10 requests, you should see:
```json
{
  "error": "Daily query limit exceeded",
  "tier": "free",
  "limit": 10,
  "used": 10
}
```

---

## Testing with Swagger UI

### 1. Open Swagger UI

Navigate to: http://localhost:3001/api/docs

### 2. Register a User

1. Find **POST /api/auth/register**
2. Click "Try it out"
3. Enter request body:
   ```json
   {
     "email": "swagger@example.com",
     "password": "SecurePassword123!",
     "name": "Swagger User"
   }
   ```
4. Click "Execute"
5. **Copy the `accessToken`** from response

### 3. Authorize

1. Click the **"Authorize"** button at the top right
2. Enter: `Bearer <your-access-token>`
3. Click "Authorize"
4. Click "Close"

Now all requests will include the authorization header!

### 4. Test Protected Endpoints

Try any of these:
- **GET /api/auth/me** - Get current user
- **POST /api/chat** - Chat with RAG
- **POST /api/search** - Search documents
- **GET /api/documents** - List documents

### 5. Test Rate Limiting

Make multiple requests to `/api/chat` until you hit the limit (10 for free tier).

---

## Testing with Postman

### 1. Import Collection

Create a new collection with these requests:

#### Register User
- **Method**: POST
- **URL**: `http://localhost:3001/api/auth/register`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
  ```json
  {
    "email": "postman@example.com",
    "password": "SecurePassword123!",
    "name": "Postman User"
  }
  ```

#### Save Token Script

Add this to the **Tests** tab:
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("accessToken", response.accessToken);
    pm.environment.set("refreshToken", response.refreshToken);
}
```

#### Login
- **Method**: POST
- **URL**: `http://localhost:3001/api/auth/login`
- **Body**:
  ```json
  {
    "email": "postman@example.com",
    "password": "SecurePassword123!"
  }
  ```

#### Get Current User
- **Method**: GET
- **URL**: `http://localhost:3001/api/auth/me`
- **Headers**:
  - `Authorization: Bearer {{accessToken}}`

#### Chat
- **Method**: POST
- **URL**: `http://localhost:3001/api/chat`
- **Headers**:
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "question": "¿Qué propone el PLN sobre educación?",
    "topK": 5
  }
  ```

### 2. Set Up Environment

1. Create environment: "TicoBot Local"
2. Add variables:
   - `baseUrl`: `http://localhost:3001`
   - `accessToken`: (will be auto-populated)
   - `refreshToken`: (will be auto-populated)

---

## Testing with HTTPie

HTTPie is a more user-friendly alternative to cURL.

### Install HTTPie

```bash
# Ubuntu/Debian
sudo apt install httpie

# macOS
brew install httpie

# Or with pip
pip install httpie
```

### 1. Register

```bash
http POST localhost:3001/api/auth/register \
  email=httpie@example.com \
  password=SecurePassword123! \
  name="HTTPie User"
```

### 2. Login

```bash
http POST localhost:3001/api/auth/login \
  email=httpie@example.com \
  password=SecurePassword123!
```

### 3. Get User (with token)

```bash
TOKEN="your-token-here"

http GET localhost:3001/api/auth/me \
  Authorization:"Bearer $TOKEN"
```

### 4. Chat

```bash
http POST localhost:3001/api/chat \
  Authorization:"Bearer $TOKEN" \
  question="¿Qué propone el PLN?" \
  topK:=5
```

---

## Test Scenarios

### Scenario 1: Complete Authentication Flow

1. **Register** → Get tokens
2. **Login** → Get new tokens
3. **Get /me** → Verify user info
4. **Refresh token** → Get new access token
5. **Logout** → Revoke refresh token

### Scenario 2: Security Features

#### Password Strength
Try these passwords (should fail):
- `weak` - Too short
- `password123` - Common password
- `12345678` - Sequential characters
- `aaaaaaaa` - Repeated characters
- `test@example.com` - Contains email

Should succeed:
- `SecurePassword123!`
- `MyP@ssw0rd!Strong`

#### Brute Force Protection

Try logging in with wrong password 6 times:

```bash
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "WrongPassword123!"
    }'
  echo ""
done
```

After 5 failed attempts, should see:
```json
{
  "error": "Too many failed login attempts. Please try again in 15 minutes.",
  "retryAfter": "2025-12-08T20:00:00.000Z"
}
```

#### Token Reuse Detection

1. Get refresh token
2. Use it once (should work)
3. Try to use the same token again (should be revoked and detected as reuse)
4. All tokens for that user should be revoked

### Scenario 3: Rate Limiting

1. Register free tier user
2. Make 10 requests to `/api/chat`
3. 11th request should be blocked
4. Check headers for rate limit info:
   - `X-RateLimit-Limit: 10`
   - `X-RateLimit-Remaining: 0`

### Scenario 4: Admin Access

1. Create admin user:
   ```bash
   cd backend
   pnpm admin:create
   ```

2. Login as admin
3. Try admin endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/ingest/ingest \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://example.com/document.pdf",
       "documentId": "test-doc"
     }'
   ```

### Scenario 5: Unauthorized Access

Test that endpoints are properly protected:

```bash
# Should fail (no token)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}'

# Should fail (invalid token)
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}'

# Should fail (expired token)
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer <expired-token>" \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}'
```

---

## Common Issues

### 1. "JWT_SECRET is not configured"

**Solution**: Add JWT_SECRET to `.env`:
```bash
JWT_SECRET=$(openssl rand -base64 32)
```

### 2. "Cannot find module supabase.js"

**Solution**: Ensure Supabase is running:
```bash
cd backend
pnpm supabase start
```

### 3. "Daily query limit exceeded"

**Solution**: Either:
- Wait for reset (midnight UTC)
- Upgrade to premium tier
- Use different user account

### 4. "Token has expired"

**Solution**: Use the refresh token to get a new access token:
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<your-refresh-token>"}'
```

---

## Next Steps

After testing:
1. Review audit logs in Supabase
2. Check rate limit counters
3. Verify token revocation works
4. Test with frontend application

---

**Last Updated**: December 8, 2025
**Version**: 1.0.0
**Author**: Claude Code

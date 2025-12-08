# JWT Authentication - Manual Implementation Guide

## Overview

This guide provides step-by-step instructions to implement JWT-based authentication for the TicoBot backend API.

**Branch**: `phase-2/jwt-authentication`
**Issue**: #29
**Estimated Time**: 2-3 days

---

## Prerequisites

✅ **Completed**:
- Dependencies installed: `jsonwebtoken`, `bcrypt`, `@types/jsonwebtoken`, `@types/bcrypt`
- Feature branch created: `phase-2/jwt-authentication`
- Migration file created: `backend/supabase/migrations/20251207214925_create_users_auth.sql`

⏳ **Pending**:
- Apply migration to Supabase database
- Implement JWT utilities
- Create auth endpoints
- Add middleware

---

## Step 1: Apply Database Migration

### Option A: Using Supabase CLI (Recommended)

```bash
# From project root
cd backend

# Link to Supabase project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
npx supabase db push
```

### Option B: Manual SQL Execution (if Supabase CLI fails)

1. Open Supabase Dashboard: https://app.supabase.com
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy contents of `backend/supabase/migrations/20251207214925_create_users_auth.sql`
5. Paste and execute

### Option C: Using Supabase Cloud URL (Quick)

```bash
# Install PostgreSQL client
sudo apt-get install postgresql-client  # Ubuntu/Debian
# OR
brew install postgresql  # macOS

# Connect to Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-ID].supabase.co:5432/postgres"

# Then paste the migration SQL
\i backend/supabase/migrations/20251207214925_create_users_auth.sql
```

### Verify Migration

```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'refresh_tokens');

-- Should return:
-- users
-- refresh_tokens
```

---

## Step 2: Update Environment Configuration

Add to `backend/.env`:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=10
```

**Generate a secure JWT_SECRET**:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-random.org/encryption-key-generator
```

Update `backend/src/config/env.ts`:

```typescript
import { z } from 'zod';

export const envSchema = z.object({
  // ... existing fields ...

  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(10),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
```

---

## Step 3: Implement JWT Utilities

Create `backend/src/auth/jwt.utils.ts`:

```typescript
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JWTPayload {
  userId: string;
  email: string;
  tier: 'free' | 'premium' | 'admin';
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
    issuer: 'ticobot-api',
    audience: 'ticobot-client',
  });
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
    issuer: 'ticobot-api',
    audience: 'ticobot-client',
  });
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'ticobot-api',
      audience: 'ticobot-client',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'ticobot-api',
      audience: 'ticobot-client',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(payload: JWTPayload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
```

Create `backend/src/auth/password.utils.ts`:

```typescript
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

/**
 * Hash a plain text password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, env.BCRYPT_ROUNDS);
}

/**
 * Verify a plain text password against a hash
 */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
```

---

## Step 4: Create User Database Repository

Create `backend/src/auth/user.repository.ts`:

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export type UserTier = 'free' | 'premium' | 'admin';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  tier: UserTier;
  query_count_today: number;
  last_query_date: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  name?: string;
}

export class UserRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as User;
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as User;
  }

  async create(userData: CreateUserData): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  }

  async incrementQueryCount(userId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('increment_query_count', {
      user_id_param: userId,
    });

    if (error) throw error;
    return data as number;
  }

  async checkRateLimit(userId: string): Promise<{
    allowed: boolean;
    current_count: number;
    limit_count: number;
    tier: UserTier;
  }> {
    const { data, error } = await this.supabase
      .rpc('check_rate_limit', { user_id_param: userId })
      .single();

    if (error) throw error;
    return data;
  }
}
```

Create `backend/src/auth/token.repository.ts`:

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
  revoked_at: string | null;
}

export class TokenRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<RefreshToken> {
    const { data, error } = await this.supabase
      .from('refresh_tokens')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as RefreshToken;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const { data, error } = await this.supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_revoked', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as RefreshToken;
  }

  async revoke(token: string): Promise<void> {
    await this.supabase.rpc('revoke_refresh_token', { token_param: token });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('refresh_tokens')
      .update({ is_revoked: true, revoked_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;
  }
}
```

---

## Step 5: Create Authentication Middleware

Create `backend/src/api/middleware/auth.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../../auth/jwt.utils.js';
import { UserRepository } from '../../auth/user.repository.js';
import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { id: string };
    }
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyAccessToken(token);

    // Attach user to request
    req.user = {
      ...payload,
      id: payload.userId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Middleware to check rate limit
 */
export function checkRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const userRepo = new UserRepository(supabase);

  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  userRepo
    .checkRateLimit(req.user.id)
    .then((rateLimit) => {
      if (!rateLimit.allowed) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Free tier: ${rateLimit.limit_count} queries/day. Upgrade to premium for unlimited access.`,
          current_count: rateLimit.current_count,
          limit: rateLimit.limit_count,
          tier: rateLimit.tier,
        });
      }

      // Increment query count
      userRepo.incrementQueryCount(req.user!.id).then(() => {
        next();
      });
    })
    .catch((error) => {
      console.error('Rate limit check error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check rate limit',
      });
    });
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (req.user.tier !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }

  next();
}
```

---

## Step 6: Implement Auth Endpoints

Create `backend/src/api/routes/auth.ts`:

```typescript
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';
import { UserRepository } from '../../auth/user.repository.js';
import { TokenRepository } from '../../auth/token.repository.js';
import { hashPassword, verifyPassword } from '../../auth/password.utils.js';
import {
  generateTokenPair,
  verifyRefreshToken,
} from '../../auth/jwt.utils.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);
const userRepo = new UserRepository(supabase);
const tokenRepo = new TokenRepository(supabase);

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input or email already exists
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate input
    const body = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await userRepo.findByEmail(body.email);
    if (existingUser) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email already registered',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create user
    const user = await userRepo.create({
      email: body.email,
      password_hash: passwordHash,
      name: body.name,
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      tier: user.tier,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await tokenRepo.create(user.id, tokens.refreshToken, expiresAt);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      });
    }

    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user',
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const body = loginSchema.parse(req.body);

    // Find user
    const user = await userRepo.findByEmail(body.email);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isValid = await verifyPassword(body.password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Account is disabled',
      });
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      tier: user.tier,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await tokenRepo.create(user.id, tokens.refreshToken, expiresAt);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      });
    }

    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to login',
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Validate input
    const body = refreshSchema.parse(req.body);

    // Verify refresh token
    const payload = verifyRefreshToken(body.refreshToken);

    // Check if token exists and is not revoked
    const tokenRecord = await tokenRepo.findByToken(body.refreshToken);
    if (!tokenRecord) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      });
    }

    // Check if token is expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token expired',
      });
    }

    // Get user (to get latest tier info)
    const user = await userRepo.findById(payload.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found or inactive',
      });
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      tier: user.tier,
    });

    // Revoke old refresh token
    await tokenRepo.revoke(body.refreshToken);

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await tokenRepo.create(user.id, tokens.refreshToken, expiresAt);

    return res.status(200).json({
      message: 'Token refreshed successfully',
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      });
    }

    console.error('Refresh token error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired refresh token',
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await tokenRepo.revoke(refreshToken);
    }

    return res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to logout',
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user info
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await userRepo.findById(req.user!.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        query_count_today: user.query_count_today,
        email_verified: user.email_verified,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user info',
    });
  }
});

export default router;
```

---

## Step 7: Update Server to Use Auth Routes

Update `backend/src/api/server.ts`:

```typescript
// ... existing imports ...
import authRoutes from './routes/auth.js';

export function createApp(): Express {
  const app = express();

  // ... existing middleware ...

  // API Routes
  app.use('/api/auth', authRoutes); // ADD THIS LINE
  app.use('/api/ingest', ingestRoutes);
  app.use('/api/documents', documentsRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/chat', chatRoutes);

  // ... rest of the code ...
}
```

---

## Step 8: Protect Existing Endpoints

Update `backend/src/api/routes/search.ts`:

```typescript
import { requireAuth, checkRateLimit } from '../middleware/auth.middleware.js';

// Apply to POST endpoint
router.post('/', requireAuth, checkRateLimit, async (req: Request, res: Response) => {
  // ... existing code ...
});

// GET endpoint can remain public or protected
router.get('/', requireAuth, checkRateLimit, async (req: Request, res: Response) => {
  // ... existing code ...
});
```

Update `backend/src/api/routes/chat.ts`:

```typescript
import { requireAuth, checkRateLimit } from '../middleware/auth.middleware.js';

router.post('/', requireAuth, checkRateLimit, async (req: Request, res: Response) => {
  // ... existing code ...
});

router.post('/stream', requireAuth, checkRateLimit, async (req: Request, res: Response) => {
  // ... existing code ...
});
```

Update `backend/src/api/routes/ingest.ts`:

```typescript
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

// Only admins can ingest
router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  // ... existing code ...
});

router.post('/bulk', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  // ... existing code ...
});
```

---

## Step 9: Testing

### Manual Testing with cURL

1. **Register a user**:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "name": "Test User",
    "tier": "free"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

2. **Login**:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

3. **Get current user**:

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

4. **Test protected endpoint**:

```bash
curl -X POST http://localhost:3001/api/search \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "educación",
    "limit": 5
  }'
```

5. **Test rate limiting** (make 11 requests as free user):

```bash
for i in {1..11}; do
  echo "Request $i:"
  curl -X POST http://localhost:3001/api/search \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"query": "salud", "limit": 5}'
  echo ""
done
```

Expected: First 10 succeed, 11th returns 429 Too Many Requests

6. **Refresh token**:

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

7. **Logout**:

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Automated Tests

Create `backend/src/auth/__tests__/jwt.utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../jwt.utils';

describe('JWT Utils', () => {
  const payload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    tier: 'free' as const,
  };

  it('should generate and verify access token', () => {
    const token = generateAccessToken(payload);
    expect(token).toBeTruthy();

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.tier).toBe(payload.tier);
  });

  it('should generate and verify refresh token', () => {
    const token = generateRefreshToken(payload);
    expect(token).toBeTruthy();

    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });

  it('should throw error for invalid token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
  });
});
```

Run tests:

```bash
cd backend
pnpm test
```

---

## Step 10: Update Swagger Documentation

Update `backend/src/api/swagger.ts`:

```typescript
export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TicoBot API',
      version: '0.1.0',
      description: 'API for accessing Costa Rica 2026 Government Plans',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Documents', description: 'Document management' },
      { name: 'Search', description: 'Semantic search' },
      { name: 'Chat', description: 'RAG-powered Q&A' },
      { name: 'Ingest', description: 'PDF ingestion' },
    ],
  },
  apis: ['./src/api/routes/*.ts'],
});
```

---

## Step 11: Commit and Push

```bash
# From project root
git add .
git commit -m "[Phase 2.4] Implement JWT authentication and user management

- Add users and refresh_tokens tables
- Implement JWT utilities (generate, verify, refresh)
- Add authentication middleware (requireAuth, checkRateLimit, requireAdmin)
- Create auth endpoints (register, login, refresh, logout, me)
- Protect existing endpoints with authentication
- Add rate limiting (10 queries/day for free tier)
- Update Swagger documentation

Closes #29

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push -u origin phase-2/jwt-authentication
```

---

## Step 12: Create Pull Request

```bash
gh pr create --title "[Phase 2.4] JWT Authentication & User Management" \
  --body "## Summary

Implements JWT-based authentication system with user registration, login, token refresh, and rate limiting.

## Changes

- **Database**: Added users and refresh_tokens tables
- **Auth utilities**: JWT generation/verification, password hashing
- **Repositories**: UserRepository and TokenRepository
- **Middleware**: requireAuth, checkRateLimit, requireAdmin
- **Endpoints**: /api/auth/* (register, login, refresh, logout, me)
- **Protected routes**: Search, Chat, Ingest endpoints now require auth
- **Rate limiting**: 10 queries/day for free tier, unlimited for premium

## Testing

Manual testing completed:
- [x] User registration works
- [x] Login returns valid JWT
- [x] Protected endpoints require token
- [x] Rate limiting enforces 10/day limit for free users
- [x] Token refresh flow works
- [x] Logout revokes tokens

## Related Issues

Closes #29

## Next Steps

- Frontend integration (#12)
- Stripe subscription system (#21)
- Admin dashboard enhancements

🤖 Generated with [Claude Code](https://claude.com/claude-code)" \
  --base main
```

---

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution**: Drop and recreate tables:

```sql
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_tier CASCADE;

-- Then re-run migration
```

### Issue: "JWT_SECRET not defined"

**Solution**: Make sure `backend/.env` has `JWT_SECRET` with at least 32 characters.

### Issue: bcrypt errors on Apple Silicon

**Solution**: Reinstall bcrypt:

```bash
cd backend
pnpm remove bcrypt
pnpm add bcrypt
```

### Issue: Supabase connection fails

**Solution**: Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

---

## Next Steps After Completion

1. **Test with Frontend** - Integrate auth with Next.js frontend (#12)
2. **Add Stripe** - Implement subscription system (#21)
3. **Batch Ingest PDFs** - Download remaining 18 PDFs
4. **Admin Dashboard** - Build monitoring UI

---

## Summary

This guide has walked through:

✅ Database migration for users and tokens
✅ JWT utilities for token management
✅ Authentication middleware
✅ Auth endpoints (register, login, refresh, logout, me)
✅ Rate limiting per user tier
✅ Protected endpoints
✅ Testing and documentation

**Estimated completion time**: 2-3 days

**Status**: Ready for manual implementation

---

**Questions or issues?** Check Issue #29 for updates.

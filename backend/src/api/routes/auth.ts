import express, { Request, Response, NextFunction, Router } from 'express';
import { Logger } from '@ticobot/shared';
import { validatePasswordStrength } from '../../auth/password-validator.js';
import { hashPassword, verifyPassword } from '../../auth/password.utils.js';
import { generateTokenPair, verifyRefreshToken } from '../../auth/jwt.utils.js';
import { UserRepository } from '../../auth/user.repository.js';
import { TokenRepository } from '../../auth/token.repository.js';
import { checkLoginAttempts, recordFailedLogin, recordSuccessfulLogin } from '../../auth/login-limiter.js';
import { logEvent } from '../../auth/audit-logger.js';
import { createSupabaseClient } from '../../db/supabase.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const logger = new Logger('AuthRoutes');
const router: Router = express.Router();

// Initialize repositories
const supabase = createSupabaseClient();
const userRepo = new UserRepository(supabase);
const tokenRepo = new TokenRepository(supabase);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
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
 *                 minLength: 12
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    // Check if email already exists
    const existingUser = await userRepo.existsByEmail(email);
    if (existingUser) {
      await logEvent('auth', 'warning', 'Registration attempt with existing email', {
        email,
        ip: req.ip,
      });

      return res.status(409).json({
        error: 'Email already exists',
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password, { email });
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors,
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await userRepo.create({
      email,
      password_hash: passwordHash,
      name,
      tier: 'free',
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

    // Log successful registration
    await logEvent('auth', 'info', 'User registered successfully', {
      userId: user.id,
      email: user.email,
      tier: user.tier,
      ip: req.ip,
    });

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    await logEvent('auth', 'error', 'Registration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
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
 *       429:
 *         description: Too many failed attempts
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || 'unknown';

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Check for rate limiting BEFORE attempting login
    const rateLimitCheck = checkLoginAttempts(email, clientIp);
    if (!rateLimitCheck.allowed) {
      await logEvent('security', 'warning', 'Login blocked due to rate limiting', {
        email,
        ip: clientIp,
        reason: rateLimitCheck.reason,
      });

      return res.status(429).json({
        error: rateLimitCheck.reason,
        retryAfter: rateLimitCheck.retryAfter,
      });
    }

    // Find user
    const user = await userRepo.findByEmail(email);
    if (!user) {
      // Record failed attempt
      recordFailedLogin(email, clientIp);

      await logEvent('auth', 'warning', 'Login failed - user not found', {
        email,
        ip: clientIp,
      });

      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      // Record failed attempt
      recordFailedLogin(email, clientIp);

      await logEvent('auth', 'warning', 'Login failed - invalid password', {
        email,
        userId: user.id,
        ip: clientIp,
      });

      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.is_active) {
      await logEvent('auth', 'warning', 'Login attempt for deactivated account', {
        email,
        userId: user.id,
        ip: clientIp,
      });

      return res.status(403).json({
        error: 'Account is deactivated',
      });
    }

    // Record successful login (clears failed attempts)
    recordSuccessfulLogin(email, clientIp);

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

    // Log successful login
    await logEvent('auth', 'info', 'User logged in successfully', {
      userId: user.id,
      email: user.email,
      ip: clientIp,
    });

    logger.info(`User logged in: ${user.email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    logger.error('Login error:', error);
    await logEvent('auth', 'error', 'Login failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Authentication]
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
 *       403:
 *         description: Token reuse detected (security breach)
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const clientIp = req.ip || 'unknown';

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
      });
    }

    // Detect token reuse (security breach indicator)
    const reuseCheck = await tokenRepo.detectTokenReuse(refreshToken);
    if (reuseCheck.isReused && reuseCheck.userId) {
      // CRITICAL SECURITY EVENT: Token reuse detected
      await logEvent('security', 'critical', 'Refresh token reuse detected', {
        userId: reuseCheck.userId,
        ip: clientIp,
        action: 'Revoking all tokens for user',
      });

      // Revoke ALL tokens for this user as a security measure
      await tokenRepo.revokeAllForUser(reuseCheck.userId);

      logger.warn(`Token reuse detected for user ${reuseCheck.userId}. All tokens revoked.`);

      return res.status(403).json({
        error: 'Token reuse detected. All sessions have been terminated for security.',
      });
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      await logEvent('auth', 'warning', 'Invalid refresh token', {
        ip: clientIp,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return res.status(401).json({
        error: 'Invalid or expired refresh token',
      });
    }

    // Check if token exists in database and is not revoked
    const tokenRecord = await tokenRepo.findByToken(refreshToken);
    if (!tokenRecord) {
      await logEvent('security', 'warning', 'Refresh token not found in database', {
        userId: payload.userId,
        ip: clientIp,
      });

      return res.status(401).json({
        error: 'Invalid refresh token',
      });
    }

    // Check if token is expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      await logEvent('auth', 'info', 'Expired refresh token used', {
        userId: payload.userId,
        ip: clientIp,
      });

      return res.status(401).json({
        error: 'Refresh token has expired',
      });
    }

    // Get user data
    const user = await userRepo.findById(payload.userId);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account is deactivated',
      });
    }

    // Revoke old refresh token (token rotation)
    await tokenRepo.revoke(refreshToken);

    // Generate new token pair
    const newTokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      tier: user.tier,
    });

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await tokenRepo.create(user.id, newTokens.refreshToken, expiresAt);

    // Log token refresh
    await logEvent('auth', 'info', 'Token refreshed successfully', {
      userId: user.id,
      ip: clientIp,
    });

    logger.info(`Token refreshed for user: ${user.email}`);

    res.json({
      message: 'Token refreshed successfully',
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    await logEvent('auth', 'error', 'Token refresh failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [Authentication]
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
 *       400:
 *         description: Invalid request
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const clientIp = req.ip || 'unknown';

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
      });
    }

    // Revoke the refresh token
    await tokenRepo.revoke(refreshToken);

    // Try to get user info for logging (optional, may fail if token is invalid)
    try {
      const payload = verifyRefreshToken(refreshToken);
      await logEvent('auth', 'info', 'User logged out', {
        userId: payload.userId,
        ip: clientIp,
      });
      logger.info(`User logged out: ${payload.email}`);
    } catch {
      // If token verification fails, still log the logout
      await logEvent('auth', 'info', 'Logout with invalid token', {
        ip: clientIp,
      });
    }

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 *       401:
 *         description: Unauthorized
 */
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'User not found',
      });
    }

    // Get full user data
    const user = await userRepo.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Get query stats
    const stats = await userRepo.getQueryStats(req.user.userId);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
      },
      queryStats: {
        count: stats.count,
        limit: stats.limit,
        remaining: stats.remaining,
      },
    });
  } catch (error) {
    logger.error('Get user error:', error);
    next(error);
  }
});

export default router;

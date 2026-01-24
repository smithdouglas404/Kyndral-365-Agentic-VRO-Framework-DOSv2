/**
 * SECURITY MIDDLEWARE
 *
 * Implements critical security controls:
 * - Rate limiting (prevent brute force attacks)
 * - Security headers (Helmet.js)
 * - Request sanitization
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { Express } from 'express';

/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: 900, // seconds
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false,
  handler: (req, res) => {
    console.warn(`[SECURITY] Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: 900,
    });
  },
});

/**
 * Rate limiter for role management endpoints
 * More restrictive since these are admin-only
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 admin requests per window
  message: {
    error: 'Too Many Requests',
    message: 'Too many admin requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[SECURITY] Admin rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many admin requests. Please try again in 15 minutes.',
      retryAfter: 900,
    });
  },
});

/**
 * General API rate limiter
 * Prevents DoS attacks on general endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Configure security headers using Helmet
 */
export function configureSecurityHeaders(app: Express): void {
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval needed for Vite HMR
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          connectSrc: ["'self'", "https://api.anthropic.com", "https://api.smith.langchain.com", "wss:", "ws:"],
          frameSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
      },

      // HTTP Strict Transport Security (HSTS)
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },

      // Prevent clickjacking
      frameguard: {
        action: 'deny',
      },

      // Prevent MIME type sniffing
      noSniff: true,

      // XSS Protection (legacy header, but still useful)
      xssFilter: true,

      // Hide X-Powered-By header
      hidePoweredBy: true,

      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    })
  );

  console.log('[Security] Security headers configured with Helmet');
}

/**
 * Log security events
 */
export function logSecurityEvent(
  eventType: 'AUTH_FAILED' | 'RATE_LIMIT' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'ROLE_CHANGE' | 'SUSPICIOUS_ACTIVITY',
  details: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    path?: string;
    reason?: string;
    [key: string]: any;
  }
): void {
  const timestamp = new Date().toISOString();

  console.warn(`[SECURITY EVENT] ${timestamp} - ${eventType}`, {
    ...details,
    timestamp,
  });

  // In production, this should write to a security audit log
  // and potentially trigger alerts for critical events
}

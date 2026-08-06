import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter — 20 requests per minute per IP.
 * Applied to high-frequency import endpoints.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

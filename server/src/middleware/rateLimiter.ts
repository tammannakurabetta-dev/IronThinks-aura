import rateLimit from 'express-rate-limit';

// Master prompt requirement: Maximum 10 requests per 15-minute window per IP/user
export const advisoryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Advisory generation rate limit exceeded. You may generate a maximum of 10 crop advisories per 15-minute window to conserve quota.',
    retryAfterMinutes: 15
  },
  keyGenerator: (req) => {
    // Key by authenticated user ID if present, otherwise IP
    const userId = (req as any).user?.id;
    return userId || req.ip || 'anonymous';
  }
});

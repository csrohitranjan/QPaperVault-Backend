import rateLimit from 'express-rate-limit';

export const downloadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,              // max 5 requests per IP per minute
    message: "Too many download requests. Please try again later."
});

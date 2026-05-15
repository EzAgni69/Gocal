import './env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './config/logger';

import placesRoutes from './routes/placesRoutes';
import authRoutes from './routes/authRoutes';
import vendorRoutes from './routes/vendorRoutes';
import reportRoutes from './routes/reportRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import userRoutes from './routes/userRoutes';
import contactCardRequestRoutes from './routes/contactCardRequestRoutes';
import translationRoutes from './routes/translationRoutes';
import uploadRoutes from './routes/uploadRoutes';
import reviewRoutes from './routes/reviewRoutes';
import adminVendorRoutes from './routes/adminVendorRoutes';
import path from 'path';

const app = express();
const port = process.env.PORT || 3001;

// Trust the first proxy hop (Vercel / any reverse proxy).
// Required so express-rate-limit can read X-Forwarded-For without throwing
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR / ERR_ERL_FORWARDED_HEADER.
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "blob:", "*"],
        },
    },
}));

// ─── CORS (production-grade) ────────────────────────────────────
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,           // e.g. https://vanij-frontend.vercel.app
    'https://gocal.ai',
    'https://www.gocal.ai',
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        // Allow any Vercel preview deployment or Gocal domains
        if (/\.vercel\.app$/.test(origin) || /\.gocal\.ai$/.test(origin) || origin === 'https://gocal.ai') return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // Cache preflight for 24 hours
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to all /api routes
app.use('/api/', limiter);

// Request logger for debugging
app.use((req, res, next) => {
    logger.info(`[ALL REQ] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send('Gocal Backend Running');
});

// Google Places API routes
app.use('/api/places', placesRoutes);

// Auth routes
app.use('/api/auth', authRoutes);

// Vendor routes
app.use('/api/vendors', vendorRoutes);

// Admin vendor routes
app.use('/api/admin/vendors', adminVendorRoutes);

// Report routes
app.use('/api/reports', reportRoutes);

// Favorite routes
app.use('/api/favorites', favoriteRoutes);

// Wishlist routes
app.use('/api/wishlists', wishlistRoutes);

// User routes
app.use('/api/users', userRoutes);

// Contact card request routes
app.use('/api/card-requests', contactCardRequestRoutes);

// Translation routes
app.use('/api/translate', translationRoutes);

// File upload routes
app.use('/api/upload', uploadRoutes);

// Review routes
app.use('/api/reviews', reviewRoutes);

// Serve uploaded files statically (product images, etc.)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
    logger.error(`[GLOBAL ERR] ${err.message}`, { stack: err.stack, url: req.url, method: req.method });
    
    // Hide stack trace and exact error message in production
    if (process.env.NODE_ENV === 'production') {
        res.status(500).json({ error: 'Internal Server Error' });
    } else {
        res.status(500).json({ error: 'Internal Server Error', detail: err.message, stack: err.stack });
    }
});

// Export app for Vercel and testing
export default app;
export { app };

if (require.main === module) {
    app.listen(port, () => {
        logger.info(`Server running at http://localhost:${port}`);
    });
}


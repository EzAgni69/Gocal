"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("./env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("./config/logger");
const placesRoutes_1 = __importDefault(require("./routes/placesRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const vendorRoutes_1 = __importDefault(require("./routes/vendorRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const favoriteRoutes_1 = __importDefault(require("./routes/favoriteRoutes"));
const wishlistRoutes_1 = __importDefault(require("./routes/wishlistRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const contactCardRequestRoutes_1 = __importDefault(require("./routes/contactCardRequestRoutes"));
const translationRoutes_1 = __importDefault(require("./routes/translationRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const adminVendorRoutes_1 = __importDefault(require("./routes/adminVendorRoutes"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.PORT || 3001;
// Security headers
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: Object.assign(Object.assign({}, helmet_1.default.contentSecurityPolicy.getDefaultDirectives()), { "img-src": ["'self'", "data:", "blob:", "*"] }),
    },
}));
// Cross-Origin Resource Sharing
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
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
    logger_1.logger.info(`[ALL REQ] ${req.method} ${req.url}`);
    next();
});
app.get('/', (req, res) => {
    res.send('Gocal Backend Running');
});
// Google Places API routes
app.use('/api/places', placesRoutes_1.default);
// Auth routes
app.use('/api/auth', authRoutes_1.default);
// Vendor routes
app.use('/api/vendors', vendorRoutes_1.default);
// Admin vendor routes
app.use('/api/admin/vendors', adminVendorRoutes_1.default);
// Report routes
app.use('/api/reports', reportRoutes_1.default);
// Favorite routes
app.use('/api/favorites', favoriteRoutes_1.default);
// Wishlist routes
app.use('/api/wishlists', wishlistRoutes_1.default);
// User routes
app.use('/api/users', userRoutes_1.default);
// Contact card request routes
app.use('/api/card-requests', contactCardRequestRoutes_1.default);
// Translation routes
app.use('/api/translate', translationRoutes_1.default);
// File upload routes
app.use('/api/upload', uploadRoutes_1.default);
// Review routes
app.use('/api/reviews', reviewRoutes_1.default);
// Serve uploaded files statically (product images, etc.)
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Global Error Handler
app.use((err, req, res, next) => {
    logger_1.logger.error(`[GLOBAL ERR] ${err.message}`, { stack: err.stack, url: req.url, method: req.method });
    // Hide stack trace and exact error message in production
    if (process.env.NODE_ENV === 'production') {
        res.status(500).json({ error: 'Internal Server Error' });
    }
    else {
        res.status(500).json({ error: 'Internal Server Error', detail: err.message, stack: err.stack });
    }
});
if (require.main === module) {
    app.listen(port, () => {
        logger_1.logger.info(`Server running at http://localhost:${port}`);
    });
}

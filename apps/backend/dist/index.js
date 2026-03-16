"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const placesRoutes_1 = __importDefault(require("./routes/placesRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const vendorRoutes_1 = __importDefault(require("./routes/vendorRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const favoriteRoutes_1 = __importDefault(require("./routes/favoriteRoutes"));
const wishlistRoutes_1 = __importDefault(require("./routes/wishlistRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const contactCardRequestRoutes_1 = __importDefault(require("./routes/contactCardRequestRoutes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Request logger for debugging
const fs = require('fs');
app.use((req, res, next) => {
    const logMsg = `${new Date().toISOString()} [ALL REQ] ${req.method} ${req.url}`;
    console.log(logMsg);
    try {
        fs.appendFileSync('/Users/agni/Developer/Vanij/backend-debug.txt', logMsg + '\n');
    }
    catch (e) { }
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
// Global Error Handler
app.use((err, req, res, next) => {
    const errMsg = `${new Date().toISOString()} [GLOBAL ERR] ${err.stack || err.message || err}`;
    console.error(errMsg);
    try {
        fs.appendFileSync('/Users/agni/Developer/Vanij/backend-debug.txt', errMsg + '\n');
    }
    catch (e) { }
    res.status(500).json({ error: 'Internal Server Error', detail: err.message });
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

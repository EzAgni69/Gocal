"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const placesRoutes_1 = __importDefault(require("./routes/placesRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const vendorRoutes_1 = __importDefault(require("./routes/vendorRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const favoriteRoutes_1 = __importDefault(require("./routes/favoriteRoutes"));
const wishlistRoutes_1 = __importDefault(require("./routes/wishlistRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Vanij Backend Running');
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
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

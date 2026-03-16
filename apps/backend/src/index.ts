import './env';
import express from 'express';
import cors from 'cors';
import placesRoutes from './routes/placesRoutes';
import authRoutes from './routes/authRoutes';
import vendorRoutes from './routes/vendorRoutes';
import reportRoutes from './routes/reportRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import userRoutes from './routes/userRoutes';
import contactCardRequestRoutes from './routes/contactCardRequestRoutes';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request logger for debugging
const fs = require('fs');
app.use((req, res, next) => {
    const logMsg = `${new Date().toISOString()} [ALL REQ] ${req.method} ${req.url}`;
    // try { fs.appendFileSync('/Users/agni/Developer/Vanij/backend-debug.txt', logMsg + '\n'); } catch(e){}
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

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
    const errMsg = `${new Date().toISOString()} [GLOBAL ERR] ${err.stack || err.message || err}`;
    console.error(errMsg);
    try { fs.appendFileSync('/Users/agni/Developer/Vanij/backend-debug.txt', errMsg + '\n'); } catch(e){}
    res.status(500).json({ error: 'Internal Server Error', detail: err.message });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


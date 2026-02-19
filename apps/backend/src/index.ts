import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import placesRoutes from './routes/placesRoutes';
import authRoutes from './routes/authRoutes';
import vendorRoutes from './routes/vendorRoutes';
import reportRoutes from './routes/reportRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import wishlistRoutes from './routes/wishlistRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Vanij Backend Running');
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

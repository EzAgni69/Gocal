import { relations } from 'drizzle-orm';
import { users } from './users';
import { vendors } from './vendors';
import { categories } from './categories';
import { products } from './products';
import { galleryImages } from './gallery';
import { offers } from './offers';
import { favorites } from './favorites';
import { wishlists, wishlistItems } from './wishlists';
import { reviews } from './reviews';
import { reports } from './reports';
import { ads } from './ads';

// ── User Relations ──────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
    vendors: many(vendors),
    favorites: many(favorites),
    wishlists: many(wishlists),
    reviews: many(reviews),
    reports: many(reports),
}));

// ── Category Relations ──────────────────────────────────────────
export const categoriesRelations = relations(categories, ({ many }) => ({
    vendors: many(vendors),
}));

// ── Vendor Relations ────────────────────────────────────────────
export const vendorsRelations = relations(vendors, ({ one, many }) => ({
    owner: one(users, { fields: [vendors.ownerId], references: [users.id] }),
    category: one(categories, { fields: [vendors.categoryId], references: [categories.id] }),
    products: many(products),
    galleryImages: many(galleryImages),
    offers: many(offers),
    favorites: many(favorites),
    reviews: many(reviews),
    reports: many(reports),
    ads: many(ads),
}));

// ── Product Relations ───────────────────────────────────────────
export const productsRelations = relations(products, ({ one, many }) => ({
    vendor: one(vendors, { fields: [products.vendorId], references: [vendors.id] }),
    wishlistItems: many(wishlistItems),
}));

// ── Gallery Relations ───────────────────────────────────────────
export const galleryImagesRelations = relations(galleryImages, ({ one }) => ({
    vendor: one(vendors, { fields: [galleryImages.vendorId], references: [vendors.id] }),
}));

// ── Offer Relations ─────────────────────────────────────────────
export const offersRelations = relations(offers, ({ one }) => ({
    vendor: one(vendors, { fields: [offers.vendorId], references: [vendors.id] }),
}));

// ── Favorite Relations ──────────────────────────────────────────
export const favoritesRelations = relations(favorites, ({ one }) => ({
    user: one(users, { fields: [favorites.userId], references: [users.id] }),
    vendor: one(vendors, { fields: [favorites.vendorId], references: [vendors.id] }),
}));

// ── Wishlist Relations ──────────────────────────────────────────
export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
    user: one(users, { fields: [wishlists.userId], references: [users.id] }),
    items: many(wishlistItems),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
    wishlist: one(wishlists, { fields: [wishlistItems.wishlistId], references: [wishlists.id] }),
    product: one(products, { fields: [wishlistItems.productId], references: [products.id] }),
}));

// ── Review Relations ────────────────────────────────────────────
export const reviewsRelations = relations(reviews, ({ one }) => ({
    user: one(users, { fields: [reviews.userId], references: [users.id] }),
    vendor: one(vendors, { fields: [reviews.vendorId], references: [vendors.id] }),
}));

// ── Report Relations ────────────────────────────────────────────
export const reportsRelations = relations(reports, ({ one }) => ({
    reporter: one(users, { fields: [reports.reporterId], references: [users.id] }),
    vendor: one(vendors, { fields: [reports.vendorId], references: [vendors.id] }),
}));

// ── Ad Relations ────────────────────────────────────────────────
export const adsRelations = relations(ads, ({ one }) => ({
    vendor: one(vendors, { fields: [ads.vendorId], references: [vendors.id] }),
}));

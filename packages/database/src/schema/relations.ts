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
import { tags, vendorTags } from './tags';
import { homeCards } from './homeCards';
import { contactCardRequests } from './contactCardRequests';

// ── User Relations ──────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
    vendors: many(vendors),
    favorites: many(favorites),
    wishlists: many(wishlists),
    reviews: many(reviews),
    reports: many(reports),
    contactCardRequests: many(contactCardRequests),
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
    reviews: many(reviews),
    reports: many(reports),
    ads: many(ads),
    tags: many(vendorTags),
    homeCards: many(homeCards),
}));

// ── Product Relations ───────────────────────────────────────────
export const productsRelations = relations(products, ({ one }) => ({
    vendor: one(vendors, { fields: [products.vendorId], references: [vendors.id] }),
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
}));

// ── Wishlist Relations ──────────────────────────────────────────
export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
    user: one(users, { fields: [wishlists.userId], references: [users.id] }),
    items: many(wishlistItems),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
    wishlist: one(wishlists, { fields: [wishlistItems.wishlistId], references: [wishlists.id] }),
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

// ── Tag Relations ───────────────────────────────────────────────
export const tagsRelations = relations(tags, ({ many }) => ({
    vendors: many(vendorTags),
}));

export const vendorTagsRelations = relations(vendorTags, ({ one }) => ({
    vendor: one(vendors, { fields: [vendorTags.vendorId], references: [vendors.id] }),
    tag: one(tags, { fields: [vendorTags.tagId], references: [tags.id] }),
}));

// ── Home Card Relations ─────────────────────────────────────────
export const homeCardsRelations = relations(homeCards, ({ one }) => ({
    vendor: one(vendors, { fields: [homeCards.vendorId], references: [vendors.id] }),
}));

// ── Contact Card Request Relations ──────────────────────────────
export const contactCardRequestsRelations = relations(contactCardRequests, ({ one }) => ({
    requester: one(users, { fields: [contactCardRequests.requesterId], references: [users.id] }),
}));

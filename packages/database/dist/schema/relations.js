"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactCardRequestsRelations = exports.homeCardsRelations = exports.vendorTagsRelations = exports.tagsRelations = exports.adsRelations = exports.reportsRelations = exports.reviewsRelations = exports.wishlistItemsRelations = exports.wishlistsRelations = exports.favoritesRelations = exports.offersRelations = exports.galleryImagesRelations = exports.productsRelations = exports.vendorsRelations = exports.categoriesRelations = exports.usersRelations = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const users_1 = require("./users");
const vendors_1 = require("./vendors");
const categories_1 = require("./categories");
const products_1 = require("./products");
const gallery_1 = require("./gallery");
const offers_1 = require("./offers");
const favorites_1 = require("./favorites");
const wishlists_1 = require("./wishlists");
const reviews_1 = require("./reviews");
const reports_1 = require("./reports");
const ads_1 = require("./ads");
const tags_1 = require("./tags");
const homeCards_1 = require("./homeCards");
const contactCardRequests_1 = require("./contactCardRequests");
// ── User Relations ──────────────────────────────────────────────
exports.usersRelations = (0, drizzle_orm_1.relations)(users_1.users, ({ many }) => ({
    vendors: many(vendors_1.vendors),
    favorites: many(favorites_1.favorites),
    wishlists: many(wishlists_1.wishlists),
    reviews: many(reviews_1.reviews),
    reports: many(reports_1.reports),
    contactCardRequests: many(contactCardRequests_1.contactCardRequests),
}));
// ── Category Relations ──────────────────────────────────────────
exports.categoriesRelations = (0, drizzle_orm_1.relations)(categories_1.categories, ({ many }) => ({
    vendors: many(vendors_1.vendors),
}));
// ── Vendor Relations ────────────────────────────────────────────
exports.vendorsRelations = (0, drizzle_orm_1.relations)(vendors_1.vendors, ({ one, many }) => ({
    owner: one(users_1.users, { fields: [vendors_1.vendors.ownerId], references: [users_1.users.id] }),
    category: one(categories_1.categories, { fields: [vendors_1.vendors.categoryId], references: [categories_1.categories.id] }),
    products: many(products_1.products),
    galleryImages: many(gallery_1.galleryImages),
    offers: many(offers_1.offers),
    reviews: many(reviews_1.reviews),
    reports: many(reports_1.reports),
    ads: many(ads_1.ads),
    tags: many(tags_1.vendorTags),
    homeCards: many(homeCards_1.homeCards),
}));
// ── Product Relations ───────────────────────────────────────────
exports.productsRelations = (0, drizzle_orm_1.relations)(products_1.products, ({ one }) => ({
    vendor: one(vendors_1.vendors, { fields: [products_1.products.vendorId], references: [vendors_1.vendors.id] }),
}));
// ── Gallery Relations ───────────────────────────────────────────
exports.galleryImagesRelations = (0, drizzle_orm_1.relations)(gallery_1.galleryImages, ({ one }) => ({
    vendor: one(vendors_1.vendors, { fields: [gallery_1.galleryImages.vendorId], references: [vendors_1.vendors.id] }),
}));
// ── Offer Relations ─────────────────────────────────────────────
exports.offersRelations = (0, drizzle_orm_1.relations)(offers_1.offers, ({ one }) => ({
    vendor: one(vendors_1.vendors, { fields: [offers_1.offers.vendorId], references: [vendors_1.vendors.id] }),
}));
// ── Favorite Relations ──────────────────────────────────────────
exports.favoritesRelations = (0, drizzle_orm_1.relations)(favorites_1.favorites, ({ one }) => ({
    user: one(users_1.users, { fields: [favorites_1.favorites.userId], references: [users_1.users.id] }),
}));
// ── Wishlist Relations ──────────────────────────────────────────
exports.wishlistsRelations = (0, drizzle_orm_1.relations)(wishlists_1.wishlists, ({ one, many }) => ({
    user: one(users_1.users, { fields: [wishlists_1.wishlists.userId], references: [users_1.users.id] }),
    items: many(wishlists_1.wishlistItems),
}));
exports.wishlistItemsRelations = (0, drizzle_orm_1.relations)(wishlists_1.wishlistItems, ({ one }) => ({
    wishlist: one(wishlists_1.wishlists, { fields: [wishlists_1.wishlistItems.wishlistId], references: [wishlists_1.wishlists.id] }),
}));
// ── Review Relations ────────────────────────────────────────────
exports.reviewsRelations = (0, drizzle_orm_1.relations)(reviews_1.reviews, ({ one }) => ({
    user: one(users_1.users, { fields: [reviews_1.reviews.userId], references: [users_1.users.id] }),
    vendor: one(vendors_1.vendors, { fields: [reviews_1.reviews.vendorId], references: [vendors_1.vendors.id] }),
}));
// ── Report Relations ────────────────────────────────────────────
exports.reportsRelations = (0, drizzle_orm_1.relations)(reports_1.reports, ({ one }) => ({
    reporter: one(users_1.users, { fields: [reports_1.reports.reporterId], references: [users_1.users.id] }),
    vendor: one(vendors_1.vendors, { fields: [reports_1.reports.vendorId], references: [vendors_1.vendors.id] }),
}));
// ── Ad Relations ────────────────────────────────────────────────
exports.adsRelations = (0, drizzle_orm_1.relations)(ads_1.ads, ({ one }) => ({
    vendor: one(vendors_1.vendors, { fields: [ads_1.ads.vendorId], references: [vendors_1.vendors.id] }),
}));
// ── Tag Relations ───────────────────────────────────────────────
exports.tagsRelations = (0, drizzle_orm_1.relations)(tags_1.tags, ({ many }) => ({
    vendors: many(tags_1.vendorTags),
}));
exports.vendorTagsRelations = (0, drizzle_orm_1.relations)(tags_1.vendorTags, ({ one }) => ({
    vendor: one(vendors_1.vendors, { fields: [tags_1.vendorTags.vendorId], references: [vendors_1.vendors.id] }),
    tag: one(tags_1.tags, { fields: [tags_1.vendorTags.tagId], references: [tags_1.tags.id] }),
}));
// ── Home Card Relations ─────────────────────────────────────────
exports.homeCardsRelations = (0, drizzle_orm_1.relations)(homeCards_1.homeCards, ({ one }) => ({
    vendor: one(vendors_1.vendors, { fields: [homeCards_1.homeCards.vendorId], references: [vendors_1.vendors.id] }),
}));
// ── Contact Card Request Relations ──────────────────────────────
exports.contactCardRequestsRelations = (0, drizzle_orm_1.relations)(contactCardRequests_1.contactCardRequests, ({ one }) => ({
    requester: one(users_1.users, { fields: [contactCardRequests_1.contactCardRequests.requesterId], references: [users_1.users.id] }),
}));

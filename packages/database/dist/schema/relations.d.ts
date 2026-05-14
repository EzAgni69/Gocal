export declare const usersRelations: import("drizzle-orm").Relations<"users", {
    vendors: import("drizzle-orm").Many<"vendors">;
    favorites: import("drizzle-orm").Many<"favorites">;
    wishlists: import("drizzle-orm").Many<"wishlists">;
    reviews: import("drizzle-orm").Many<"reviews">;
    reports: import("drizzle-orm").Many<"reports">;
    contactCardRequests: import("drizzle-orm").Many<"contact_card_requests">;
}>;
export declare const categoriesRelations: import("drizzle-orm").Relations<"categories", {
    vendors: import("drizzle-orm").Many<"vendors">;
}>;
export declare const vendorsRelations: import("drizzle-orm").Relations<"vendors", {
    owner: import("drizzle-orm").One<"users", true>;
    category: import("drizzle-orm").One<"categories", false>;
    products: import("drizzle-orm").Many<"products">;
    galleryImages: import("drizzle-orm").Many<"gallery_images">;
    offers: import("drizzle-orm").Many<"offers">;
    reviews: import("drizzle-orm").Many<"reviews">;
    reports: import("drizzle-orm").Many<"reports">;
    ads: import("drizzle-orm").Many<"ads">;
    tags: import("drizzle-orm").Many<"vendor_tags">;
    homeCards: import("drizzle-orm").Many<"home_cards">;
}>;
export declare const productsRelations: import("drizzle-orm").Relations<"products", {
    vendor: import("drizzle-orm").One<"vendors", true>;
}>;
export declare const galleryImagesRelations: import("drizzle-orm").Relations<"gallery_images", {
    vendor: import("drizzle-orm").One<"vendors", true>;
}>;
export declare const offersRelations: import("drizzle-orm").Relations<"offers", {
    vendor: import("drizzle-orm").One<"vendors", true>;
}>;
export declare const favoritesRelations: import("drizzle-orm").Relations<"favorites", {
    user: import("drizzle-orm").One<"users", true>;
}>;
export declare const wishlistsRelations: import("drizzle-orm").Relations<"wishlists", {
    user: import("drizzle-orm").One<"users", true>;
    items: import("drizzle-orm").Many<"wishlist_items">;
}>;
export declare const wishlistItemsRelations: import("drizzle-orm").Relations<"wishlist_items", {
    wishlist: import("drizzle-orm").One<"wishlists", true>;
}>;
export declare const reviewsRelations: import("drizzle-orm").Relations<"reviews", {
    user: import("drizzle-orm").One<"users", true>;
    vendor: import("drizzle-orm").One<"vendors", true>;
}>;
export declare const reportsRelations: import("drizzle-orm").Relations<"reports", {
    reporter: import("drizzle-orm").One<"users", true>;
    vendor: import("drizzle-orm").One<"vendors", true>;
}>;
export declare const adsRelations: import("drizzle-orm").Relations<"ads", {
    vendor: import("drizzle-orm").One<"vendors", false>;
}>;
export declare const tagsRelations: import("drizzle-orm").Relations<"tags", {
    vendors: import("drizzle-orm").Many<"vendor_tags">;
}>;
export declare const vendorTagsRelations: import("drizzle-orm").Relations<"vendor_tags", {
    vendor: import("drizzle-orm").One<"vendors", true>;
    tag: import("drizzle-orm").One<"tags", true>;
}>;
export declare const homeCardsRelations: import("drizzle-orm").Relations<"home_cards", {
    vendor: import("drizzle-orm").One<"vendors", true>;
}>;
export declare const contactCardRequestsRelations: import("drizzle-orm").Relations<"contact_card_requests", {
    requester: import("drizzle-orm").One<"users", true>;
}>;

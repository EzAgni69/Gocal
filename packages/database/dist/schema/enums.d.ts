export declare const userRoleEnum: import("drizzle-orm/pg-core").PgEnum<["CONSUMER", "VENDOR", "ADMIN", "SUPER_ADMIN"]>;
export declare const reportReasonEnum: import("drizzle-orm/pg-core").PgEnum<["FRAUD", "SPAM", "INCORRECT_INFO", "OFFENSIVE"]>;
export declare const reportStatusEnum: import("drizzle-orm/pg-core").PgEnum<["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]>;
export declare const adTypeEnum: import("drizzle-orm/pg-core").PgEnum<["SYSTEM", "VENDOR_PROMO"]>;
export declare const languageEnum: import("drizzle-orm/pg-core").PgEnum<["en", "hi", "gu"]>;
export declare const cardRequestStatusEnum: import("drizzle-orm/pg-core").PgEnum<["PENDING", "APPROVED", "REJECTED"]>;
export declare const cardRequestRejectionReasonEnum: import("drizzle-orm/pg-core").PgEnum<["INCOMPLETE_INFO", "DUPLICATE", "INAPPROPRIATE", "INVALID_BUSINESS", "OTHER"]>;

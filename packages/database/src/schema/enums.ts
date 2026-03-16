import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
    'CONSUMER',
    'VENDOR',
    'ADMIN',
    'SUPER_ADMIN',
]);

export const reportReasonEnum = pgEnum('report_reason', [
    'FRAUD',
    'SPAM',
    'INCORRECT_INFO',
    'OFFENSIVE',
]);

export const reportStatusEnum = pgEnum('report_status', [
    'PENDING',
    'UNDER_REVIEW',
    'RESOLVED',
    'DISMISSED',
]);

export const adTypeEnum = pgEnum('ad_type', [
    'SYSTEM',
    'VENDOR_PROMO',
]);

export const languageEnum = pgEnum('language', [
    'en',
    'hi',
    'gu',
]);

export const cardRequestStatusEnum = pgEnum('card_request_status', [
    'PENDING',
    'APPROVED',
    'REJECTED',
]);

export const cardRequestRejectionReasonEnum = pgEnum('card_request_rejection_reason', [
    'INCOMPLETE_INFO',
    'DUPLICATE',
    'INAPPROPRIATE',
    'INVALID_BUSINESS',
    'OTHER',
]);

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

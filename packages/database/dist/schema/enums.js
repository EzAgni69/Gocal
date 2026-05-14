"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardRequestRejectionReasonEnum = exports.cardRequestStatusEnum = exports.languageEnum = exports.adTypeEnum = exports.reportStatusEnum = exports.reportReasonEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', [
    'CONSUMER',
    'VENDOR',
    'ADMIN',
    'SUPER_ADMIN',
]);
exports.reportReasonEnum = (0, pg_core_1.pgEnum)('report_reason', [
    'FRAUD',
    'SPAM',
    'INCORRECT_INFO',
    'OFFENSIVE',
]);
exports.reportStatusEnum = (0, pg_core_1.pgEnum)('report_status', [
    'PENDING',
    'UNDER_REVIEW',
    'RESOLVED',
    'DISMISSED',
]);
exports.adTypeEnum = (0, pg_core_1.pgEnum)('ad_type', [
    'SYSTEM',
    'VENDOR_PROMO',
]);
exports.languageEnum = (0, pg_core_1.pgEnum)('language', [
    'en',
    'hi',
    'gu',
]);
exports.cardRequestStatusEnum = (0, pg_core_1.pgEnum)('card_request_status', [
    'PENDING',
    'APPROVED',
    'REJECTED',
]);
exports.cardRequestRejectionReasonEnum = (0, pg_core_1.pgEnum)('card_request_rejection_reason', [
    'INCOMPLETE_INFO',
    'DUPLICATE',
    'INAPPROPRIATE',
    'INVALID_BUSINESS',
    'OTHER',
]);

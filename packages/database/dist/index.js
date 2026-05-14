"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotNull = exports.isNull = exports.inArray = exports.desc = exports.asc = exports.sql = exports.like = exports.ilike = exports.not = exports.or = exports.and = exports.lte = exports.lt = exports.gte = exports.gt = exports.ne = exports.eq = exports.migrationClient = exports.db = void 0;
// Database package - gocal.co
var db_1 = require("./db");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return db_1.db; } });
Object.defineProperty(exports, "migrationClient", { enumerable: true, get: function () { return db_1.migrationClient; } });
__exportStar(require("./schema"), exports);
// Re-export drizzle-orm operators to avoid duplicate package issues
var drizzle_orm_1 = require("drizzle-orm");
Object.defineProperty(exports, "eq", { enumerable: true, get: function () { return drizzle_orm_1.eq; } });
Object.defineProperty(exports, "ne", { enumerable: true, get: function () { return drizzle_orm_1.ne; } });
Object.defineProperty(exports, "gt", { enumerable: true, get: function () { return drizzle_orm_1.gt; } });
Object.defineProperty(exports, "gte", { enumerable: true, get: function () { return drizzle_orm_1.gte; } });
Object.defineProperty(exports, "lt", { enumerable: true, get: function () { return drizzle_orm_1.lt; } });
Object.defineProperty(exports, "lte", { enumerable: true, get: function () { return drizzle_orm_1.lte; } });
Object.defineProperty(exports, "and", { enumerable: true, get: function () { return drizzle_orm_1.and; } });
Object.defineProperty(exports, "or", { enumerable: true, get: function () { return drizzle_orm_1.or; } });
Object.defineProperty(exports, "not", { enumerable: true, get: function () { return drizzle_orm_1.not; } });
Object.defineProperty(exports, "ilike", { enumerable: true, get: function () { return drizzle_orm_1.ilike; } });
Object.defineProperty(exports, "like", { enumerable: true, get: function () { return drizzle_orm_1.like; } });
Object.defineProperty(exports, "sql", { enumerable: true, get: function () { return drizzle_orm_1.sql; } });
Object.defineProperty(exports, "asc", { enumerable: true, get: function () { return drizzle_orm_1.asc; } });
Object.defineProperty(exports, "desc", { enumerable: true, get: function () { return drizzle_orm_1.desc; } });
Object.defineProperty(exports, "inArray", { enumerable: true, get: function () { return drizzle_orm_1.inArray; } });
Object.defineProperty(exports, "isNull", { enumerable: true, get: function () { return drizzle_orm_1.isNull; } });
Object.defineProperty(exports, "isNotNull", { enumerable: true, get: function () { return drizzle_orm_1.isNotNull; } });

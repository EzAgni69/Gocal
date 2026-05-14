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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationClient = exports.db = void 0;
const neon_http_1 = require("drizzle-orm/neon-http");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const serverless_1 = require("@neondatabase/serverless");
const postgres_1 = __importDefault(require("postgres"));
const schema = __importStar(require("./schema"));
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:password@localhost:5434/vanij_db';
const isNeon = connectionString.includes('neon.tech');
/**
 * Stable Database Client Singleton
 */
const globalForDb = global;
function createDb() {
    if (isNeon) {
        const client = (0, serverless_1.neon)(connectionString);
        return (0, neon_http_1.drizzle)(client, { schema });
    }
    else {
        const queryClient = (0, postgres_1.default)(connectionString, {
            max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : undefined,
            onnotice: () => { },
        });
        return (0, postgres_js_1.drizzle)(queryClient, { schema });
    }
}
exports.db = (_a = globalForDb.db) !== null && _a !== void 0 ? _a : createDb();
if (process.env.NODE_ENV !== 'production') {
    globalForDb.db = exports.db;
}
// Export for migration scripts
exports.migrationClient = isNeon ? null : (0, postgres_1.default)(connectionString, { max: 1 });

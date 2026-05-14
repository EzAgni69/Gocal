"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Test script to verify database connection and PostGIS support.
 * Run with: npx tsx src/test-connection.ts
 */
const dotenv_1 = __importDefault(require("dotenv"));
// Load env from backend
dotenv_1.default.config({ path: '../../apps/backend/.env' });
const db_1 = require("./db");
const drizzle_orm_1 = require("drizzle-orm");
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        console.log('🔌 Testing database connection...\n');
        try {
            // Test basic connectivity
            const result = yield db_1.db.execute((0, drizzle_orm_1.sql) `SELECT NOW() as current_time, version() as pg_version`);
            console.log('✅ Connected to PostgreSQL');
            const rows = result.rows || result;
            console.log(`   Time: ${(_a = rows[0]) === null || _a === void 0 ? void 0 : _a.current_time}`);
            console.log(`   Version: ${(_c = (_b = rows[0]) === null || _b === void 0 ? void 0 : _b.pg_version) === null || _c === void 0 ? void 0 : _c.split(' ').slice(0, 2).join(' ')}\n`);
            // Test PostGIS
            try {
                const postgis = yield db_1.db.execute((0, drizzle_orm_1.sql) `SELECT PostGIS_Version() as postgis_version`);
                const postgisRows = postgis.rows || postgis;
                console.log(`✅ PostGIS enabled: v${(_d = postgisRows[0]) === null || _d === void 0 ? void 0 : _d.postgis_version}`);
            }
            catch (_e) {
                console.log('⚠️  PostGIS not enabled. Run: CREATE EXTENSION IF NOT EXISTS postgis;');
            }
            // List existing tables
            const tablesResult = yield db_1.db.execute((0, drizzle_orm_1.sql) `
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
            const tables = tablesResult.rows || tablesResult;
            console.log(`\n📋 Tables in database: ${tables.length}`);
            tables.forEach((t) => console.log(`   - ${t.table_name}`));
            console.log('\n✅ Database connection test passed!');
        }
        catch (error) {
            console.error('❌ Connection failed:', error.message);
            console.error('\n💡 Make sure PostgreSQL is running and DATABASE_URL is set correctly:');
            console.error('   DATABASE_URL=postgresql://user:pass@localhost:5432/vanij_db');
        }
        process.exit(0);
    });
}
testConnection();

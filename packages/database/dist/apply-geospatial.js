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
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const drizzle_orm_1 = require("drizzle-orm");
const schema = __importStar(require("./schema"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5434/gocal_db';
const migrationClient = (0, postgres_1.default)(connectionString, { max: 1 });
const db = (0, postgres_js_1.drizzle)(migrationClient, { schema });
function applyGeospatial() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Applying Earthdistance Extensions...");
            yield db.execute((0, drizzle_orm_1.sql) `CREATE EXTENSION IF NOT EXISTS cube;`);
            yield db.execute((0, drizzle_orm_1.sql) `CREATE EXTENSION IF NOT EXISTS earthdistance;`);
            console.log("Extensions applied successfully.");
            console.log("Creating GiST index on vendors for location queries...");
            // Casting longitude and latitude on the fly for the index.
            yield db.execute((0, drizzle_orm_1.sql) `
            CREATE INDEX IF NOT EXISTS idx_vendors_location 
            ON vendors USING gist (ll_to_earth(CAST(latitude AS DOUBLE PRECISION), CAST(longitude AS DOUBLE PRECISION)));
        `);
            console.log("Index idx_vendors_location created successfully.");
            process.exit(0);
        }
        catch (e) {
            console.error("Failed to apply geospatial setups:", e);
            process.exit(1);
        }
    });
}
applyGeospatial();

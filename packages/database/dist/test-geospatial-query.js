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
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
function testDistance() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Testing earth_distance execution...");
            const result = yield index_1.db.execute((0, index_1.sql) `
            SELECT 
                id, 
                name, 
                latitude, 
                longitude,
                earth_distance(
                    ll_to_earth(CAST(latitude AS DOUBLE PRECISION), CAST(longitude AS DOUBLE PRECISION)),
                    ll_to_earth(22.3072, 73.1812)
                ) as test_distance
            FROM vendors
            WHERE latitude IS NOT NULL 
              AND longitude IS NOT NULL
            LIMIT 5;
        `);
            console.dir(result, { depth: null });
            process.exit(0);
        }
        catch (e) {
            console.error("Test failed", e);
            process.exit(1);
        }
    });
}
testDistance();

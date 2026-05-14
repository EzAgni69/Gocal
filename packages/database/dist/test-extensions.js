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
function check() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Trying to enable postgis...");
            yield index_1.db.execute((0, index_1.sql) `CREATE EXTENSION IF NOT EXISTS postgis;`);
            console.log("Successfully enabled postgis!");
        }
        catch (e) {
            console.error("Failed to enable postgis:", e.message);
            try {
                console.log("\nTrying to enable earthdistance...");
                yield index_1.db.execute((0, index_1.sql) `CREATE EXTENSION IF NOT EXISTS cube;`);
                yield index_1.db.execute((0, index_1.sql) `CREATE EXTENSION IF NOT EXISTS earthdistance;`);
                console.log("Successfully enabled earthdistance!");
            }
            catch (e2) {
                console.error("Failed to enable earthdistance:", e2.message);
            }
        }
        process.exit(0);
    });
}
check();

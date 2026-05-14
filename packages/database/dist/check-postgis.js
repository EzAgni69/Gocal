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
            const result = yield index_1.db.execute((0, index_1.sql) `SELECT extname FROM pg_extension WHERE extname = 'postgis'`);
            if (result.length > 0) {
                console.log("PostGIS is installed!");
            }
            else {
                console.log("PostGIS is NOT installed.");
            }
            process.exit(0);
        }
        catch (e) {
            console.error("Error", e);
            process.exit(1);
        }
    });
}
check();

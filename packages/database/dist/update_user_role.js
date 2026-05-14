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
const db_1 = require("./db");
const users_1 = require("./schema/users");
const drizzle_orm_1 = require("drizzle-orm");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const emails = ['mehtanishant1030@gmail.com', 'mehtanishant3010@gmail.com'];
        for (const email of emails) {
            console.log(`Updating role for ${email} to SUPER_ADMIN...`);
            try {
                const updatedUsers = yield db_1.db.update(users_1.users)
                    .set({ role: 'SUPER_ADMIN' })
                    .where((0, drizzle_orm_1.eq)(users_1.users.email, email))
                    .returning();
                if (updatedUsers.length > 0) {
                    console.log('Successfully updated user:', updatedUsers[0].email, 'New Role:', updatedUsers[0].role);
                }
                else {
                    console.log('User not found with email:', email);
                }
            }
            catch (error) {
                console.error(`Error updating user ${email}:`, error);
            }
        }
        process.exit(0);
    });
}
main();

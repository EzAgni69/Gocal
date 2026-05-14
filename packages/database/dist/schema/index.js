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
// Schema barrel export
__exportStar(require("./enums"), exports);
__exportStar(require("./users"), exports);
__exportStar(require("./categories"), exports);
__exportStar(require("./vendors"), exports);
__exportStar(require("./products"), exports);
__exportStar(require("./gallery"), exports);
__exportStar(require("./offers"), exports);
__exportStar(require("./favorites"), exports);
__exportStar(require("./wishlists"), exports);
__exportStar(require("./translations"), exports);
__exportStar(require("./reviews"), exports);
__exportStar(require("./reports"), exports);
__exportStar(require("./ads"), exports);
__exportStar(require("./tags"), exports);
__exportStar(require("./homeCards"), exports);
__exportStar(require("./contactCardRequests"), exports);
__exportStar(require("./relations"), exports);

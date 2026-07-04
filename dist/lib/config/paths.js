"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentNamePath = exports.authPath = exports.accountsDir = exports.codexDir = void 0;
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
exports.codexDir = node_path_1.default.join(node_os_1.default.homedir(), ".codex");
exports.accountsDir = node_path_1.default.join(exports.codexDir, "accounts");
exports.authPath = node_path_1.default.join(exports.codexDir, "auth.json");
exports.currentNamePath = node_path_1.default.join(exports.codexDir, "current");

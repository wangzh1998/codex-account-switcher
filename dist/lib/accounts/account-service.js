"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const paths_1 = require("../config/paths");
const errors_1 = require("./errors");
const ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const AUTH_ACCOUNT_FIELD = "codex_auth_account";
class AccountService {
    async listAccountNames() {
        if (!(await this.pathExists(paths_1.accountsDir))) {
            return [];
        }
        const entries = await promises_1.default.readdir(paths_1.accountsDir, { withFileTypes: true });
        return entries
            .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
            .map((entry) => entry.name.replace(/\.json$/i, ""))
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    }
    async getCurrentAccountName() {
        const authName = await this.readAuthAccountName();
        if (authName)
            return authName;
        const currentName = await this.readCurrentNameFile();
        if (currentName)
            return currentName;
        if (!(await this.pathExists(paths_1.authPath)))
            return null;
        const stat = await promises_1.default.lstat(paths_1.authPath);
        if (!stat.isSymbolicLink())
            return null;
        const rawTarget = await promises_1.default.readlink(paths_1.authPath);
        const resolvedTarget = node_path_1.default.resolve(node_path_1.default.dirname(paths_1.authPath), rawTarget);
        const accountsRoot = node_path_1.default.resolve(paths_1.accountsDir);
        const relative = node_path_1.default.relative(accountsRoot, resolvedTarget);
        if (relative.startsWith(".."))
            return null;
        const base = node_path_1.default.basename(resolvedTarget);
        return base.replace(/\.json$/i, "");
    }
    async saveAccount(rawName) {
        const name = this.normalizeAccountName(rawName);
        await this.ensureAuthFileExists();
        await this.ensureDir(paths_1.accountsDir);
        const destination = this.accountFilePath(name);
        await this.writeAuthAccountName(name);
        await this.backupAccountIfExists(name, destination);
        await promises_1.default.copyFile(paths_1.authPath, destination);
        await this.restrictPermissions(destination);
        await this.writeCurrentName(name);
        return name;
    }
    async createAccount(rawName) {
        const name = this.normalizeAccountName(rawName);
        await this.ensureDir(paths_1.accountsDir);
        await this.ensureDir(paths_1.codexDir);
        const destination = this.accountFilePath(name);
        if (await this.pathExists(destination)) {
            throw new errors_1.AccountAlreadyExistsError(name);
        }
        await this.syncCurrentAuthSnapshot();
        if (await this.pathExists(paths_1.authPath)) {
            await promises_1.default.copyFile(paths_1.authPath, destination);
        }
        else {
            await promises_1.default.writeFile(destination, "{}\n", "utf8");
        }
        await this.writeAccountNameToFile(destination, name);
        await this.replaceWithCopy(destination, paths_1.authPath);
        await this.writeCurrentName(name);
        return name;
    }
    async useAccount(rawName) {
        const name = this.normalizeAccountName(rawName);
        const source = this.accountFilePath(name);
        if (!(await this.pathExists(source))) {
            throw new errors_1.AccountNotFoundError(name);
        }
        await this.syncCurrentAuthSnapshot();
        await this.ensureDir(paths_1.accountsDir);
        await this.ensureDir(paths_1.codexDir);
        await this.replaceWithCopy(source, paths_1.authPath);
        await this.writeAuthAccountName(name);
        await this.writeAccountNameToFile(source, name);
        await this.writeCurrentName(name);
        return name;
    }
    async markCurrentAccount(rawName) {
        const name = this.normalizeAccountName(rawName);
        const source = this.accountFilePath(name);
        if (!(await this.pathExists(source))) {
            throw new errors_1.AccountNotFoundError(name);
        }
        await this.writeAuthAccountName(name);
        await this.writeCurrentName(name);
        return name;
    }
    accountFilePath(name) {
        return node_path_1.default.join(paths_1.accountsDir, `${name}.json`);
    }
    normalizeAccountName(rawName) {
        if (typeof rawName !== "string") {
            throw new errors_1.InvalidAccountNameError();
        }
        const trimmed = rawName.trim();
        if (!trimmed.length) {
            throw new errors_1.InvalidAccountNameError();
        }
        const withoutExtension = trimmed.replace(/\.json$/i, "");
        if (!ACCOUNT_NAME_PATTERN.test(withoutExtension)) {
            throw new errors_1.InvalidAccountNameError();
        }
        return withoutExtension;
    }
    async ensureAuthFileExists() {
        if (!(await this.pathExists(paths_1.authPath))) {
            throw new errors_1.AuthFileMissingError(paths_1.authPath);
        }
    }
    async ensureDir(dirPath) {
        await promises_1.default.mkdir(dirPath, { recursive: true });
    }
    async syncCurrentAuthSnapshot() {
        const currentName = await this.readAuthAccountName();
        if (!currentName || !(await this.pathExists(paths_1.authPath))) {
            return null;
        }
        await this.ensureDir(paths_1.accountsDir);
        const destination = this.accountFilePath(currentName);
        if ((await this.pathsReferToSameFile(paths_1.authPath, destination)) ||
            (await this.filesHaveSameContents(paths_1.authPath, destination))) {
            return null;
        }
        await this.backupAccountIfExists(currentName, destination);
        await promises_1.default.copyFile(paths_1.authPath, destination);
        await this.restrictPermissions(destination);
        return currentName;
    }
    async readAuthAccountName() {
        try {
            const contents = await promises_1.default.readFile(paths_1.authPath, "utf8");
            const parsed = JSON.parse(contents);
            const rawName = parsed === null || parsed === void 0 ? void 0 : parsed[AUTH_ACCOUNT_FIELD];
            if (typeof rawName !== "string" || !rawName.trim()) {
                return null;
            }
            return this.normalizeAccountName(rawName);
        }
        catch (error) {
            const err = error;
            if (err.code === "ENOENT" || error instanceof SyntaxError) {
                return null;
            }
            throw error;
        }
    }
    async writeAuthAccountName(name) {
        await this.writeAccountNameToFile(paths_1.authPath, name);
    }
    async writeAccountNameToFile(filePath, rawName) {
        const name = this.normalizeAccountName(rawName);
        const contents = await promises_1.default.readFile(filePath, "utf8");
        const parsed = JSON.parse(contents);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error(`Expected ${filePath} to contain a JSON object.`);
        }
        parsed[AUTH_ACCOUNT_FIELD] = name;
        await promises_1.default.writeFile(filePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
        await this.restrictPermissions(filePath);
    }
    async backupAccountIfExists(name, accountPath) {
        if (!(await this.pathExists(accountPath))) {
            return;
        }
        if (await this.filesHaveSameContents(paths_1.authPath, accountPath)) {
            return;
        }
        const backupsDir = node_path_1.default.join(paths_1.accountsDir, ".backups");
        await this.ensureDir(backupsDir);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = node_path_1.default.join(backupsDir, `${name}.${timestamp}.json`);
        await promises_1.default.copyFile(accountPath, backupPath);
        await this.restrictPermissions(backupPath);
    }
    async replaceWithCopy(source, destination) {
        const destinationIsSymlink = await this.isSymlink(destination);
        if (!destinationIsSymlink && (await this.pathsReferToSameFile(source, destination))) {
            return;
        }
        await this.removeIfExists(destination);
        await promises_1.default.copyFile(source, destination);
        await this.restrictPermissions(destination);
    }
    async pathsReferToSameFile(left, right) {
        try {
            const [leftStat, rightStat] = await Promise.all([promises_1.default.stat(left), promises_1.default.stat(right)]);
            return leftStat.dev === rightStat.dev && leftStat.ino === rightStat.ino;
        }
        catch (error) {
            const err = error;
            if (err.code === "ENOENT") {
                return false;
            }
            throw error;
        }
    }
    async filesHaveSameContents(left, right) {
        try {
            const [leftStat, rightStat] = await Promise.all([promises_1.default.stat(left), promises_1.default.stat(right)]);
            if (leftStat.size !== rightStat.size) {
                return false;
            }
            const [leftBuffer, rightBuffer] = await Promise.all([promises_1.default.readFile(left), promises_1.default.readFile(right)]);
            return leftBuffer.equals(rightBuffer);
        }
        catch (error) {
            const err = error;
            if (err.code === "ENOENT") {
                return false;
            }
            throw error;
        }
    }
    async isSymlink(targetPath) {
        try {
            const stat = await promises_1.default.lstat(targetPath);
            return stat.isSymbolicLink();
        }
        catch (error) {
            const err = error;
            if (err.code === "ENOENT") {
                return false;
            }
            throw error;
        }
    }
    async restrictPermissions(targetPath) {
        if (process.platform !== "win32") {
            await promises_1.default.chmod(targetPath, 0o600);
        }
    }
    async removeIfExists(target) {
        try {
            await promises_1.default.rm(target, { force: true });
        }
        catch (error) {
            const err = error;
            if (err.code !== "ENOENT") {
                throw error;
            }
        }
    }
    async writeCurrentName(name) {
        await this.ensureDir(paths_1.codexDir);
        await promises_1.default.writeFile(paths_1.currentNamePath, `${name}\n`, "utf8");
    }
    async readCurrentNameFile() {
        try {
            const contents = await promises_1.default.readFile(paths_1.currentNamePath, "utf8");
            const trimmed = contents.trim();
            return trimmed.length ? trimmed : null;
        }
        catch (error) {
            const err = error;
            if (err.code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }
    async pathExists(targetPath) {
        try {
            await promises_1.default.access(targetPath, node_fs_1.default.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.AccountService = AccountService;

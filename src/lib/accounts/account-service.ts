import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { accountsDir, authPath, codexDir, currentNamePath } from "../config/paths";
import {
  AccountAlreadyExistsError,
  AccountNotFoundError,
  AuthFileMissingError,
  InvalidAccountNameError,
} from "./errors";

const ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const AUTH_ACCOUNT_FIELD = "codex_auth_account";

export class AccountService {
  public async listAccountNames(): Promise<string[]> {
    if (!(await this.pathExists(accountsDir))) {
      return [];
    }

    const entries = await fsp.readdir(accountsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name.replace(/\.json$/i, ""))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  public async getCurrentAccountName(): Promise<string | null> {
    const authName = await this.getMarkedAccountName();
    if (authName) return authName;

    const currentName = await this.readCurrentNameFile();
    if (currentName) return currentName;

    if (!(await this.pathExists(authPath))) return null;

    const stat = await fsp.lstat(authPath);
    if (!stat.isSymbolicLink()) return null;

    const rawTarget = await fsp.readlink(authPath);
    const resolvedTarget = path.resolve(path.dirname(authPath), rawTarget);
    const accountsRoot = path.resolve(accountsDir);
    const relative = path.relative(accountsRoot, resolvedTarget);
    if (relative.startsWith("..")) return null;

    const base = path.basename(resolvedTarget);
    return base.replace(/\.json$/i, "");
  }

  public async saveAccount(rawName: string): Promise<string> {
    const name = this.normalizeAccountName(rawName);
    await this.ensureAuthFileExists();
    await this.ensureDir(accountsDir);
    const destination = this.accountFilePath(name);
    await this.writeAuthAccountName(name);
    await this.backupAccountIfExists(name, destination);
    await fsp.copyFile(authPath, destination);
    await this.restrictPermissions(destination);
    await this.writeCurrentName(name);
    return name;
  }

  public async createAccount(rawName: string): Promise<string> {
    const name = this.normalizeAccountName(rawName);
    await this.ensureDir(accountsDir);
    await this.ensureDir(codexDir);

    const destination = this.accountFilePath(name);
    if (await this.pathExists(destination)) {
      throw new AccountAlreadyExistsError(name);
    }

    await fsp.writeFile(destination, `${JSON.stringify({ [AUTH_ACCOUNT_FIELD]: name }, null, 2)}\n`, "utf8");
    await this.restrictPermissions(destination);
    await this.replaceWithCopy(destination, authPath);
    await this.writeCurrentName(name);
    return name;
  }

  public async useAccount(rawName: string): Promise<string> {
    const name = this.normalizeAccountName(rawName);
    const source = this.accountFilePath(name);

    if (!(await this.pathExists(source))) {
      throw new AccountNotFoundError(name);
    }

    await this.ensureDir(accountsDir);
    await this.ensureDir(codexDir);

    await this.replaceWithCopy(source, authPath);
    await this.writeAuthAccountName(name);
    await this.writeCurrentName(name);
    return name;
  }

  public async markCurrentAccount(rawName: string): Promise<string> {
    const name = this.normalizeAccountName(rawName);
    const source = this.accountFilePath(name);

    if (!(await this.pathExists(source))) {
      throw new AccountNotFoundError(name);
    }

    await this.writeAuthAccountName(name);
    await this.writeCurrentName(name);
    return name;
  }

  private accountFilePath(name: string): string {
    return path.join(accountsDir, `${name}.json`);
  }

  private normalizeAccountName(rawName: string | undefined): string {
    if (typeof rawName !== "string") {
      throw new InvalidAccountNameError();
    }

    const trimmed = rawName.trim();
    if (!trimmed.length) {
      throw new InvalidAccountNameError();
    }

    const withoutExtension = trimmed.replace(/\.json$/i, "");
    if (!ACCOUNT_NAME_PATTERN.test(withoutExtension)) {
      throw new InvalidAccountNameError();
    }

    return withoutExtension;
  }

  private async ensureAuthFileExists(): Promise<void> {
    if (!(await this.pathExists(authPath))) {
      throw new AuthFileMissingError(authPath);
    }
  }

  private async ensureDir(dirPath: string): Promise<void> {
    await fsp.mkdir(dirPath, { recursive: true });
  }

  public async getMarkedAccountName(): Promise<string | null> {
    try {
      const contents = await fsp.readFile(authPath, "utf8");
      const parsed = JSON.parse(contents) as Record<string, unknown> | null;
      const rawName = parsed?.[AUTH_ACCOUNT_FIELD];
      if (typeof rawName !== "string" || !rawName.trim()) {
        return null;
      }

      return this.normalizeAccountName(rawName);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT" || error instanceof SyntaxError) {
        return null;
      }

      throw error;
    }
  }

  private async writeAuthAccountName(name: string): Promise<void> {
    await this.writeAccountNameToFile(authPath, name);
  }

  private async writeAccountNameToFile(filePath: string, rawName: string): Promise<void> {
    const name = this.normalizeAccountName(rawName);
    const contents = await fsp.readFile(filePath, "utf8");
    const parsed = JSON.parse(contents) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`Expected ${filePath} to contain a JSON object.`);
    }

    (parsed as Record<string, unknown>)[AUTH_ACCOUNT_FIELD] = name;
    await fsp.writeFile(filePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    await this.restrictPermissions(filePath);
  }

  private async backupAccountIfExists(name: string, accountPath: string): Promise<void> {
    if (!(await this.pathExists(accountPath))) {
      return;
    }

    if (await this.filesHaveSameContents(authPath, accountPath)) {
      return;
    }

    const backupsDir = path.join(accountsDir, ".backups");
    await this.ensureDir(backupsDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupsDir, `${name}.${timestamp}.json`);
    await fsp.copyFile(accountPath, backupPath);
    await this.restrictPermissions(backupPath);
  }

  private async replaceWithCopy(source: string, destination: string): Promise<void> {
    const destinationIsSymlink = await this.isSymlink(destination);
    if (!destinationIsSymlink && (await this.pathsReferToSameFile(source, destination))) {
      return;
    }

    await this.removeIfExists(destination);
    await fsp.copyFile(source, destination);
    await this.restrictPermissions(destination);
  }

  private async pathsReferToSameFile(left: string, right: string): Promise<boolean> {
    try {
      const [leftStat, rightStat] = await Promise.all([fsp.stat(left), fsp.stat(right)]);
      return leftStat.dev === rightStat.dev && leftStat.ino === rightStat.ino;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        return false;
      }

      throw error;
    }
  }

  private async filesHaveSameContents(left: string, right: string): Promise<boolean> {
    try {
      const [leftStat, rightStat] = await Promise.all([fsp.stat(left), fsp.stat(right)]);
      if (leftStat.size !== rightStat.size) {
        return false;
      }

      const [leftBuffer, rightBuffer] = await Promise.all([fsp.readFile(left), fsp.readFile(right)]);
      return leftBuffer.equals(rightBuffer);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        return false;
      }

      throw error;
    }
  }

  private async isSymlink(targetPath: string): Promise<boolean> {
    try {
      const stat = await fsp.lstat(targetPath);
      return stat.isSymbolicLink();
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        return false;
      }

      throw error;
    }
  }

  private async restrictPermissions(targetPath: string): Promise<void> {
    if (process.platform !== "win32") {
      await fsp.chmod(targetPath, 0o600);
    }
  }

  private async removeIfExists(target: string): Promise<void> {
    try {
      await fsp.rm(target, { force: true });
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== "ENOENT") {
        throw error;
      }
    }
  }

  private async writeCurrentName(name: string): Promise<void> {
    await this.ensureDir(codexDir);
    await fsp.writeFile(currentNamePath, `${name}\n`, "utf8");
  }

  private async readCurrentNameFile(): Promise<string | null> {
    try {
      const contents = await fsp.readFile(currentNamePath, "utf8");
      const trimmed = contents.trim();
      return trimmed.length ? trimmed : null;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  private async pathExists(targetPath: string): Promise<boolean> {
    try {
      await fsp.access(targetPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}

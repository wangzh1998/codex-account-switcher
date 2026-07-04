export declare class AccountService {
    listAccountNames(): Promise<string[]>;
    getCurrentAccountName(): Promise<string | null>;
    saveAccount(rawName: string): Promise<string>;
    createAccount(rawName: string): Promise<string>;
    useAccount(rawName: string): Promise<string>;
    markCurrentAccount(rawName: string): Promise<string>;
    private accountFilePath;
    private normalizeAccountName;
    private ensureAuthFileExists;
    private ensureDir;
    private syncCurrentAuthSnapshot;
    private readAuthAccountName;
    private writeAuthAccountName;
    private writeAccountNameToFile;
    private backupAccountIfExists;
    private replaceWithCopy;
    private pathsReferToSameFile;
    private filesHaveSameContents;
    private isSymlink;
    private restrictPermissions;
    private removeIfExists;
    private writeCurrentName;
    private readCurrentNameFile;
    private pathExists;
}

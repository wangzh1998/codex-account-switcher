export declare class CodexAuthError extends Error {
    constructor(message: string);
}
export declare class AuthFileMissingError extends CodexAuthError {
    constructor(targetPath: string);
}
export declare class AccountNotFoundError extends CodexAuthError {
    constructor(accountName: string);
}
export declare class AccountAlreadyExistsError extends CodexAuthError {
    constructor(accountName: string);
}
export declare class NoAccountsSavedError extends CodexAuthError {
    constructor();
}
export declare class InvalidAccountNameError extends CodexAuthError {
    constructor();
}
export declare class PromptCancelledError extends CodexAuthError {
    constructor();
}

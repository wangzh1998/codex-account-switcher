"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptCancelledError = exports.InvalidAccountNameError = exports.NoAccountsSavedError = exports.AccountAlreadyExistsError = exports.AccountNotFoundError = exports.AuthFileMissingError = exports.CodexAuthError = void 0;
class CodexAuthError extends Error {
    constructor(message) {
        super(message);
        this.name = new.target.name;
    }
}
exports.CodexAuthError = CodexAuthError;
class AuthFileMissingError extends CodexAuthError {
    constructor(targetPath) {
        super(`No Codex auth file found at ${targetPath}. ` +
            `Log into Codex first so ~/.codex/auth.json exists.`);
    }
}
exports.AuthFileMissingError = AuthFileMissingError;
class AccountNotFoundError extends CodexAuthError {
    constructor(accountName) {
        super(`No saved Codex account named "${accountName}" was found.`);
    }
}
exports.AccountNotFoundError = AccountNotFoundError;
class AccountAlreadyExistsError extends CodexAuthError {
    constructor(accountName) {
        super(`A saved Codex account named "${accountName}" already exists.`);
    }
}
exports.AccountAlreadyExistsError = AccountAlreadyExistsError;
class NoAccountsSavedError extends CodexAuthError {
    constructor() {
        super(`No saved Codex accounts yet. Run "codex-auth save <name>" first.`);
    }
}
exports.NoAccountsSavedError = NoAccountsSavedError;
class InvalidAccountNameError extends CodexAuthError {
    constructor() {
        super("Account names must include at least one non-space character and " +
            "may contain letters, numbers, dashes, underscores, and dots.");
    }
}
exports.InvalidAccountNameError = InvalidAccountNameError;
class PromptCancelledError extends CodexAuthError {
    constructor() {
        super("No account selected. The operation was cancelled.");
    }
}
exports.PromptCancelledError = PromptCancelledError;

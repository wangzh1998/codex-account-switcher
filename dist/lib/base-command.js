"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCommand = void 0;
const core_1 = require("@oclif/core");
const accounts_1 = require("./accounts");
class BaseCommand extends core_1.Command {
    constructor() {
        super(...arguments);
        this.accounts = accounts_1.accountService;
    }
    async runSafe(action) {
        try {
            await action();
        }
        catch (error) {
            this.handleError(error);
        }
    }
    handleError(error) {
        if (error instanceof accounts_1.CodexAuthError) {
            this.error(error.message);
        }
        throw error;
    }
}
exports.BaseCommand = BaseCommand;

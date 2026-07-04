"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const prompts_1 = __importDefault(require("prompts"));
const base_command_1 = require("../lib/base-command");
const accounts_1 = require("../lib/accounts");
class UseCommand extends base_command_1.BaseCommand {
    async run() {
        await this.runSafe(async () => {
            const { args } = await this.parse(UseCommand);
            let account = args.account;
            if (!account) {
                account = await this.promptForAccount();
            }
            const activated = await this.accounts.useAccount(account);
            this.log(`Switched Codex auth to "${activated}".`);
        });
    }
    async promptForAccount() {
        const accounts = await this.accounts.listAccountNames();
        if (!accounts.length) {
            throw new accounts_1.NoAccountsSavedError();
        }
        const current = await this.accounts.getCurrentAccountName();
        const initialIndex = current ? Math.max(accounts.indexOf(current), 0) : 0;
        const response = await (0, prompts_1.default)({
            type: "select",
            name: "account",
            message: "Select account",
            choices: accounts.map((name) => ({
                title: current === name ? `${name} (active)` : name,
                value: name,
            })),
            initial: initialIndex,
        }, {
            onCancel: () => {
                throw new accounts_1.PromptCancelledError();
            },
        });
        const picked = response.account;
        if (!picked) {
            throw new accounts_1.PromptCancelledError();
        }
        return picked;
    }
}
UseCommand.description = "Switch ~/.codex/auth.json to the selected account";
UseCommand.args = {
    account: core_1.Args.string({
        name: "account",
        required: false,
        description: "Account to activate",
    }),
};
exports.default = UseCommand;

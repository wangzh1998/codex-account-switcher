"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const base_command_1 = require("../lib/base-command");
class RefreshCommand extends base_command_1.BaseCommand {
    async run() {
        await this.runSafe(async () => {
            var _a;
            const { args } = await this.parse(RefreshCommand);
            const name = (_a = args.account) !== null && _a !== void 0 ? _a : (await this.accounts.getMarkedAccountName());
            if (!name) {
                this.error("No account marker found. Run `codex-auth refresh <name>` once for this login.");
            }
            const savedName = await this.accounts.saveAccount(name);
            await this.accounts.markCurrentAccount(savedName);
            this.log(`Refreshed Codex auth snapshot "${savedName}".`);
        });
    }
}
RefreshCommand.description = "Refresh an account snapshot from ~/.codex/auth.json";
RefreshCommand.args = {
    account: core_1.Args.string({
        name: "account",
        required: false,
        description: "Account snapshot to refresh from the current login",
    }),
};
exports.default = RefreshCommand;

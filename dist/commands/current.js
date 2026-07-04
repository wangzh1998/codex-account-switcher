"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_command_1 = require("../lib/base-command");
class CurrentCommand extends base_command_1.BaseCommand {
    async run() {
        await this.runSafe(async () => {
            const name = await this.accounts.getCurrentAccountName();
            this.log(name !== null && name !== void 0 ? name : "No Codex account is active yet.");
        });
    }
}
CurrentCommand.description = "Show the currently active account name";
exports.default = CurrentCommand;

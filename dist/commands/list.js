"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_command_1 = require("../lib/base-command");
class ListCommand extends base_command_1.BaseCommand {
    async run() {
        await this.runSafe(async () => {
            const accounts = await this.accounts.listAccountNames();
            const current = await this.accounts.getCurrentAccountName();
            if (!accounts.length) {
                this.log("No saved Codex accounts yet. Run `codex-auth save <name>`.");
                return;
            }
            for (const name of accounts) {
                const mark = current === name ? "*" : " ";
                this.log(`${mark} ${name}`);
            }
        });
    }
}
ListCommand.description = "List accounts managed under ~/.codex";
exports.default = ListCommand;

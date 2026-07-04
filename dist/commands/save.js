"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const base_command_1 = require("../lib/base-command");
class SaveCommand extends base_command_1.BaseCommand {
    async run() {
        await this.runSafe(async () => {
            const { args } = await this.parse(SaveCommand);
            const savedName = await this.accounts.saveAccount(args.name);
            this.log(`Saved current Codex auth tokens as "${savedName}".`);
        });
    }
}
SaveCommand.description = "Save the current ~/.codex/auth.json as a named account";
SaveCommand.args = {
    name: core_1.Args.string({
        name: "name",
        required: true,
        description: "Name for the account snapshot",
    }),
};
exports.default = SaveCommand;

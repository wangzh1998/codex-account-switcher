"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const base_command_1 = require("../lib/base-command");
class NewCommand extends base_command_1.BaseCommand {
    async run() {
        await this.runSafe(async () => {
            const { args } = await this.parse(NewCommand);
            const createdName = await this.accounts.createAccount(args.name);
            this.log(`Created and switched Codex auth to "${createdName}".`);
        });
    }
}
NewCommand.description = "Create a new Codex account snapshot and switch to it";
NewCommand.args = {
    name: core_1.Args.string({
        name: "name",
        required: true,
        description: "Name for the new account snapshot",
    }),
};
exports.default = NewCommand;

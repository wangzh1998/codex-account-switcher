import { Args } from "@oclif/core";
import { BaseCommand } from "../lib/base-command";

export default class NewCommand extends BaseCommand {
  static description = "Create a new Codex account snapshot and switch to it";

  static args = {
    name: Args.string({
      name: "name",
      required: true,
      description: "Name for the new account snapshot",
    }),
  } as const;

  async run(): Promise<void> {
    await this.runSafe(async () => {
      const { args } = await this.parse(NewCommand);
      const createdName = await this.accounts.createAccount(args.name as string);
      this.log(`Created and switched Codex auth to "${createdName}".`);
    });
  }
}

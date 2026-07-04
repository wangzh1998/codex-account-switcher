import { Args } from "@oclif/core";
import { BaseCommand } from "../lib/base-command";

export default class RefreshCommand extends BaseCommand {
  static description = "Refresh an account snapshot from ~/.codex/auth.json";

  static args = {
    account: Args.string({
      name: "account",
      required: false,
      description: "Account snapshot to refresh from the current login",
    }),
  } as const;

  async run(): Promise<void> {
    await this.runSafe(async () => {
      const { args } = await this.parse(RefreshCommand);
      const name = (args.account as string | undefined) ?? (await this.accounts.getMarkedAccountName());
      if (!name) {
        this.error("No account marker found. Run `codex-auth refresh <name>` once for this login.");
      }

      const savedName = await this.accounts.saveAccount(name);
      await this.accounts.markCurrentAccount(savedName);
      this.log(`Refreshed Codex auth snapshot "${savedName}".`);
    });
  }
}

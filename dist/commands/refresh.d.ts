import { BaseCommand } from "../lib/base-command";
export default class RefreshCommand extends BaseCommand {
    static description: string;
    static args: {
        readonly account: import("@oclif/core/lib/interfaces").Arg<string | undefined, Record<string, unknown>>;
    };
    run(): Promise<void>;
}

import { BaseCommand } from "../lib/base-command";
export default class NewCommand extends BaseCommand {
    static description: string;
    static args: {
        readonly name: import("@oclif/core/lib/interfaces").Arg<string, Record<string, unknown>>;
    };
    run(): Promise<void>;
}

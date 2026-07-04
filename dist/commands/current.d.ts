import { BaseCommand } from "../lib/base-command";
export default class CurrentCommand extends BaseCommand {
    static description: string;
    run(): Promise<void>;
}

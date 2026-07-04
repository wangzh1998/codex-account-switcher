import { BaseCommand } from "../lib/base-command";
export default class ListCommand extends BaseCommand {
    static description: string;
    run(): Promise<void>;
}

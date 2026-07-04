import { Command } from "@oclif/core";
export declare abstract class BaseCommand extends Command {
    protected readonly accounts: import("./accounts").AccountService;
    protected runSafe(action: () => Promise<void>): Promise<void>;
    private handleError;
}

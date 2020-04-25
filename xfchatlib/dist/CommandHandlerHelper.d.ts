import CommandHandler from "./CommandHandler";
export declare class CommandHandlerHelper {
    commandHandler: CommandHandler;
    constructor(commandHandler: CommandHandler);
    internalLoadPlugin(pluginName: string, commandHandler: CommandHandler): void;
    internalUpdatePlugins(): void;
    internalUnloadPlugin(pluginName: any): void;
    internalUpdatePluginsFile(): void;
    internalLoadPluginOnStart(pluginsArray: any): void;
    internalGetAllFuncs(obj: any): any[];
    internalGetUptime(): string;
}

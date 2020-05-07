import FChatLib from "./FChatLib";
import { CommandHandlerHelper } from "./CommandHandlerHelper";
import { IPlugin } from "./Interfaces/IPlugin";
export default class CommandHandler {
    channelName: string;
    fChatLibInstance: FChatLib;
    pluginsLoaded: Array<IPlugin>;
    commandHandlerHelper: CommandHandlerHelper;
    constructor(parent: FChatLib, channel: string);
    processCommand(data: any): void;
    help(args: any, data: any): void;
    flood(args: any, data: any): void;
    reloadplugins(args: any, data: any): void;
    greload(args: any, data: any): void;
    grestart(args: any, data: any): void;
    gdisableinvites(args: any, data: any): void;
    genableinvites(args: any, data: any): void;
    gjoinchannel(args: any, data: any): void;
    gstatus(args: any, data: any): void;
    loadplugin(args: any, data: any): void;
    loadedplugins(args: any, data: any): void;
    unloadplugin(args: any, data: any): void;
    updateplugins(args: any, data: any): void;
    uptime(args: any, data: any): void;
    flushpluginslist(args: any, data: any): void;
}

'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommandHandler_1 = require("./CommandHandler");
let WebSocketClient = require('ws');
let request = require("request");
let jsonfile = require('jsonfile');
let fs = require('fs');
const throttle = require('throttle-function');
let pingInterval;
let configDir = process.cwd() + "/config";
let fileRoomsJs = "/config.rooms.js";
class FChatLib {
    constructor(configuration) {
        this.config = null;
        this.banListeners = [];
        this.chatOPAddedListeners = [];
        this.chatOPListListeners = [];
        this.chatOPRemovedListeners = [];
        this.connectionListeners = [];
        this.descriptionChangeListeners = [];
        this.initialChannelDataListeners = [];
        this.inviteListeners = [];
        this.joinListeners = [];
        this.kickListeners = [];
        this.leaveListeners = [];
        this.messageListeners = [];
        this.offlineListeners = [];
        this.onlineListeners = [];
        this.pingListeners = [];
        this.privateMessageListeners = [];
        this.rollListeners = [];
        this.statusListeners = [];
        this.variableListeners = [];
        this.usersInChannel = [];
        this.chatOPsInChannel = [];
        this.commandHandlers = [];
        //channels:Map<string, Array<IPlugin>> = new Map<string, Array<IPlugin>>();
        this.channels = new Map();
        this.floodLimit = 2.0;
        // lastTimeCommandReceived:number = Number.MAX_VALUE;
        this.lastTimeCommandReceived = 0;
        this.commandsInQueue = 0;
        if (configuration == null) {
            console.log('No configuration passed, cannot start.');
            process.exit();
        }
        else {
            this.config = configuration;
            if (this.config.username == undefined || this.config.username == "" || this.config.password == undefined || this.config.password == "" || this.config.character == "" || this.config.character == "" || this.config.master == "" || this.config.master == "") {
                console.log('Wrong parameters passed. All the fields in the configuration file are required.');
                process.exit();
            }
        }
        try {
            if (fs.statSync(configDir + fileRoomsJs)) {
                this.channels = new Map(JSON.parse(jsonfile.readFileSync(configDir + fileRoomsJs)));
            }
        }
        catch (err) { }
        if (this.config.room !== undefined && this.channels.get(this.config.room) == null) {
            this.channels.set(this.config.room, { channelTitle: 'defaultTitle', pluginsList: [], channelName: 'defaultName' });
            this.updateRoomsConfig();
        }
    }
    addConnectionListener(fn) {
        this.removeConnectionListener(fn);
        this.connectionListeners.push(fn);
    }
    removeConnectionListener(fn) {
        let id = this.connectionListeners.indexOf(fn);
        if (id != -1) {
            this.connectionListeners.splice(id, 1);
        }
    }
    addJoinListener(fn) {
        this.removeJoinListener(fn);
        this.joinListeners.push(fn);
    }
    removeJoinListener(fn) {
        let id = this.joinListeners.indexOf(fn);
        if (id != -1) {
            this.joinListeners.splice(id, 1);
        }
    }
    addLeaveListener(fn) {
        this.removeLeaveListener(fn);
        this.leaveListeners.push(fn);
    }
    removeLeaveListener(fn) {
        let id = this.leaveListeners.indexOf(fn);
        if (id != -1) {
            this.leaveListeners.splice(id, 1);
        }
    }
    addOnlineListener(fn) {
        this.removeOnlineListener(fn);
        this.onlineListeners.push(fn);
    }
    removeOnlineListener(fn) {
        let id = this.onlineListeners.indexOf(fn);
        if (id != -1) {
            this.onlineListeners.splice(id, 1);
        }
    }
    addOfflineListener(fn) {
        this.removeOfflineListener(fn);
        this.offlineListeners.push(fn);
    }
    removeOfflineListener(fn) {
        let id = this.offlineListeners.indexOf(fn);
        if (id != -1) {
            this.offlineListeners.splice(id, 1);
        }
    }
    addStatusListener(fn) {
        this.removeStatusListener(fn);
        this.statusListeners.push(fn);
    }
    removeStatusListener(fn) {
        let id = this.statusListeners.indexOf(fn);
        if (id != -1) {
            this.statusListeners.splice(id, 1);
        }
    }
    addChatOPListListener(fn) {
        this.removeChatOPListListener(fn);
        this.chatOPListListeners.push(fn);
    }
    removeChatOPListListener(fn) {
        let id = this.chatOPListListeners.indexOf(fn);
        if (id != -1) {
            this.chatOPListListeners.splice(id, 1);
        }
    }
    addChatOPAddedListener(fn) {
        this.removeChatOPAddedListener(fn);
        this.chatOPAddedListeners.push(fn);
    }
    removeChatOPAddedListener(fn) {
        let id = this.chatOPAddedListeners.indexOf(fn);
        if (id != -1) {
            this.chatOPAddedListeners.splice(id, 1);
        }
    }
    addChatOPRemovedListener(fn) {
        this.removeChatOPRemovedListener(fn);
        this.chatOPRemovedListeners.push(fn);
    }
    removeChatOPRemovedListener(fn) {
        let id = this.chatOPRemovedListeners.indexOf(fn);
        if (id != -1) {
            this.chatOPRemovedListeners.splice(id, 1);
        }
    }
    addInviteListener(fn) {
        this.removeInviteListener(fn);
        this.inviteListeners.push(fn);
    }
    removeInviteListener(fn) {
        let id = this.inviteListeners.indexOf(fn);
        if (id != -1) {
            this.inviteListeners.splice(id, 1);
        }
    }
    addKickListener(fn) {
        this.removeKickListener(fn);
        this.kickListeners.push(fn);
    }
    removeKickListener(fn) {
        let id = this.kickListeners.indexOf(fn);
        if (id != -1) {
            this.kickListeners.splice(id, 1);
        }
    }
    addBanListener(fn) {
        this.removeBanListener(fn);
        this.banListeners.push(fn);
    }
    removeBanListener(fn) {
        let id = this.banListeners.indexOf(fn);
        if (id != -1) {
            this.banListeners.splice(id, 1);
        }
    }
    addDescriptionChangeListener(fn) {
        this.removeDescriptionChangeListener(fn);
        this.descriptionChangeListeners.push(fn);
    }
    removeDescriptionChangeListener(fn) {
        let id = this.descriptionChangeListeners.indexOf(fn);
        if (id != -1) {
            this.descriptionChangeListeners.splice(id, 1);
        }
    }
    addPingListener(fn) {
        this.removePingListener(fn);
        this.pingListeners.push(fn);
    }
    removePingListener(fn) {
        let id = this.pingListeners.indexOf(fn);
        if (id != -1) {
            this.pingListeners.splice(id, 1);
        }
    }
    addInitialChannelDataListener(fn) {
        this.removeInitialChannelDataListener(fn);
        this.initialChannelDataListeners.push(fn);
    }
    removeInitialChannelDataListener(fn) {
        let id = this.initialChannelDataListeners.indexOf(fn);
        if (id != -1) {
            this.initialChannelDataListeners.splice(id, 1);
        }
    }
    addMessageListener(fn) {
        this.removeMessageListener(fn);
        this.messageListeners.push(fn);
    }
    removeMessageListener(fn) {
        let id = this.messageListeners.indexOf(fn);
        if (id != -1) {
            this.messageListeners.splice(id, 1);
        }
    }
    addPrivateMessageListener(fn) {
        //this.removePrivateMessageListener(fn);
        //this.privateMessageListeners.push(fn);
        this.privateMessageListeners = [fn];
    }
    removePrivateMessageListener(fn) {
        let id = this.privateMessageListeners.indexOf(fn);
        if (id != -1) {
            this.privateMessageListeners.splice(id, 1);
        }
    }
    addRollListener(fn) {
        this.removeRollListener(fn);
        this.rollListeners.push(fn);
    }
    removeRollListener(fn) {
        let id = this.rollListeners.indexOf(fn);
        if (id != -1) {
            this.rollListeners.splice(id, 1);
        }
    }
    addVariableListener(fn) {
        this.removeVariableListener(fn);
        this.variableListeners.push(fn);
    }
    removeVariableListener(fn) {
        let id = this.variableListeners.indexOf(fn);
        if (id != -1) {
            this.variableListeners.splice(id, 1);
        }
    }
    timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    sendData(messageType, content) {
        return __awaiter(this, void 0, void 0, function* () {
            this.commandsInQueue++;
            let timeSinceLastCommand = (Date.now() - this.lastTimeCommandReceived) / 1000;
            console.log(`Time since last command: ${timeSinceLastCommand}`);
            if (timeSinceLastCommand < this.floodLimit) {
                let timeToWait = (this.floodLimit - timeSinceLastCommand + (this.commandsInQueue * this.floodLimit));
                console.log(`Time to wait: ${timeToWait}`);
                yield this.timeout(timeToWait * 1000);
            }
            this.commandsInQueue--;
            console.log(`Sending WS at ${Date.now()}`);
            this.sendWS(messageType, content);
        });
    }
    //create one commandHandler per room
    generateCommandHandlers() {
        for (let room of this.channels.keys()) {
            this.commandHandlers[room] = new CommandHandler_1.default(this, room);
        }
    }
    setFloodLimit(delay) {
        this.floodLimit = delay;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.ws = null;
            this.setFloodLimit(this.floodLimit);
            this.generateCommandHandlers();
            this.addMessageListener(this.commandListener); //basic commands + plugins loader, one instance for one bot
            this.addConnectionListener(this.joinChannelOnConnect);
            if (this.config.autoJoinOnInvite) {
                this.addInviteListener(this.joinChannelsWhereInvited);
            }
            this.addVariableListener(this.variableChangeHandler);
            //user handling
            this.addInitialChannelDataListener(this.addUsersToList);
            this.addOfflineListener(this.removeUserFromChannels);
            this.addLeaveListener(this.removeUserFromList);
            this.addJoinListener(this.addUserToList);
            //permissions handling
            this.addChatOPListListener(this.addChatOPsToList);
            this.addChatOPAddedListener(this.addChatOPToList);
            this.addChatOPRemovedListener(this.removeChatOPFromList);
            let ticket = yield this.getTicket();
            yield this.startWebsockets(ticket);
        });
    }
    joinChannelsWhereInvited(args) {
        this.joinNewChannel(args);
    }
    joinChannelOnConnect(args) {
        for (let room of this.channels.keys()) {
            this.sendWS('JCH', { channel: room });
        }
    }
    setStatus(status, message) {
        this.sendWS('STA', { status: status, statusmsg: message });
    }
    joinNewChannel(args) {
        let channel = args.name;
        if (this.channels.get(channel) == null) {
            this.channels.set(channel, { pluginsList: [], channelTitle: args.title, channelName: channel });
        }
        this.sendWS('JCH', { channel: channel });
        this.commandHandlers[channel] = new CommandHandler_1.default(this, channel);
        //save file for rooms
        this.updateRoomsConfig();
    }
    commandListener(args) {
        if (typeof this.commandHandlers[args.channel] !== "undefined") {
            try {
                this.commandHandlers[args.channel].processCommand(args);
            }
            catch (ex) {
                console.log(ex);
                this.throwError(args, ex.toString(), args.channel);
            }
        }
    }
    throwError(args, error, chan) {
        this.sendMessage("Error: Please message " + this.config.master + " with the following content:\n Error at " + new Date().toLocaleString() + " on command " + JSON.stringify(args) + " in channel " + chan + " with error: " + JSON.stringify(error), chan);
    }
    //user management
    addUsersToList(args) {
        if (typeof this.usersInChannel[args.channel] !== "object") {
            this.usersInChannel[args.channel] = [];
        }
        for (let i in args.users) {
            if (this.usersInChannel[args.channel].indexOf(args.users[i].identity) == -1) {
                this.usersInChannel[args.channel].push(args.users[i].identity);
            }
        }
    }
    addUserToList(args) {
        if (typeof this.usersInChannel[args.channel] !== "object") {
            this.usersInChannel[args.channel] = [];
        }
        if (this.usersInChannel[args.channel].indexOf(args.character.identity) == -1) {
            this.usersInChannel[args.channel].push(args.character.identity);
        }
    }
    removeUserFromList(args) {
        if (typeof this.usersInChannel[args.channel] !== "object") {
            return;
        }
        if (this.usersInChannel[args.channel].indexOf(args.character) != -1) {
            this.usersInChannel[args.channel].splice(this.usersInChannel[args.channel].indexOf(args.character), 1);
        }
    }
    removeUserFromChannels(args) {
        for (let i in this.usersInChannel) {
            if (typeof this.usersInChannel[i] !== "object") {
                continue;
            }
            if (this.usersInChannel[i].indexOf(args.character) != -1) {
                this.usersInChannel[i].splice(this.usersInChannel[i].indexOf(args.character), 1);
            }
        }
    }
    //permissions
    addChatOPsToList(args) {
        if (typeof this.chatOPsInChannel[args.channel] !== "object") {
            this.chatOPsInChannel[args.channel] = [];
        }
        for (let i in args.oplist) {
            if (this.chatOPsInChannel[args.channel].indexOf(args.oplist[i]) == -1) {
                this.chatOPsInChannel[args.channel].push(args.oplist[i]);
            }
        }
    }
    addChatOPToList(args) {
        if (typeof this.chatOPsInChannel[args.channel] !== "object") {
            this.chatOPsInChannel[args.channel] = [];
        }
        if (this.chatOPsInChannel[args.channel].indexOf(args.character) == -1) {
            this.chatOPsInChannel[args.channel].push(args.character);
        }
    }
    removeChatOPFromList(args) {
        if (typeof this.chatOPsInChannel[args.channel] !== "object") {
            return;
        }
        if (this.chatOPsInChannel[args.channel].indexOf(args.character) != -1) {
            this.chatOPsInChannel[args.channel].splice(this.chatOPsInChannel[args.channel].indexOf(args.character), 1);
        }
    }
    variableChangeHandler(args) {
        return;
    }
    getTicket() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                request.post({ url: 'https://www.f-list.net/json/getApiTicket.php', form: { account: this.config.username, password: this.config.password } }, (err, httpResponse, body) => {
                    if (err) {
                        reject(err);
                    }
                    let response = JSON.parse(body);
                    let ticket = response.ticket;
                    var json = { "method": "ticket", "account": this.config.username, "ticket": ticket, "character": this.config.character, "cname": this.config.cname, "cversion": this.config.cversion };
                    resolve(json);
                });
            });
        });
    }
    sendWS(command, object) {
        this.lastTimeCommandReceived = Date.now();
        if (this.ws.readyState) {
            this.ws.send(command + ' ' + JSON.stringify(object));
            return true;
        }
        return false;
    }
    sendMessage(message, channel) {
        let json = {};
        json.channel = channel;
        json.message = message;
        this.sendData('MSG', json);
    }
    sendPrivMessage(message, character) {
        let json = {};
        json.message = message;
        json.recipient = character;
        this.sendData('PRI', json);
    }
    getUserList(channel) {
        if (this.usersInChannel[channel] == undefined) {
            return [];
        }
        return this.usersInChannel[channel];
    }
    getAllUsersList() {
        return [].concat(...this.usersInChannel);
    }
    getChatOPList(channel) {
        return (this.chatOPsInChannel[channel] === null ? [] : this.chatOPsInChannel[channel]);
    }
    isUserChatOP(username, channel) {
        return (this.getChatOPList(channel).indexOf(username) !== -1 || username == this.config.master);
    }
    isUserMaster(username) {
        return (username == this.config.master);
    }
    disconnect() {
        this.ws.close();
    }
    restart() {
        this.disconnect();
        setTimeout(this.connect, 2000);
    }
    softRestart(channel) {
        this.commandHandlers[channel] = new CommandHandler_1.default(this, channel);
    }
    roll(customDice, channel) {
        let json = {};
        json.dice = customDice || "1d10";
        json.channel = channel;
        this.sendData("RLL", json);
    }
    updateRoomsConfig() {
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir);
        }
        let ignoredKeys = ["instantiatedPlugin"];
        let cache = [];
        let tempJson = JSON.stringify([...this.channels], function (key, value) {
            if (typeof value === 'object' && value !== null) {
                if (cache.indexOf(value) !== -1 || ignoredKeys.indexOf(key) !== -1) {
                    // Circular reference found, discard key
                    return;
                }
                // Store value in our collection
                cache.push(value);
            }
            return value;
        });
        jsonfile.writeFile(configDir + fileRoomsJs, tempJson);
    }
    startWebsockets(json) {
        if (this.config.debug == true) {
            this.ws = new WebSocketClient('ws://chat.f-list.net:8722');
        }
        else {
            //this.ws = new WebSocketClient('ws://chat.f-list.net:9722');
            this.ws = new WebSocketClient('wss://chat.f-list.net/chat2');
        }
        this.ws.on('open', (data) => {
            this.sendWS('IDN', json);
            clearInterval(pingInterval);
            this.pingInterval = setInterval(() => { this.ws.send('PIN'); }, 25000);
        });
        this.ws.on('close', (data) => {
            process.exit();
        });
        this.ws.on('error', (data) => {
            setTimeout(() => {
                this.connect();
            }, 60000);
        });
        this.ws.on('message', (data, flags) => {
            let command;
            let argument;
            if (this.config.debug) {
                console.log(data);
            }
            if (data != null) {
                command = argument = "";
                command = this.splitOnce(data, " ")[0].trim();
                try {
                    if (data.substring(command.length).trim() != "") {
                        argument = JSON.parse(data.substring(command.length).trim());
                    }
                }
                catch (e) {
                }
                if (argument.channel !== undefined && argument.channel.substring(0, 3).toLowerCase() === `adh`) {
                    argument.channel = argument.channel.substring(0, 3).toUpperCase() + argument.channel.substring(3).toLowerCase();
                }
                switch (command) {
                    case "CON": //CON { "count": int }
                        for (let i = 0; i < this.connectionListeners.length; i++) {
                            this.connectionListeners[i].call(this, argument);
                        }
                        break;
                    case "COL": //COL {"oplist":["Newhalf Wrestling","Nastasya Bates","Rinko Saitou"],"channel":"ADH-d0bde7daca1dbe6c79ba"}
                        for (let i = 0; i < this.chatOPListListeners.length; i++) {
                            this.chatOPListListeners[i].call(this, argument);
                        }
                        break;
                    case "COA": //COA { "channel": string, "character": string }
                        for (let i = 0; i < this.chatOPAddedListeners.length; i++) {
                            this.chatOPAddedListeners[i].call(this, argument);
                        }
                        break;
                    case "COR": //COR { "channel": string, "character": string }
                        for (let i = 0; i < this.chatOPRemovedListeners.length; i++) {
                            this.chatOPRemovedListeners[i].call(this, argument);
                        }
                        break;
                    case "FLN": //FLN {"character":"The Kid"}
                        for (let i = 0; i < this.offlineListeners.length; i++) {
                            this.offlineListeners[i].call(this, argument);
                        }
                        break;
                    case "ICH": //ICH {"users": [{"identity": "Shadlor"}, {"identity": "Bunnie Patcher"}, {"identity": "DemonNeko"}, {"identity": "Desbreko"}, {"identity": "Robert Bell"}, {"identity": "Jayson"}, {"identity": "Valoriel Talonheart"}, {"identity": "Jordan Costa"}, {"identity": "Skip Weber"}, {"identity": "Niruka"}, {"identity": "Jake Brian Purplecat"}, {"identity": "Hexxy"}], "channel": "Frontpage", mode: "chat"}
                        for (let i = 0; i < this.initialChannelDataListeners.length; i++) {
                            this.initialChannelDataListeners[i].call(this, argument);
                        }
                        break;
                    case "JCH": //JCH {"title":"Newhalf Sexual Federation of Wrestling","channel":"ADH-d0bde7daca1dbe6c79ba","character":{"identity":"Kirijou Mitsuru"}}
                        for (let i = 0; i < this.joinListeners.length; i++) {
                            this.joinListeners[i].call(this, argument);
                        }
                        break;
                    case "LCH": //LCH {"character":"Darent","channel":"ADH-d0bde7daca1dbe6c79ba"}
                        for (let i = 0; i < this.leaveListeners.length; i++) {
                            this.leaveListeners[i].call(this, argument);
                        }
                        break;
                    case "NLN": //FLN {"character":"The Kid"}
                        for (let i = 0; i < this.onlineListeners.length; i++) {
                            this.onlineListeners[i].call(this, argument);
                        }
                        break;
                    case "PIN": //PIN
                        for (let i = 0; i < this.pingListeners.length; i++) {
                            this.pingListeners[i].call(this, argument);
                        }
                        break;
                    case "RLL": //RLL {"channel": string, "results": [int], "type": enum, "message": string, "rolls": [string], "character": string, "endresult": int} OR RLL {"target":"string","channel":"string","message":"string","type":"bottle","character":"string"}
                        for (let i = 0; i < this.rollListeners.length; i++) {
                            this.rollListeners[i].call(this, argument);
                        }
                        break;
                    case "STA": //STA { status: "status", character: "channel", statusmsg:"statusmsg" }
                        for (let i = 0; i < this.statusListeners.length; i++) {
                            this.statusListeners[i].call(this, argument);
                        }
                        break;
                    case "CBU": //CBU {"operator":string,"channel":string,"character":string}
                        for (let i = 0; i < this.kickListeners.length; i++) {
                            this.kickListeners[i].call(this, argument);
                        }
                        break;
                    case "CKU": //CKU {"operator":string,"channel":string,"character":string}
                        for (let i = 0; i < this.banListeners.length; i++) {
                            this.banListeners[i].call(this, argument);
                        }
                        break;
                    case "CDS": //CDS { "channel": string, "description": string }
                        for (let i = 0; i < this.descriptionChangeListeners.length; i++) {
                            this.descriptionChangeListeners[i].call(this, argument);
                        }
                        break;
                    case "CIU": //CIU { "sender":string,"title":string,"name":string }
                        for (let i = 0; i < this.inviteListeners.length; i++) {
                            this.inviteListeners[i].call(this, argument);
                        }
                        break;
                    case "PRI": //PRI { "character": string, "message": string }
                        for (let i = 0; i < this.privateMessageListeners.length; i++) {
                            this.privateMessageListeners[i].call(this, argument);
                        }
                        break;
                    case "MSG": //MSG { "character": string, "message": string, "channel": string }
                        for (let i = 0; i < this.messageListeners.length; i++) {
                            this.messageListeners[i].call(this, argument);
                        }
                        break;
                    case "VAR": //VAR { "variable": string, "value": int/float }
                        for (let i = 0; i < this.variableListeners.length; i++) {
                            this.variableListeners[i].call(this, argument);
                        }
                        break;
                }
            }
        });
    }
    splitOnce(str, delim) {
        let components = str.split(delim);
        let result = [components.shift()];
        if (components.length) {
            result.push(components.join(delim));
        }
        return result;
    }
}
exports.default = FChatLib;
//# sourceMappingURL=FChatLib.js.map
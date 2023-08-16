let fileRoomsJs = "/config.rooms.js";
let configDir = process.cwd() + "/config";
const CommandHandler_1 = require("./CommandHandler");
let WebSocketClient = require("ws");
let jsonfile = require("jsonfile");
let fs = require("fs");
let pingInterval;

class FChatLib {
  constructor(configuration) {
    this.config = null;
    this.errorListeners = [];
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
    this.channels = new Map();
    this.floodLimit = 1.5;
    this.commands = [];
    this.lastTimeCommandSent = Date.now();
    if (!configuration) {
      console.log("No configuration passed, cannot start.");
      process.exit();
    } else {
      this.config = configuration;
      if (
        !this.config.username ||
        !this.config.master ||
        !this.config.password ||
        !this.config.character
      ) {
        console.log(
          "Wrong parameters passed. All the fields in the configuration file are required."
        );
        process.exit();
      }
    }
    try {
      if (fs.statSync(configDir + fileRoomsJs)) {
        this.channels = new Map(
          JSON.parse(jsonfile.readFileSync(configDir + fileRoomsJs))
        );
      }
    } catch (err) {}
    if (
      this.config.room !== undefined &&
      this.channels.get(this.config.room) == null
    ) {
      this.updateRoomsConfig();
    }
  }

  updateRoomsConfig() {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
    let ignoredKeys = ["instantiatedPlugin"];
    let cache = [];
    let tempJson = JSON.stringify([...this.channels], function (key, value) {
      if (typeof value === "object" && value !== null) {
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
  addErrorListener(fn) {
    this.removeErrorListener(fn);
    this.errorListeners.push(fn);
  }
  removeErrorListener(fn) {
    let id = this.errorListeners.indexOf(fn);
    if (id != -1) {
      this.errorListeners.splice(id, 1);
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

  queueData(messageType, content) {
    // TODO: use a real ID here, cuid() or something
    let command = { messageType, content, id: Math.random() };
    this.commands.push(command);
    //console.log(`Pushed a new command, length is now ${this.commands.length}`);
    this.sendCommandWhenReady(command);
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
  joinChannelsWhereInvited(args) {
    this.joinNewChannel(args);
  }
  joinChannelOnConnect(args) {
    for (let room of this.channels.keys()) {
      this.sendWS("JCH", { channel: room });
    }
  }
  setStatus(status, message) {
    this.sendWS("STA", { status: status, statusmsg: message });
  }
  joinNewChannel(args) {
    let channel = args.name;
    if (this.channels.get(channel) == null) {
      this.channels.set(channel, {
        pluginsList: [],
        channelTitle: args.title,
        channelName: channel,
      });
    }
    this.sendWS("JCH", { channel: channel });
    this.commandHandlers[channel] = new CommandHandler_1.default(this, channel);
    //save file for rooms
    this.updateRoomsConfig();
  }
  commandListener(args) {
    if (typeof this.commandHandlers[args.channel] !== "undefined") {
      try {
        this.commandHandlers[args.channel].processCommand(args);
      } catch (ex) {
        console.log(ex);
        this.throwError(args, ex.toString(), args.channel);
      }
    }
  }
  throwError(args, error, chan) {
    this.sendMessage(
      "Error: Please message " +
        this.config.master +
        " with the following content:\n Error at " +
        new Date().toLocaleString() +
        " on command " +
        JSON.stringify(args) +
        " in channel " +
        chan +
        " with error: " +
        JSON.stringify(error),
      chan
    );
  }
  //user management
  addUsersToList(args) {
    if (typeof this.usersInChannel[args.channel] !== "object") {
      this.usersInChannel[args.channel] = [];
    }
    for (let i in args.users) {
      if (
        this.usersInChannel[args.channel].indexOf(args.users[i].identity) == -1
      ) {
        this.usersInChannel[args.channel].push(args.users[i].identity);
      }
    }
  }
  addUserToList(args) {
    if (typeof this.usersInChannel[args.channel] !== "object") {
      this.usersInChannel[args.channel] = [];
    }
    if (
      this.usersInChannel[args.channel].indexOf(args.character.identity) == -1
    ) {
      this.usersInChannel[args.channel].push(args.character.identity);
    }
  }
  removeUserFromList(args) {
    if (typeof this.usersInChannel[args.channel] !== "object") {
      return;
    }
    if (this.usersInChannel[args.channel].indexOf(args.character) != -1) {
      this.usersInChannel[args.channel].splice(
        this.usersInChannel[args.channel].indexOf(args.character),
        1
      );
    }
  }
  removeUserFromChannels(args) {
    for (let i in this.usersInChannel) {
      if (typeof this.usersInChannel[i] !== "object") {
        continue;
      }
      if (this.usersInChannel[i].indexOf(args.character) != -1) {
        this.usersInChannel[i].splice(
          this.usersInChannel[i].indexOf(args.character),
          1
        );
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
      this.chatOPsInChannel[args.channel].splice(
        this.chatOPsInChannel[args.channel].indexOf(args.character),
        1
      );
    }
  }
  variableChangeHandler(args) {
    return;
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
    return this.chatOPsInChannel[channel] === null
      ? []
      : this.chatOPsInChannel[channel];
  }
  isUserChatOP(username, channel) {
    return (
      this.getChatOPList(channel).indexOf(username) !== -1 ||
      username == this.config.master
    );
  }
  isUserMaster(username) {
    return username == this.config.master;
  }
  disconnect() {
    this.ws.close();
  }
  updateRoomsConfig() {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
    let ignoredKeys = ["instantiatedPlugin"];
    let cache = [];
    let tempJson = JSON.stringify([...this.channels], function (key, value) {
      if (typeof value === "object" && value !== null) {
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
      this.ws = new WebSocketClient("ws://chat.f-list.net:8722");
    } else {
      //this.ws = new WebSocketClient('ws://chat.f-list.net:9722');
      this.ws = new WebSocketClient("wss://chat.f-list.net/chat2");
    }
    this.ws.on("open", (data) => {
      console.log("The socket was opened.");
      this.sendWS("IDN", json);
      clearInterval(pingInterval);
      this.pingInterval = setInterval(() => {
        this.ws.send("PIN");
      }, 25000);
    });
    this.ws.on("close", (data) => {
      console.log("The socket was closed.");
      process.exit();
    });
    this.ws.on("error", (data) => {
      console.log("The socket errored.");
      setTimeout(() => {
        this.connect();
      }, 60000);
    });
    this.ws.on("message", (data, flags) => {
      let command;
      let argument;
      if (this.config.debug) {
        console.log(data);
      }
      if (data != null) {
        if (typeof data !== "string") {
          data = data.toString();
          if (this.config.debug) {
            console.log(data);
          }
        }
        command = argument = "";
        command = this.splitOnce(data, " ")[0].trim();
        try {
          if (data.substring(command.length).trim() != "") {
            argument = JSON.parse(data.substring(command.length).trim());
          }
        } catch (e) {}
        if (
          argument.channel !== undefined &&
          argument.channel.substring(0, 3).toLowerCase() === `adh`
        ) {
          //console.log(`Fixing channel case for ${argument.channel}...`);
          argument.channel =
            argument.channel.substring(0, 3).toUpperCase() +
            argument.channel.substring(3).toLowerCase();
          //console.log(`Adjusted to ${argument.channel}.`);
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
          case "ERR": //ERR { "number": int, "message": string }
            for (let i = 0; i < this.errorListeners.length; i++) {
              this.errorListeners[i].call(this, argument);
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
  connect() {
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
    return this.getTicket()
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        let ticket = {
          method: "ticket",
          account: this.config.username,
          ticket: data.ticket,
          character: this.config.character,
          cname: this.config.cname,
          cversion: this.config.cversion,
        };
        this.startWebsockets(ticket);
      });
  }

  getTicket() {
    let formData = new FormData();
    formData.append("account", this.config.username);
    formData.append("password", this.config.password);
    formData.append("no_friends", true);
    formData.append("no_bookmarks", true);
    formData.append("no_characters", true);
    try {
      console.log("Getting ticket...");
      return fetch("https://www.f-list.net/json/getApiTicket.php", {
        method: "POST",
        body: formData,
        // body: JSON.stringify({
        //   account: "" + this.config.username,
        //   password: "" + this.config.password,
        //   no_friends: true,
        //   no_characters: true,
        //   no_bookmarks: true
        // }),
      });
    } catch (err) {
      console.log("Error getting ticket:");
      console.log(err);
      throw "Error getting ticket: " + err;
    }
  }

  sendWS(command, object) {
    if (this.ws.readyState) {
      let data = command + " " + JSON.stringify(object);
      // console.log(`Message Sent:`);
      // console.log(data)
      // console.log(`-----`);
      this.ws.send(data);
      return true;
    }
    return false;
  }
  sendMessage(message, channel) {
    let json = {};
    json.channel = channel;
    json.message = message;
    this.queueData("MSG", json);
  }
  sendPrivMessage(message, character) {
    let json = {};
    json.message = message;
    json.recipient = character;
    this.queueData("PRI", json);
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
    this.queueData("RLL", json);
  }

  async sendCommandWhenReady(command) {
    let timeToWait = (this.commands.length - 1) * this.floodLimit * 1000;
    let timeSinceLastCommand = Date.now() - this.lastTimeCommandSent;
    if (timeSinceLastCommand <= this.floodLimit * 1000)
      timeToWait += this.floodLimit * 1000 - timeSinceLastCommand;
    while (
      timeSinceLastCommand <= this.floodLimit * 1000 ||
      this.commands[0] !== command
    ) {
      console.log(`Waiting ${timeToWait} ms`);
      await new Promise((r) => setTimeout(r, timeToWait));
      timeToWait = 444;
      console.log(`Finished waiting.`);
      timeSinceLastCommand = Date.now() - this.lastTimeCommandSent;
    }
    //let command = this.commands[0];
    this.sendWS(command.messageType, command.content);
    this.commands.splice(0, 1);
    //!console.log(`Removed a new command, length is now ${this.commands.length}`);
    this.lastTimeCommandSent = Date.now();
  }
}

module.exports.default = FChatLib;

// class FChatLib {
//   timeout(ms) {
//     return new Promise((resolve) => setTimeout(resolve, ms));
//   }

//   sendCommandWhenReady(command) {
//     return __awaiter(this, void 0, void 0, function* () {
//       //console.log(`Received new command, ${this.commands.length} total commands.`);
//       let timeToWait = (this.commands.length - 1) * this.floodLimit * 1000;
//       let timeSinceLastCommand = Date.now() - this.lastTimeCommandSent;
//       if (timeSinceLastCommand <= this.floodLimit * 1000)
//         timeToWait += this.floodLimit * 1000 - timeSinceLastCommand;
//       while (
//         timeSinceLastCommand <= this.floodLimit * 1000 ||
//         this.commands[0] !== command
//       ) {
//         console.log(`Waiting ${timeToWait} ms`);
//         yield this.timeout(timeToWait);
//         timeToWait = 444;
//         console.log(`Finished waiting.`);
//         timeSinceLastCommand = Date.now() - this.lastTimeCommandSent;
//       }
//       //let command = this.commands[0];
//       this.sendWS(command.messageType, command.content);
//       this.commands.splice(0, 1);
//       //!console.log(`Removed a new command, length is now ${this.commands.length}`);
//       this.lastTimeCommandSent = Date.now();
//     });
//   }
//   connect() {
//     return __awaiter(this, void 0, void 0, function* () {
//       this.ws = null;
//       this.setFloodLimit(this.floodLimit);
//       this.generateCommandHandlers();
//       this.addMessageListener(this.commandListener); //basic commands + plugins loader, one instance for one bot
//       this.addConnectionListener(this.joinChannelOnConnect);
//       if (this.config.autoJoinOnInvite) {
//         this.addInviteListener(this.joinChannelsWhereInvited);
//       }
//       this.addVariableListener(this.variableChangeHandler);
//       //user handling
//       this.addInitialChannelDataListener(this.addUsersToList);
//       this.addOfflineListener(this.removeUserFromChannels);
//       this.addLeaveListener(this.removeUserFromList);
//       this.addJoinListener(this.addUserToList);
//       //permissions handling
//       this.addChatOPListListener(this.addChatOPsToList);
//       this.addChatOPAddedListener(this.addChatOPToList);
//       this.addChatOPRemovedListener(this.removeChatOPFromList);
//       let ticket = yield this.getTicket();
//       yield this.startWebsockets(ticket);
//     });
//   }

//   getTicket() {
//     return __awaiter(this, void 0, void 0, async function* () {
//       //return new Promise((resolve, reject) => {
//       //request.post({ url: 'https://www.f-list.net/json/getApiTicket.php', form: { account: this.config.username, password: this.config.password } }, (err, httpResponse, body) => {
//       try {
//         console.log("Getting ticket...");
//         return await fetch(
//           "https://www.f-list.net/json/getApiTicket.php",
//           {
//             method: "POST",
//             body: JSON.stringify({
//               account: this.config.username,
//               password: this.config.password,
//             }),
//           }
//           /*(err, httpResponse, body) => {
//             if (err) {
//               reject(err);
//             }
//             let response = JSON.parse(body);
//             let ticket = response.ticket;
//             var json = {
//               method: "ticket",
//               account: this.config.username,
//               ticket: ticket,
//               character: this.config.character,
//               cname: this.config.cname,
//               cversion: this.config.cversion,
//             };
//             resolve(json);
//           }*/
//         );
//       } catch (err) {
//         console.log("Error getting ticket:");
//         console.log(err);
//         return;
//       }
//       //});
//     });
//   }

// }
// exports.default = FChatLib;
//# sourceMappingURL=FChatLib.js.map

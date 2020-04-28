const OhNoGame = require('../src/OhNoGame').default;
const OhNoHelper = require('../src/OhNoHelper').default;

class OhNo {
    constructor(fChatClient, channel) {
        this.channel = channel;
        this.fChatClient = fChatClient;
        this.helper = new OhNoHelper(this.fChatClient);
        this.games = {};
        for(let channel of this.fChatClient.channels.keys()) {
            this.games[channel] = new OhNoGame();
        };
        fChatClient.addInviteListener((data) => {
            // Example data:
            // { name: 'ADH-70c727f76bf77214cd76', sender: 'Tom_Kat', title: 'test2' }
            if (data.sender === this.fChatClient.config.master && data.name.substring(0, 4).toLowerCase() === 'adh-') {
                console.log(`Joining ${data.title}...`);
                this.fChatClient.joinNewChannel(data.name);
            } else {
                console.log(`Ignoring invite: ${JSON.stringify(data)}`);
            }
        });

        this.aliases = {
            addp: this.addplayer,
            addplayers: this.addplayer,
            removep: this.removeplayer,
            removeplayers: this.removeplayer,
            listp: this.listplayers
        }
    }

    addplayer = (args, data) => {
        if (!this.helper.isUserChatOP(data)) return;
        let game = this.games[data.channel];
        let successes = 0;
        let failures = 0;
        let currentUsers = this.fChatClient.getUserList(data.channel);
        args.split(', ').forEach(username => {
            if (currentUsers.includes(username) && game.addPlayer(username)) {
                successes++;
            } else {
                failures++;
            }
        });
        if (failures === 0) {
            this.helper.msgRoom(`Added ${successes} players to the game. Total players is now ${game.players.length}.`, data.channel);
        } else if (successes === 0) {
            this.helper.msgRoom(`Failed to add any players to game, check your syntax! Make sure the names are spelled correctly and the players are in the room. ...am I broken? ' ^ '`, data.channel);
        } else {
            this.helper.msgRoom(`Successfully added ${successes} player${successes === 1 ? '' : 's'} to the game, failed to add ${failures} player${failures === 1 ? '' : 's'} to the game. Maybe some players were already in the game, or the names were misspelled, or they aren't in the room. Current players: ${game.players.map(player => player.name).join(' ')}`, data.channel);
        }
    }

    removeplayer = (username, data) => {
        if (!this.helper.isUserChatOP(data)) return;
        let game = this.games[data.channel];
        console.log(`Removing ${username} from game in ${data.channel}...`);
        // * Find if user with username is in channel
        // * Make sure they're in the game
        // * If no game is in progress, remove them from the game
        // * If game is in progress, replace them with bot player
    }

    listplayers = (args, data) => {
        let game = this.games[data.channel];
        if (game.players.length === 0) {
            this.helper.msgRoom(`There are no players yet. Add some with !addplayer`, data.channel);
        }else {
            this.helper.msgRoom(`Starting with the first player and going clockwise: ${game.players.map(player => player.name).join(' ')}`, data.channel);
        }
    }

    // dirty debug, does whatever i wants it to does
    ddbug(args, data) {
        console.log(args, data);
        console.log(this.fChatClient.channels);
    }

    //Commands
    // this.guide = function (args, data) {
    //     console.log(data);
    //     var message = "Here's a few things to start: \n";
    //     message += "The command received the following args: "+JSON.stringify(args)+"\n";
    //     message += "The command received the following data: "+JSON.stringify(data)+"\n";
    //     message += "The character who sent the message is:"+data.character+"\n";
    //     message += "The message was received in the channel:"+data.channel+ " and it's also passed everytime here: "+this.channel+"\n";
    //     message += "You can call functions outside of the scope: "+getRandomInt(0,10)+"\n";
    //     message += "And you'll also be able to do things from there, like rolling a die. "+rollDie()+"\n";
    //     message += "The users in the room are: "+this.fChatClient.getUserList(this.channel)+"\n";
    //     message += "Here's the list of all the users, in all the room the bot is connected to: "+JSON.stringify(this.fChatClient.getAllUsersList())+"\n";
    //     message += "The operators in this room are: "+JSON.stringify(this.fChatClient.getChatOPList(this.channel))+ "\n";
    //     message += "As you will see in a few seconds, the results of the die roll will be shown. There are many actions that you can listen on by passing a function to them, here's the list:\n";
    //     message += "addMessageListener, addOfflineListener, addLeaveListener, addJoinListener, addChatOPAddedListener, addChatOPRemovedListener, addInitialChannelDataListener\n";
    //     message += "Alright, you must be ready now. You don't have to re-run the bot each time you update the plugin, just do !reloadplugins in the chat!";
    //     this.fChatClient.sendMessage(message, this.channel);
    // };

    //Listener for events
    // this.fChatClient.addRollListener(function(data){
    //     this.sendMessage("Oh! Someone rolled a die! They rolled a "+data.endresult+" but here's the data: "+JSON.stringify(data), data.channel);
    // });

    // this.fChatClient.addJoinListener(function(data){
    //     this.sendMessage("Yay, someone joined the channel! Welcome "+data.character.identity, data.channel);
    // });
};

// var getRandomInt = function(min, max) {
//     return Math.floor(Math.random() * (max - min)) + min;
// };

// var rollDie = function() {
//     this.fChatClient.roll("1d6", channel);
//     return "I rolled a die, and since I added a listener with the addRollListener method, I'll be able to know who rolled, and what's the result!";
// };

module.exports.OhNo = OhNo;
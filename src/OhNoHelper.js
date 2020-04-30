const DECKDATA = require('../src/OhNoDeckData').default;

class OhNoHelper {
    constructor (fChatClient, game, channel) {
        this.fChatClient = fChatClient;
        this.game = game;
        this.channel = channel;
    }

    msgUser(text, username) {
        this.fChatClient.sendPrivMessage(text, username);
    }

    isUserMaster(data) {
        if(data.character == this.fChatClient.config.master){
            return true;
        }
        else{
            this.fChatClient.sendMessage('You don\'t have sufficient rights.', data.channel);
            return false;
        }
    }
    
    isUserChatOP(data) {
        if(this.fChatClient.isUserChatOP(data.character, data.channel)){
            return true;
        } else {
            this.fChatClient.sendMessage('You don\'t have sufficient rights.', data.channel);
            return false;
        }
    }

    msgRoom(text, channel) {
        // TODO: if any output exceeds the character limit, break it into multiple posts separated by 1 second each.
        this.fChatClient.sendMessage(text, channel);
    }

    isUserInChannel(username, channel) {
        return this.fChatClient.getUserList(channel).includes(username);
    }

    helpArgs(args) {
        return (args === '?' || args === 'help' || args === 'h');
    }

    insufficientArgs(args) {
        return (!args || args.length === 0 || this.helpArgs(args));
    }

    promptCurrentPlayer() {
        // TODO: handle bots playing to completion
        let str = this.game.results + ` `;
        while (this.game.currentPlayer.isBot && this.game.isRoundInProgress) {
            let player = this.game.currentPlayer;
            let name = this.game.currentPlayer.getName();
            str += `It is ${name}'s turn. `;
            let play;
            if (Math.random() * 100 % 4 === 0) {
                play = {
                    card: this.game.getHighestPlayableCard(),
                    withShout: Math.random() * 100 % 5 === 0,
                    wildColor: DECKDATA.COLORS[Math.floor(Math.random() * DECKDATA.COLORS.length)]
                };
                console.log(`Going with a dangerous play!`);
            } else {
                play = this.game.getSafestPlay();
                console.log(`Going with a safe play.`);
            }
            if (!this.game.isCardPlayable(play.card)) {
                this.game.pass();
                str += `${name} drew a card. `;
                if (!this.game.canPlayerPlay()) {
                    this.game.pass();
                    str += `${name} passed their turn. `;
                } else {
                    this.game.playCard(play.card, player, play.wildColor, play.withShout);
                }
            } else {
                this.game.playCard(play.card, player, play.wildColor, play.withShout);
            }
            str += this.game.results + ` `;
            if (this.game.isRoundInProgress) this.game.startTurn();
        }
        let player = this.game.currentPlayer;
        if (!player.isBot) {
            let name = player.getName();
            // TODO: draw 4 challenging
            // TODO: if the player cannot play, let them know.
            // TODO: remind players that drawing is an option even if they can play
            str += `It is ${name}'s turn to play on ${this.game.discards.top().getName()}. PM'ing them with their hand... `;
            let privateString = `[b]Current game: ${this.channel}[/b]\n`;
            privateString += `The top discard is ${this.game.discards.top().getName()}. Your hand:\n`;
            privateString += `    ${player.handToString()}\n`;
            privateString += `To play a card, enter this command in ${this.channel}: !play cardname\n`;
            privateString += `Examples: !play blonde bunny, !play brown reverse, !play wild breed 4 white, !play black cat shout\n`;
            privateString += `When playing your next to last card, make sure to include "shout" in the !play command. If you forget, you can use the !shout command after the fact, but make sure to do it before someone calls you out!`;
            privateString += ` When playing a wild or wild breed 4 card, make sure to include the color you want in the same command.`;
            this.msgUser(privateString, player.getName());
            console.log(str);
            return str.substring(0, str.length - 1);
        }
        // if we reach this point, does that mean the game ended? if so, show them results, baby!
        console.log(str);
        return str.substring(0, str.length - 1) + `\n\nSomething went wrong, not sure whose turn it is...`;
    }
};

module.exports.default = OhNoHelper;
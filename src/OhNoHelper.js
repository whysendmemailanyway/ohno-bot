const DECKDATA = require('../src/OhNoDeckData').default;

class OhNoHelper {
    constructor (fChatClient, game, channel) {
        this.fChatClient = fChatClient;
        this.game = game;
        this.channel = channel;
    }

    msgUser(text, username) {
        // TODO: if any output exceeds the character limit, break it into multiple posts separated by 1 second each.
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
        // is this even fair? technically, I should handle each bot's
        // turn separately so that players have a chance to !shout...
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
            str += `It is ${name}'s turn to play on ${this.game.discards.top().getName()}. PM'ing them with their hand... `;
            let privateString = `[b]Current game: ${this.channel}[/b]\n`;
            privateString += `The top discard is ${this.game.discards.top().getName()}. Your hand:\n`;
            privateString += `    ${player.handToString()}\n`;
            if (this.game.canPlayerPlay() === false) {
                privateString += `\n\nYou currently have no playable cards.`;
                if (this.game.hasDrawnThisTurn) {
                    privateString += ` Use the !pass command in ${channel} to pass play to the next player.`;
                } else {
                    privateString += ` Use the !draw command in ${channel} to draw a new card. Maybe you can play it!`;
                }
            } else {
                privateString += `To play a card, enter this command in ${this.channel}: !play cardname [wildcolor] [shout]\n`;
                privateString += `Parameters in [square brackets] are optional. Only include a wildcolor if you're playing a wild card, and only shout if you will have 1 card left in your hand after playing.`;
                privateString += `Examples: !play blonde bunny, !play brown reverse, !play wild breed 4 white, !play black cat shout\n`;
                privateString += `When playing your next to last card, don't forget to include "shout" at the end of the !play command. If you forget, you can use the !shout command after the fact, but make sure to do it before someone calls you out, or you will have to draw 2 cards! If the next player takes their turn before anyone calls you out, you're safe.`;
                privateString += ` When playing a wild or wild breed 4 card, don't forget to include the color you want after the card name. If you don't want to play a card, you can use !draw to draw a card, or !pass to pass your turn if you've already drawn a card this turn.`;
            }
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
const DECKDATA = require('./OhNoDeckData');

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
        let msgLength = 3000;
        while (text.length > 0) {
            let newText = text;
            if (text.length > msgLength) {
                newText = text.substring(0, msgLength);
                text = text.substring(msgLength);
            } else {
                text = '';
            }
            this.fChatClient.sendMessage(newText, channel);        
        }
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
        let str = `${this.game.results} `;
        while (this.game.currentPlayer.isBot && this.game.isRoundInProgress) {
            let player = this.game.currentPlayer;
            let name = this.game.currentPlayer.getName();
            str += `It is ${name}'s turn. `;
            if (this.game.draw4LastTurn) {
                if (Math.random() * 100 % 4 === 0) {
                    this.game.challengeDraw4();
                } else {
                    this.game.acceptDraw4();
                }
                str += this.game.results;
                continue;
            }
            let getPlay = () => {
                let play = {};
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
                return play;
            }
            let play = getPlay();
            
            if (!play.card || !this.game.isCardPlayable(play.card)) {
                this.game.pass();
                str += `${name} drew a card. `;
                if (!this.game.canPlayerPlay()) {
                    this.game.pass();
                    str += `${name} passed their turn. `;
                } else {
                    play = getPlay();
                    this.game.playCard(play.card, player, play.wildColor, play.withShout);
                }
            } else {
                this.game.playCard(play.card, player, play.wildColor, play.withShout);
            }
            str += this.game.results + ` `;
            if (this.game.isRoundInProgress) {
                this.game.startTurn();
            } else if (this.game.isInProgress) {
                str += `\n\nPlease use the !startround command when all players are ready for the next round.`;
                return str;
            } else {
                str += `\n\nPlease use the !startgame command when all players are ready for a new game.`;
                return str;
            }
        }
        let player = this.game.currentPlayer;
        if (!player.isBot) {
            let top = this.game.discards.top();
            if (this.game.draw4LastTurn) {
                return `${str.substring(0, str.length - 1)}`;
            }
            let channel = this.fChatClient.channels.get(this.channel).channelTitle;
            let name = player.getName();
            str = `${str}It is ${name}'s turn to play. PM'ing them with their hand... `;
            let privateString = `[b]Current game: ${channel}[/b]\n`;
            privateString += `The top discard is [b]${top.getName()}[/b]${top.isWild() ? `, the wild color is [b]${this.game.wildColor}[/b]` : ``}. Your hand:\n`;
            privateString += `    ${player.handToString(true, this.game.isCardPlayable)}\n\n`;
            if (this.game.canPlayerPlay() === false) {
                privateString += `You currently have no playable cards.`;
                if (this.game.hasDrawnThisTurn) {
                    privateString += ` Use the !pass command in ${channel} to pass play to the next player.`;
                } else {
                    privateString += ` Use the !draw command in ${channel} to draw a new card. Maybe you can play it!`;
                }
            } else {
                privateString += `Playable cards are listed in [b]bold[/b]. To play a card, enter this command in ${channel}: !play cardname [wildcolor] [shout]\n`;
                privateString += `See the "How to Play" and "Commands for playing" sections on my profile for more information.`;
                // privateString += `Parameters in [square brackets] are optional. Only include a wildcolor if you're playing a wild card, and only shout if you will have 1 card left in your hand after playing.\n\n`;
                // privateString += `Examples: !play blonde bunny, !play brown reverse, !play wild breed 4 white, !play black cat shout\n\n`;
                // privateString += `When playing your next to last card, don't forget to include "shout" at the end of the !play command. If you forget, you can use the !shout command after the fact, but make sure to do it before someone calls you out, or you will have to draw 2 cards! If the next player takes their turn before anyone calls you out, you're safe.\n`;
                // privateString += `When playing a wild or wild breed 4 card, don't forget to include the color you want after the card name. If you don't want to play a card, you can use !draw to draw a card, or !pass to pass your turn if you've already drawn a card this turn.[/i]`;
            }
            this.msgUser(privateString, player.getName());
            return `${str.substring(0, str.length - 1)}`;
        }
        if (this.game.isInProgress) {
            str += `\n\nPlease use the !startround command when all players are ready for the next round.`;
        } else {
            str += `\n\nPlease use the !startgame command when all players are ready for a new game.`;
        }
        return `${str.substring(0, str.length - 1)}`;
    }
};

module.exports.default = OhNoHelper;
const DECKDATA = require('./OhNoDeckData');

class OhNoHelper {
    constructor (fChatClient, game, channel) {
        this.fChatClient = fChatClient;
        this.game = game;
        this.channel = channel;
    }

    msgUser = (text, username) => {
        // TODO: if any output exceeds the character limit, break it into multiple posts separated by 1 second each.
        this.fChatClient.sendPrivMessage(text, username);
    }

    isUserMaster = (data) => {
        if(data.character == this.fChatClient.config.master){
            return true;
        }
        else{
            this.fChatClient.sendMessage('You don\'t have sufficient rights.', data.channel);
            return false;
        }
    }
    
    isUserChatOP = (data) => {
        if(this.fChatClient.isUserChatOP(data.character, data.channel)){
            return true;
        } else {
            this.fChatClient.sendMessage('You don\'t have sufficient rights.', data.channel);
            return false;
        }
    }

    msgRoom = (text, channel) => {
        // TODO: Make this divide the posts nicer -- never split BBCode or words (especially usernames; look for periods, commas, etc).
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

    isUserInChannel = (username, channel) => {
        return this.fChatClient.getUserList(channel).includes(username);
    }

    helpArgs = (args) => {
        return (args === '?' || args === 'help' || args === 'h');
    }

    insufficientArgs = (args) => {
        return (!args || args.length === 0 || this.helpArgs(args));
    }

    getTurnOutput = (player) => {
        let privateString = `[b]Current game: ${this.fChatClient.channels.get(this.channel).channelTitle}[/b]\n`;
        privateString += `The top discard is [b]${this.game.discards.top().getName(true)}[/b]${this.game.discards.top().isWild() ? `, the wild color is [b][color=purple][color=${DECKDATA.COLOR_MAP[this.game.wildColor.toLowerCase()]}]${UTILS.titleCase(this.game.wildColor)}[/color][/color][/b]` : ``}. Your hand:\n`;
        privateString += `    ${player.handToString(true, this.game.isCardPlayable)}\n\n`;
        return privateString;
    }

    doBotTurn = async (callback) => {
        if (!this.game.isRoundInProgress) return;
        setTimeout(() => {
            if (!this.game.isRoundInProgress) return;
            callback();
        }, this.game.botTurnTime * 1000);
    }

    checkForVictory = (messageRoom=false) => {
        let str = `Helper is broken!`;
        if (this.game.isRoundInProgress) {
            this.game.startTurn();
            str = this.promptCurrentPlayer();
        } else {
            str = `${this.game.results}\n\n`
            if (this.game.isInProgress) {
                if (this.game.containsAllBots()) {
                    str += `The round is over. The game consists of bots only; please use the !start command to start the next round.`;
                } else {
                    str += `The round is over. Use !ready to ready up for the next round. Round begins when all approved players are ready.`;
                }
            } else {
                if (this.game.containsAllBots()) {
                    str += `The game is over. The game consists of bots only; please use the !start command to start the next game.`;
                } else {
                    str += `The game is over, thanks for playing! Use !ready to ready up for the next game. Game begins when all approved players are ready.`;
                }
            }
        }
        if (messageRoom) {
            this.msgRoom(str, this.channel);
        } else {
            return str;
        }
    }

    promptCurrentPlayer = (messageRoom=false) => {
        let str = `${this.game.results}`;
        let player = this.game.currentPlayer;
        let name = player.getName();
        str = `${str}${str.length > 0 ? ' ' : ''}It is ${name}'s turn to play. `;
        if (!player.isBot) {
            if (this.game.draw4LastTurn) {
                return str;
            }
            let channel = this.fChatClient.channels.get(this.channel).channelTitle;
            str += `PM'ing them with their hand... `;
            let privateString = this.getTurnOutput(player);
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
            }
            this.msgUser(privateString, player.getName());
            return str;
        } else {
            if (this.game.draw4LastTurn) {
                str += `Deciding whether to challenge or accept... `;
                if (Math.floor(Math.random() * 100) % 4) {
                    this.doBotTurn(() => {
                        this.game.challengeDraw4();
                        this.promptCurrentPlayer(true);
                    });
                } else {
                    this.doBotTurn(() => {
                        this.game.acceptDraw4();
                        this.promptCurrentPlayer(true);
                    });
                }
            } else {
                let getPlay = () => {
                    let play = {};
                    if (Math.floor(Math.random() * 100) % 4) {
                        play = {
                            card: this.game.getHighestPlayableCard(),
                            withShout: player.hand.length == 2 ? Math.floor(Math.random() * 100) % 4 !== 0 : false,
                            wildColor: Math.floor(Math.random() * 100) % 4 === 0 ? DECKDATA.COLORS[Math.floor(Math.random() * DECKDATA.COLORS.length)] : player.getMostCommonColor()
                        };
                        console.log(`Going with a dangerous play!`);
                    } else {
                        play = this.game.getSafestPlay();
                        console.log(`Going with a safe play.`);
                    }
                    return play;
                }
                let play = getPlay();
                console.log(play);
                if (!play.card || !this.game.isCardPlayable(play.card)) {
                    this.game.pass();
                    str += `${name} drew a card. `;
                    if (!this.game.canPlayerPlay()) {
                        this.doBotTurn(() => {
                            this.game.pass();
                            this.checkForVictory(true);
                        });
                        str += `${name} passed their turn. `;
                    } else {
                        play = getPlay();
                        this.doBotTurn(() => {
                            this.game.playCard(play.card, player, play.wildColor, play.withShout);
                            this.checkForVictory(true);
                        });
                    }
                } else {
                    this.doBotTurn(() => {
                        this.game.playCard(play.card, player, play.wildColor, play.withShout);
                        this.checkForVictory(true);
                    });
                }
            }
            if (messageRoom) {
                this.msgRoom(str, this.channel);
            } else {
                return str;
            }
        }
    }
};

module.exports.default = OhNoHelper;
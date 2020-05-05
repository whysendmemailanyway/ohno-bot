const OhNoGame = require('../src/OhNoGame').default;
const OhNoHelper = require('../src/OhNoHelper').default;

const fetch = require('node-fetch');

class OhNo {
    constructor(fChatClient, channel) {
        this.channel = channel;
        this.fChatClient = fChatClient;
        this.game = new OhNoGame();
        this.helper = new OhNoHelper(this.fChatClient, this.game, this.channel);
        this.defaultMessage = `I am broken... sorry!`;

        this.aliases = {
            addb: this.addbot,
            accept: this.acceptb4,
            challenge: this.challengeb4,
            confg: this.configuregame,
            
            removep: this.removeplayer,
            removeplayers: this.removeplayer,
            remp: this.removeplayer,
            delp: this.removeplayer,
            // TODO: list scores along with players if game is in progress; list active players separately from inactive/unapproved players
            listp: this.listplayers,
            
            sc: this.shortcuts,
            shortc: this.shortcuts,
            scuts: this.shortcuts,

            hand: this.showhand,
            
            //startg: this.startgame,
            // startr: this.startround,
           
            stopgame: this.endgame,
            stopg: this.endgame,
            endg: this.endgame,
            end: this.endgame,

            join: this.joingame,
            joing: this.joingame,

            leave: this.leavegame,
            leaveg: this.leavegame,
            // dirty debug, does whatever i wants it to does
            ddbug: (args, data) => {
                console.log(args, data);
                if (!this.helper.isUserMaster(data)) return;
                this.addbot('Bot 1, Bot 2, Bot 3', data);
                //this.joingame(args, data);
                this.configuregame('startingHandSize=3, targetScore=50', data);
                //this.ready(args, data);
                this.start(args, data);
                // if (this.game.isInProgress) {
                //     this.game.endPrematurely();
                // } else {
                //     this.game.addPlayer('Tom_Kat');
                //     this.game.addPlayer('Ellen Strand');
                //     this.game.allPlayers.forEach(player => player.isApproved = true);
                //     this.game.config.startingHandSize = 4;
                //     this.game.config.targetScore = 10;
                // }
                // this.startgame('', {character: `Tom_Kat`, channel: this.channel});
            },
            eval: (args, data) => {
                console.log(args, data);
                if (!this.helper.isUserMaster(data)) return;
                const echo = (str) => this.helper.msgRoom(str, data.channel);
                eval(args);
            },
            // floodtest: (args, data) => {
            //     let arr = [];
            //     for (let i = 1; i <= 5; i++) {
            //         arr.push(i);
            //     }
            //     arr.forEach(num => this.helper.msgRoom(`Flood test ${num} ahhhh`, data.channel));
            // },
            clean: (args, data) => {
                if (!this.helper.isUserChatOP(data)) return;
                this.helper.msgRoom(`/me wipes down the table.`, data.channel);
            },
            deepclean: (args, data) => {
                if (!this.helper.isUserChatOP(data)) return;
                this.helper.msgRoom(`/me incinerates the table and produces a new one.`, data.channel);
            },
            dadjoke: (args, data) => {
                //if (!this.helper.isUserChatOP(data)) return;
                const url = 'https://icanhazdadjoke.com/';
                const options = {
                    headers: new fetch.Headers({'Accept': 'application/json'})
                };
                fetch(url, options)
                .then(response => {
                    if (response.ok) return response.json();
                    throw {message: response.statusText};
                })
                .then(responseJson => {
                    console.log(responseJson.joke);
                    this.helper.msgRoom(`/me clears its throat: "${responseJson.joke}"`, data.channel);
                })
                .catch(error => {
                    console.log(error.message);
                    this.helper.msgRoom(`Error getting dad joke: ${error.message}`, data.channel);
                })
            },
            telljoke: async (args, data) => {
                //this.helper.msgRoom(`Sorry, that command has been removed for being too edgy. Try nice wholesome !dadjoke instead.`, data.channel);
                return;
                if (!this.helper.isUserChatOP(data)) return;
                args = args.length > 0 ? args.toLowerCase().split(' ') : [];
                let url = 'https://sv443.net/jokeapi/v2/joke/';
                let isCategorySet = false;
                let blacklistFlags = args.includes('nolimits') || args.includes('*') ? [] : [`nsfw`, `religious`, `political`, `racist`, `sexist`];
                if (args.includes('misc') || args.includes('miscellaneous') || args.includes('any') || args.includes('*')) {
                    url += 'Miscellaneous';
                    isCategorySet = true;
                }
                if (args.includes('programming') || args.includes('any') || args.includes('*')) {
                    url += `${isCategorySet ? `,` : ``}Programming`;
                    isCategorySet = true;
                }
                if (args.includes('dark') || args.includes('any') || args.includes('*')) {
                    url += `${isCategorySet ? `,` : ``}Dark`;
                    isCategorySet = true;
                }
                if (!isCategorySet) url += 'Programming,Miscellaneous';

                url += '?format=json';
                if (blacklistFlags.length > 0) url += `&blacklistFlags=${blacklistFlags.join(`,`)}`;
                console.log(url);
                fetch(url)
                .then(response => {
                    if (response.ok) return response.json();
                    console.log(JSON.stringify(response));
                    throw {message: response.statusText};
                })
                .then(responseJson => {
                    if (responseJson.type !== 'single' && responseJson.type !== 'twopart') {
                        console.log(`Unknown joke: ${JSON.stringify(responseJson)}`);
                        this.helper.msgRoom(`/me coughs awkwardly. "This is embarrassing, but I don't recognize the type of joke I found. I blame Tom_Kat."`, data.channel);
                        return;
                    }
                    this.helper.msgRoom(`/me downloads some humor. "I hope you enjoy this ${responseJson.category.toLowerCase()} joke." It clears its throat. "${responseJson.type === 'single' ? responseJson.joke : responseJson.setup}"`, data.channel);
                    console.log(responseJson.type === 'single' ? responseJson.joke : responseJson.setup);
                    if (responseJson.type === 'twopart') {
                        console.log(responseJson.delivery);
                        setTimeout(() => {
                            this.helper.msgRoom(`"${responseJson.delivery}"`, data.channel);
                        }, 6000);
                        return;
                    }
                })
                .catch(error => {
                    this.helper.msgRoom(`/me coughs awkwardly. "This is embarrassing, but I experienced an error downloading that joke. I blame Tom_Kat."`, data.channel);
                    console.log(`There was an error getting or telling a joke...`);
                    console.log(error.message);
                })
            }
        }
    }

    shortcuts = (args, data) => {
        if (this.helper.helpArgs()) {
            this.helper.msgRoom(`The !shortcuts command shows aliases for existing commands. Permission: any. Usage: !shortcuts`, data.channel);
            return;
        }
        let s = [
            '!acceptb4: !accept.',
            '!addbot: !addb.',
            '!challengeb4: !challenge.',
            '!configuregame: !confg.',
            '!endgame: !stopgame, !stopg, !stop, !endg, !end.',
            '!joingame: !joing, !join.',
            '!leavegame: !leaveg, !leave.',
            '!listplayers: !listp.',
            '!removeplayer: !removeplayers, !removep, !remp, !delp.',
            '!shortcuts: !shortc, !scuts, !sc.',
            '!showhand: !hand',
            //'!startgame: !startg, !start.',
            //'!startround: !startr.'
        ]
        this.helper.msgRoom(s.join(' '), data.channel);
    }

    showhand = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !showhand command is used to PM you your hand. Permission: any player who is in an active game. Usage: !showhand`, data.channel);
            return;
        }
        let str = this.defaultMessage;
        let name = data.character;
        let player = this.game.findPlayerWithName(name);
        if (player === null) {
            str = `You have no hand, ${name}, you are not a player in the current game.`;
            this.helper.msgRoom(str, data.channel);
        } else {
            str = this.helper.getTurnOutput(player);
            this.helper.msgUser(str, data.character);
        }
    }

    acceptb4 = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !acceptb4 command is used when a Wild Breed 4 has been played on you and you do not wish to challenge it. Permission: any player who would have to draw 4 cards as a result of someone playing Wild Breed 4. Usage: !acceptb4`, data.channel);
            return;
        }
        let str = this.defaultMessage;
        let name = data.character;
        let player = this.game.findPlayerWithName(name);
        if (player === null) {
            str = `You can't accept, ${name}, you are not a player in the current game.`;
        } else if (this.game.currentPlayer !== player) {
            str = `You can't accept, ${player.getName()}, it is not your turn.`;
        } else {
            this.game.acceptDraw4();
            str = this.helper.promptCurrentPlayer();
        }
        this.helper.msgRoom(str, data.channel);
    }

    challengeb4 = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !challengeb4 command is used when you think a Wild Breed 4 has been played on you illegally (e.g, they could have played a non-wild card instead of the Wild Breed 4). Only the player who has to draw 4 cards can challenge the player who played it. If a player is challenged, they must reveal their hand; if any non-wild cards could have been played instead of the Wild Breed 4, the player who played the Wild Breed 4 must draw 4 cards, and the other player may take their turn. However, if they played the Wild Breed 4 legally, the player who challenged must draw 6 cards and miss their turn. Permission: any player who would have to draw 4 cards as a result of someone playing Wild Breed 4. Usage: !challengeb4`, data.channel);
            return;
        }
        let str = this.defaultMessage;
        let name = data.character;
        let player = this.game.findPlayerWithName(name);
        if (player === null) {
            str = `You can't challenge, ${name}, you are not a player in the current game.`;
        } else if (this.game.currentPlayer !== player) {
            str = `You can't challenge, ${player.getName()}, it is not your turn.`;
        } else {
            this.game.challengeDraw4();
            this.game.startTurn();
            str = this.helper.promptCurrentPlayer();
        }
        this.helper.msgRoom(str, data.channel);
    }

    // TODO: timeouts. if a player does not respond within the timeout, botify them.
    // Timeouts are only active during a round.

    shout = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !shout command has two uses. If you played all but one card in your hand and forgot to shout when you played, you can use this command to shout. If someone else played all but one card in their hand and hasn't shouted yet, you can use this command (even if it is not your turn) before the next player takes their turn to force the player who forgot to shout to draw two cards. Permission: any player in the current game. Usage: !shout`, data.channel);
            return;
        }
        let str = this.defaultMessage;
        let name = data.character;
        let player = this.game.findPlayerWithName(name);
        if (player === null) {
            str = `You can't shout, ${name}, you are not a player in the current game.`;
        } else {
            str = this.game.shout(player);
        }
        this.helper.msgRoom(str, data.channel);
    }

    play = (args, data) => {
        if (this.helper.insufficientArgs(args)) {
            this.helper.msgRoom(`The !play command is used to play a card. Permission: any (on your turn only). Usage: !play cardName [wildColor] [shout]`, data.channel);
            return;
        }
        let username = data.character;
        let str = this.defaultMessage;
        let player = this.game.findPlayerWithName(username);
        if (!player) {
            str = `${username} can't make a play right now, they are not an active player in the current game.`;
        } else if (this.game.currentPlayer !== player) {
            str = `Wait until it's your turn, ${player.getName()}!`;
        } else {
            let commandObj = this.game.parsePlay(args);
            if (commandObj === null) {
                str = `There was an error parsing your command, please try different syntax.`;
            } else {
                let play = {
                    card: player.findCardByName(commandObj.cardname),
                    wildColor: commandObj.wildcolor || null,
                    withShout: commandObj.shout || false
                }
                console.log(`Parsed player's play as:`);
                console.log(play);
                if (!play.card) {
                    str = `Could not find a card called ${commandObj.cardname} in ${username}'s hand. Please try different syntax or a different card.`;
                } else {
                    let succeeded = this.game.playCard(play.card, player, play.wildColor, play.withShout);
                    if (succeeded) {
                        str = this.helper.checkForVictory();
                    } else {
                        str = this.game.results;
                    }
                }
            }
        }
        this.helper.msgRoom(str, data.channel);
    }

    draw = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !draw command is used when it's your turn and you cannot or do not want to play a card from your hand. Permission: any (on your turn only). Usage: !draw`, data.channel);
            return;
        }
        let str = this.defaultMessage;
        let username = data.character;
        if (!this.game.isInProgress) {
            str = `There is no game in progress. You can only draw when it's your turn in an active game.`;
        } else if (this.game.currentPlayer.name !== username) {
            str = `You can only draw when it's your turn, ${username}. Currently, it is ${this.game.currentPlayer.getName()}'s turn.`;
        } else if (this.game.hasDrawnThisTurn) {
            str = `${username} already drew a card this turn. If you can't play, please use !pass so play progresses to the next player.`;
        } else if (this.game.draw4LastTurn) {
            str = `Not so fast, ${username}. You need to !accept or !challenge first!`;
        } else {
            this.game.pass();
            str = `${this.game.currentPlayer.getName()} drew a card. Use !play to play it, or !pass to pass your turn.`;
            str += ' ' + this.helper.promptCurrentPlayer();
        }
        this.helper.msgRoom(str, data.channel);
    }

    pass = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !pass command is used when it's your turn, you have already drawn a card this turn, and you cannot or do not want to play a card from your hand. Permission: any (on your turn only). Usage: !pass`, data.channel);
            return;
        }
        let str = this.defaultMessage;
        let username = data.character;
        if (!this.game.isInProgress) {
            str = `There is no game in progress. You can only pass when it's your turn in an active game.`;
        } else if (this.game.currentPlayer.name !== username) {
            str = `You can only pass when it's your turn, ${username}. Currently, it is ${this.game.currentPlayer.getName()}'s turn.`;
        } else if (!this.game.hasDrawnThisTurn) {
            str = `${username} has not drawn a card yet. Please draw a card with !draw before passing.`;
        } else {
            let player = this.game.currentPlayer;
            str = `${player.getName()} passed their turn, ${player.hand.length} card${player.hand.length > 0 ? 's' : ''} in their hand.`;
            this.game.pass();
            this.game.startTurn();
            str += ' ' + this.helper.promptCurrentPlayer();
        }
        this.helper.msgRoom(str, data.channel);
    }

    configuregame = (args, data) => {
        if (this.helper.insufficientArgs(args)) {
            this.helper.msgRoom(`The !configuregame command is used to specify certain properties on the game object: startingHandSize, targetScore, and maxPlayers. These can be set at any time, even when a game is in progress, and setting targetScore below any player's current score will immediately end the game. Permission: OP only. Usage: !configuregame key1=value1, key2=value2, etc`, data.channel);
            return;
        }
        if (!this.helper.isUserChatOP(data)) return;
        let successes = 0;
        let failures = 0;
        args.split(', ').forEach(prop => {
            if (this.game.parseProp(prop)) {
                successes++;
            } else {
                failures++;
            }
        });
        let str = this.defaultMessage;
        if (failures === 0) {
            str = `Updated ${successes} configuration propert${successes === 1 ? 'y' : 'ies'}.`;
        } else if (successes === 0) {
            str = `Failed to update any configuration properties, check your syntax!`;
        } else {
            str = `Successfully updated ${successes} configuration propert${successes === 1 ? 'y' : 'ies'} to the game, failed to update ${failures} configuration propert${failures === 1 ? 'y' : 'ies'} to the game.`;
        }
        if (this.game.results && this.game.results.length > 0) str += `\n${this.game.results}`;
        this.helper.msgRoom(str, data.channel);
    }

    addbot = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !addbot command adds a bot to the game. Permission: OP only. Usage: !addbot name 1[, name 2, etc]`, data.channel);
            return;
        }
        let str = this.defaultMessage;
        if (!this.helper.isUserChatOP(data)) return;
        let successes = 0;
        let failures = 0;
        args.split(', ').forEach(name => {
            if (this.game.addPlayer(name)) {
                let player = this.game.findPlayerWithName(name, this.game.allPlayers);
                if (player && this.game.approvePlayer(name)) {
                    player.isBot = true;
                    player.wasHuman = false;
                    player.isReady = true;
                    successes++;
                } else {
                    failures++;
                }
            } else {
                failures++;
            }
        });
        if (failures === 0) {
            str = `Added ${successes} bot${successes === 1 ? '' : 's'} to the game.`;
        } else if (successes === 0) {
            str = `Failed to add any bots to the game, check your syntax!`;
        } else {
            str = `Successfully added ${successes} bot${successes === 1 ? '' : ''} to the game, failed to add ${failures} bot${failures === 1 ? '' : 's'} to the game.`;
            str += ` Approved / total players is now ${this.game.getApprovedPlayers().length} / ${this.game.allPlayers.length}.`;
        }
        this.helper.msgRoom(str, data.channel);
    }

    joingame = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !joingame command does one of two things depending on whether a game is in progress. If the game is in progress, the user who entered this command replaces their botified self. If the game is not in progress, the user who entered this command is added to the game. If they are an OP, they will be approved automatically; otherwise, an OP must approve them before they can actually play. Usage: !joingame`, data.channel);
            return;
        }
        let username = data.character;
        let str = this.defaultMessage;
        if (this.game.addPlayer(username, this.game.allPlayers)) {
            str = `Added ${username} to the game.`;
            let player = this.game.findPlayerWithName(username);
            if (player && player.isApproved) {
                str += ` ${username} is still approved from a previous !approve command.`;
            } else {
                if (this.fChatClient.isUserChatOP(username, data.channel)) {
                    this.game.approvePlayer(username);
                    str += ` Since they are an OP, they have been approved automatically.`;
                } else {
                    str += ` An OP must approve them before they can actually play.`;
                }
            }
            str += ` Approved / total players is now ${this.game.getApprovedPlayers().length} / ${this.game.allPlayers.length}.`;
            if (!this.game.isRoundInProgress) {
                str += ` Don't forget to ready up with !ready when you're prepared to start the next round.`;
            }
        } else {
            str = `Failed to join the game. Either ${username} is already in the game and not a bot, or the maximum number of approved players has already been reached.`;
        }
        this.helper.msgRoom(str, data.channel);
    }

    approve = (args, data) => {
        if (this.helper.insufficientArgs(args)) {
            this.helper.msgRoom(`The !approve command approves one or more players. Players must first join the game, then be approved before they can play. Permission: OP only. Usage: !approve name1, name2, etc`, data.channel);
            return;
        }
        if (!this.helper.isUserChatOP(data)) return;
        let successes = 0;
        let failures = 0;
        args.split(', ').forEach(username => {
            //if (this.helper.isUserInChannel(username, data.channel) && 
            if (this.game.approvePlayer(username)) {
                successes++;
            } else {
                failures++;
            }
        });
        let str = this.defaultMessage;
        if (failures === 0) {
            str = `Approved ${successes} player${successes === 1 ? '' : 's'}. Approved / total players is now ${this.game.getApprovedPlayers().length} / ${this.game.allPlayers.length}.`;
        } else if (successes === 0) {
            str = `Failed to approve any players, check your syntax! Make sure the names are spelled correctly, the players are in the game, and the players are not already approved.`;
        } else {
            str = `Successfully approved ${successes} player${successes === 1 ? '' : 's'}, failed to approve ${failures} player${failures === 1 ? '' : 's'}. Maybe some players were already approved, or the names were misspelled, or they aren't in the game.`;
        }
        this.helper.msgRoom(str, data.channel);
    }

    leavegame = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !leavegame command removes the person who used it from the game. Permission: any. Usage: !leavegame`, data.channel);
            return;
        }
        let str = this.defaultMessage;
        let username = data.character;
        let player = this.game.findPlayerWithName(username, this.game.allPlayers);
        if (this.game.isInProgress && this.game.players.includes(player)) {
            if (this.game.removePlayer(username)) {
                str = `Replaced ${username} with ${player.getName()}. Come back any time with !join.`;
                if (player.isBot && this.game.currentPlayer === player) {
                    str += ` ${this.helper.promptCurrentPlayer()}`;
                }
            } else {
                str = `Failed to remove ${username}...`;
            }
        } else {
            if (this.game.removePlayer(username)) {
                str = `Removed ${player.getName()} from the game. Rejoin with !join.`;
            } else {
                str = `Failed to remove ${username} from the game. Maybe they weren't in the game to begin with?`;
            }
        }
        this.helper.msgRoom(str, data.channel);
    }

    ready = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !ready command signifies that you are ready to start the next round. The next round starts when all players are ready. Permission: Any player who joined the game (including unapproved players, although only approved players will be able to play). Usage: !ready`, data.channel);
            return;
        }
        let str = this.defaultMessage;
        const username = data.character;
        let player = this.game.findPlayerWithName(username, this.game.allPlayers);
        if (!player) {
            str = `Could not find a player called ${username}. Make sure to !join the game first.`;
        } else if (player.isReady) {
            str = `You are already readied up, ${username}.`;
        } else {
            player.isReady = true;
            let roundOrGame = this.game.isInProgress ? `round` : `game`;
            str = `${username} is ready to play the next ${roundOrGame}.`;
            let length = this.game.getApprovedReadiedPlayers().length;
            if (length < 2) {
                str += ` Waiting for at least two approved ready players before starting the ${roundOrGame}. Currently, there ${length === 0 ? 'are no' : 'is only one'} approved ready player${length === 0 ? 's' : ''} in the game. Players can join the game with !joingame, and an OP can approve them with !approve.`;
            } else if (length < this.game.getApprovedPlayers().length) {
                str += ` ${length} out of ${this.game.players.length} approved players are ready.`;
            } else {
                if (this.game.isInProgress) {
                    this.game.startRound();
                } else {
                    this.game.startGame();
                }
                str += ` All players are ready. [b]A new ${roundOrGame} has begun![/b]\n\n${this.helper.promptCurrentPlayer()}`;
            }
        }
        this.helper.msgRoom(str, data.channel);
    }

    start = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !start command begins a new game or round of OhNo with the current players. It is only necessary in a bots-only game; if any non-bot players are in the game, the next round or game will begin when everyone is !ready. Permission: OP only. Usage: !start`, data.channel);
            return;
        }
        if (!this.helper.isUserChatOP(data)) return;
        let str = this.defaultMessage;
        if (this.game.isInProgress) {
            if (this.game.isRoundInProgress) {
                str = `The round is already in progress. Please finish the current round before starting the next one. You can prematurely end the game with the !endgame command.`;
            } else {
                let length = this.game.getApprovedReadiedPlayers().length;
                if (length < 2) {
                    str = `Waiting for at least two approved ready players before starting the round. Currently, there ${length === 0 ? 'are no' : 'is only one'} approved ready player${length === 0 ? 's' : ''} in the game. Players can join the game with !joingame, ready with !ready, and an OP can approve them with !approve.`;
                } else if (length < this.game.getApprovedPlayers().length) {
                    str = `Waiting for all approved players to ready up. Currently, ${length} out of ${this.game.getApprovedPlayers().length} approved players are ready.`;
                } else {
                    this.game.startRound();
                    str = `[b]A new round has begun![/b]\n\n${this.helper.promptCurrentPlayer()}`;
                }
            }
        } else {
            let length = this.game.getApprovedReadiedPlayers().length;
            if (length < 2) {
                str = `Waiting for at least two approved ready players before starting the game. Currently, there ${length === 0 ? 'are no' : 'is only one'} approved ready player${length === 0 ? 's' : ''} in the game. Players can join the game with !joingame, ready with !ready, and an OP can approve them with !approve.`;
            } else if (length < this.game.getApprovedPlayers().length) {
                str = `Waiting for all approved players to ready up. Currently, ${length} out of ${this.game.getApprovedPlayers().length} approved players are ready.`;
            } else {
                this.game.startGame();
                str = `[b]A new game has begun![/b]\n${this.helper.promptCurrentPlayer()}`;
            }
        }
        this.helper.msgRoom(str, data.channel);
    }

    // unconfirm = (args, data) => {
    //     // unconfirm self (but stay in game)
    // }

    // startround = (args, data) => {
    //     if (this.helper.helpArgs(args)) {
    //         this.helper.msgRoom(`The !startround command begins a new round of OhNo with the current approved players. Permission: OP only. Usage: !startround`, data.channel);
    //         return;
    //     }
    //     if (!this.helper.isUserChatOP(data)) return;
    //     let str = this.defaultMessage;
    //     if (this.game.isRoundInProgress) {
    //         str = `The round is already in progress. Please finish the current round before starting a new one.`;
    //     } else if (this.game.getApprovedPlayers().length < 2) {
    //         let length = this.game.getApprovedPlayers().length;
    //         str = `You need at least two approved players in the game before you can start the round. Currently, there ${length === 0 ? 'are no' : 'is only one'} approved player${length === 0 ? 's' : ''} in the game. Players can join the game with !joingame, and an OP can approve them with !approve.`;
    //     } else {
    //         this.game.startRound();
    //         str = `[b]A new round has begun![/b]\n${this.helper.promptCurrentPlayer()}`;
    //     }
    //     this.helper.msgRoom(str, data.channel);
    // }

    // startgame = (args, data) => {
    //     if (this.helper.helpArgs(args)) {
    //         this.helper.msgRoom(`The !startgame command begins a new game of OhNo with the current players. Permission: OP only. Usage: !startgame`, data.channel);
    //         return;
    //     }
    //     if (!this.helper.isUserChatOP(data)) return;
    //     let str = this.defaultMessage;
    //     if (this.game.isInProgress) {
    //         str = `The game is already in progress. Please finish or end the current game before starting a new one. You can prematurely end the game with the !endgame command.`;
    //     } else if (this.game.getApprovedPlayers().length < 2) {
    //         let length = this.game.getApprovedPlayers().length;
    //         str = `You need at least two approved players in the game before you can start it. Currently, there ${length === 0 ? 'are no' : 'is only one'} approved player${length === 0 ? 's' : ''} in the game. Players can join the game with !joingame, and an OP can approve them with !approve.`;
    //     } else {
    //         this.game.startGame();
    //         str = `[b]A new game has begun![/b]\n${this.helper.promptCurrentPlayer()}`;
    //         console.log('HEY!');
    //         console.log(str);
    //     }
    //     this.helper.msgRoom(str, data.channel);
    // }

    endgame = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !endgame command ends the current game of OhNo. The player with the highest score is considered the winner. Permission: OP only. Usage: !endgame`, data.channel);
            return;
        }
        if (!this.helper.isUserChatOP(data)) return;
        let str = this.defaultMessage;
        if (this.game.isInProgress) {
            this.game.endPrematurely();
            str = this.game.results;
        } else {
            str = `There is no game in progress. Start one with !startgame`;
        }
        if (this.game.containsAllBots()) {
            str += ` The game consists of bots only; please use the !start command to start the next game.`;
        } else {
            str += ` Use !ready to ready up for the next game. Game begins when all approved players are ready.`;
        }
        this.helper.msgRoom(str, data.channel);
    }

    removeplayer = (args, data) => {
        if (this.helper.insufficientArgs(args)) {
            this.helper.msgRoom(`The !removeplayer command does one of two things depending on whether a game is in progress. If the game is in progress, specified users are converted to bots. If the game is not in progress, specified users are removed from the game completely. Permission: OP only. Usage: !removeplayer name1, name2, etc`, data.channel);
            return;
        }
        if (!this.helper.isUserChatOP(data)) return;
        let successes = 0;
        let failures = 0;
        args.split(', ').forEach(username => {
            if (this.game.removePlayer(username)) {
                successes++;
            } else {
                failures++;
            }
        });
        let str = this.defaultMessage;
        if (failures === 0) {
            str = `Removed ${successes} player${successes === 1 ? '' : 's'} from the game. Approved / total players is now ${this.game.getApprovedPlayers().length} / ${this.game.allPlayers.length}.`;
        } else if (successes === 0) {
            str = `Failed to remove any players from the game, check your syntax! Make sure the names are spelled correctly and the players are in the game.`;
        } else {
            str = `Successfully removed ${successes} player${successes === 1 ? '' : 's'} from the game, failed to remove ${failures} player${failures === 1 ? '' : 's'} to the game. Maybe some players were not in the game, or the names were misspelled, or they aren't in the room.`;
        }
        this.helper.msgRoom(str, data.channel);
    }

    listplayers = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !listplayers command shows all players who are currently in the game. Permission: any. Usage: !listplayers`, data.channel);
            return;
        }
        if (this.game.allPlayers.length === 0) {
            this.helper.msgRoom(`There are no players yet. Players must use the !join command to join, and an OP must !approve them before they can play.`, data.channel);
        }else {
            let str = ``;
            let unapproved = [];
            let approvedReady = [];
            let approvedUnready = [];
            let ingameUnready = [];
            let ingameReady = [];
            this.game.allPlayers.forEach(player => {
                if (!player.isApproved) {
                    unapproved.push(player);
                } else if (this.game.isInProgress && this.game.players.includes(player)) {
                    if (player.isReady) {
                        ingameReady.push(player);
                    } else {
                        ingameUnready.push(player);
                    }
                } else {
                    if (player.isReady) {
                        approvedReady.push(player);
                    } else {
                        approvedUnready.push(player);
                    }
                }
            })
            const playersToString = (players, withScore=false) => {
                return players.map(player => player.getName() + (withScore ? ` (${player.score.getValue()} points)` : '')).join(', ');
            }
            str += `${unapproved.length > 0 ? `Unapproved players: ${playersToString(unapproved)}.` : `There are no unapproved players.`}`
            //str += `${approved.length > 0 ? ` Approved players${this.game.isInProgress ? ` (not in active game)` : ``}: ${playersToString(approved)}` : ``}`
            str += `${approvedUnready.length > 0 ? ` Approved unready players${this.game.isInProgress ? ` (not in active game)` : ``}: ${playersToString(approvedUnready)}.` : `.`}`
            str += `${approvedReady.length > 0 ? ` Approved ready players${this.game.isInProgress ? ` (not in active game)` : ``}: ${playersToString(approvedReady)}.` : `.`}`
            str += `${ingameUnready.length > 0 ? ` Approved unready players (in active game): ${playersToString(ingameUnready, true)}.` : `.`}`
            str += `${ingameReady.length > 0 ? ` Approved ready players (in active game): ${playersToString(ingameReady, true)}.` : `.`}`
            //if (this.game.isInProgress) str += ` ${ingame.length > 0 ? `Approved players in current game: ${playersToString(ingame, true)}` : `There are no players in the current game... somehow`}.`
            this.helper.msgRoom(str, data.channel);
        }
    }
};

module.exports.OhNo = OhNo;
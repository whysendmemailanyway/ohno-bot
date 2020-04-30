const OhNoGame = require('../src/OhNoGame').default;
const OhNoHelper = require('../src/OhNoHelper').default;

class OhNo {
    constructor(fChatClient, channel) {
        this.channel = channel;
        console.log('CHANNEL:');
        console.log(this.channel);
        this.fChatClient = fChatClient;
        this.game = new OhNoGame();
        this.helper = new OhNoHelper(this.fChatClient, this.game, this.channel);
        this.defaultMessage = `I am broken... sorry!`;

        this.aliases = {
            //addp: this.addplayer,
            //addplayers: this.addplayer,
            accept: this.acceptb4,
            challenge: this.challengeb4,
            confg: this.configuregame,
            
            removep: this.removeplayer,
            removeplayers: this.removeplayer,
            remp: this.removeplayer,
            delp: this.removeplayer,
            
            listp: this.listplayers,
            
            sc: this.shortcuts,
            shortc: this.shortcuts,
            scuts: this.shortcuts,
            
            startg: this.startgame,
            start: this.startgame,

            startr: this.startround,
           
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
            }
        }
    }

    shortcuts = (args, data) => {
        if (this.helper.helpArgs()) {
            this.helper.msgRoom(`The !shortcuts command shows aliases for existing commands. Permission: any. Usage: !shortcuts`, data.channel);
            return;
        }
        let s = [
            //'!addplayer: !addplayers, !addp.',
            '!acceptb4: !accept',
            '!challengeb4: !challenge',
            '!configuregame: !confg.',
            '!endgame: !stopgame, !stopg, !stop, !endg, !end.',
            '!joingame: !joing, !join',
            '!leavegame: !leaveg, !leave.',
            '!listplayers: !listp.',
            '!removeplayer: !removeplayers, !removep, !remp, !delp.',
            '!shortcuts: !shortc, !scuts, !sc.',
            '!startgame: !startg, !start.',
            '!startround: !startr.'
        ]
        this.helper.msgRoom(s.join(' '), data.channel);
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
            if (!commandObj) {
                str = `There was an error parsing your command, please try different syntax.`;
                failed = true;
            } else {
                let play = {
                    card: player.findCardByName(commandObj.cardname),
                    wildColor: commandObj.wildcolor || null,
                    withShout: commandObj.shout || false
                }
                console.log(`Parsed player's play as:`);
                console.log(play);
                failed = this.game.playCard(play.card, player, play.wildColor, play.withShout);
                str = this.game.results;
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
        } else {
            this.game.pass();
            str = `${this.game.currentPlayer.getName()} drew a card. Use !play to play it, or !pass to pass your turn.`;
            str += this.helper.promptCurrentPlayer();
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
            let oldName = this.game.currentPlayer.getName();
            this.game.pass();
            str = `${oldName} passed their turn.`;
            str += this.helper.promptCurrentPlayer();
        }
        this.helper.msgRoom(str, data.channel);
    }

    configuregame = (args, data) => {
        if (this.helper.insufficientArgs(args)) {
            this.helper.msgRoom(`The !configuregame command is used to specify certain properties on the game object: startingHandSize, targetScore, and maxPlayers. These can be set at any time, even when a game is in progress, and setting targetScore below any player's current score will immediately end the game. Permission: OP only. Usage: !configuregame key1=value1, key2=value2, etc`, data.channel);
            return;
        }
        if (!this.helper.isUserChatOP(data)) return;
        args.split(', ').forEach(prop => {
            if (this.game.parseProp(prop)) {
                successes++;
            } else {
                failures++;
            }
        });
        let str = this.defaultMessage;
        if (failures === 0) {
            str = `Updated ${successes} configuration properties.`;
        } else if (successes === 0) {
            str = `Failed to update any configuration properties, check your syntax!`;
        } else {
            str = `Successfully updated ${successes} configuration propert${successes === 1 ? 'y' : 'ies'} to the game, failed to update ${failures} configuration propert${failures === 1 ? 'y' : 'ies'} to the game.`;
        }
        this.helper.msgRoom(str, data.channel);
    }

    joingame = (args, data) => {
        if (this.helper.insufficientArgs(args)) {
            this.helper.msgRoom(`The !joingame command does one of two things depending on whether a game is in progress. If the game is in progress, the user who entered this command replaces their botified self. If the game is not in progress, the user who entered this command is added to the game. If they are an OP, they will be approved automatically; otherwise, an OP must approve them before they can actually play. Usage: !joingame`, data.channel);
            return;
        }
        let username = data.character;
        let str = this.defaultMessage;
        if (this.game.addPlayer(username)) {
            str = `Added ${username} to the game.`;
            let player = this.game.findPlayerWithName(username);
            if (player.isApproved) {
                str += ` ${username} is still approved from a previous !approve command.`;
            } else {
                if (this.helper.isUserChatOP(data)) {
                    this.game.approvePlayer(username);
                    str += ` Since they are an OP, they have been approved automatically.`;
                } else {
                    str += ` An OP must approve them before they can actually play.`;
                }
            }
            str += ` Approved / total players is now ${this.game.getApprovedPlayers().length} / ${this.game.allPlayers.length}.`;
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
        if (this.game.removePlayer(data.character)) {
            // anounce that the player left, or announce the new bot name
        } else {
            str = `Failed to remove ${data.character} from the game. Maybe they weren't in the game to begin with?`;
        }
        this.helper.msgRoom(str, data.channel);
    }

    // unconfirm = (args, data) => {
    //     // unconfirm self (but stay in game)
    // }

    startround = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !startround command begins a new round of OhNo with the current approved players. Permission: OP only. Usage: !startround`, data.channel);
            return;
        }
        if (!this.helper.isUserChatOP(data)) return;
        let str = this.defaultMessage;
        if (this.game.isRoundInProgress) {
            str = `The round is already in progress. Please finish the current round before starting a new one.`;
        } else if (this.game.getApprovedPlayers().length < 2) {
            let length = this.game.getApprovedPlayers().length;
            str = `You need at least two approved players in the game before you can start the round. Currently, there ${length === 0 ? 'are no' : 'is only one'} approved player${length === 0 ? 's' : ''} in the game. Players can join the game with !joingame, and an OP can approve them with !approve.`;
        } else {
            this.game.startRound();
            str = `[b]A new round has begun![/b]\n` + this.helper.promptCurrentPlayer();
        }
        this.helper.msgRoom(str, data.channel);
    }

    startgame = (args, data) => {
        if (this.helper.helpArgs(args)) {
            this.helper.msgRoom(`The !startgame command begins a new game of OhNo with the current players. Permission: OP only. Usage: !startgame`, data.channel);
            return;
        }
        if (!this.helper.isUserChatOP(data)) return;
        let str = this.defaultMessage;
        if (this.game.isInProgress) {
            str = `The game is already in progress. Please finish or end the current game before starting a new one. You can prematurely end the game with the !endgame command.`;
        } else if (this.game.getApprovedPlayers().length < 2) {
            let length = this.game.getApprovedPlayers().length;
            str = `You need at least two approved players in the game before you can start it. Currently, there ${length === 0 ? 'are no' : 'is only one'} approved player${length === 0 ? 's' : ''} in the game. Players can join the game with !joingame, and an OP can approve them with !approve.`;
        } else {
            this.game.startGame();
            str = `[b]A new game has begun![/b]\n` + this.helper.promptCurrentPlayer();
        }
        this.helper.msgRoom(str, data.channel);
    }

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
        if (this.game.players.length === 0) {
            this.helper.msgRoom(`There are no players yet. Add some with !addplayer name1, name2, etc`, data.channel);
        }else {
            this.helper.msgRoom(`Starting with the first player and going clockwise (U = unapproved): ${this.game.players.map(player => player.getName() + player.isApproved ? '' : ' (U)').join(', ')}.`, data.channel);
        }
    }
};

module.exports.OhNo = OhNo;
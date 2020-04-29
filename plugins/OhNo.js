const OhNoGame = require('../src/OhNoGame').default;
const OhNoHelper = require('../src/OhNoHelper').default;

class OhNo {
    constructor(fChatClient, channel) {
        this.channel = channel;
        this.fChatClient = fChatClient;
        this.helper = new OhNoHelper(this.fChatClient);
        this.game = new OhNoGame();
        this.defaultMessage = `I am broken... sorry!`;

        this.aliases = {
            //addp: this.addplayer,
            //addplayers: this.addplayer,
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
            '!configuregame: !confg.',
            '!joingame: !joing, !join',
            '!leavegame: !leaveg, !leave.',
            '!listplayers: !listp.',
            '!removeplayer: !removeplayers, !removep, !remp, !delp.',
            '!shortcuts: !shortc, !scuts, !sc.',
            '!startgame: !startg, !start.',
            '!endgame: !stopgame, !stopg, !stop, !endg, !end.'
        ]
        this.helper.msgRoom(s.join(' '), data.channel);
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
            str = `${oldName} passed their turn, it is now ${this.game.currentPlayer}'s turn. Play a card with !play, or draw a card with !draw.`;
            // TODO: PM the current player their hand
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
            str = 'oh my a new game idk wat 2 do halp';
            // TODO: start the game!!!
            // * PM the player who's turn it is, let them know how their hand and how to enter their play
            // * set str to show who dealt and which card was turned up; let players know who should have been PM'd
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

    // too powerful; we don't want to ping people who haven't explicitly joined the game
    // addplayer = (args, data) => {
    //     // TODO: implement a confirm functionality.
    //     // Players should have to enter a specific command to join a game.
    //     // Otherwise, it's not cool to send them private messages.
    //     if (!this.helper.isUserChatOP(data)) return;
    //     if (this.helper.insufficientArgs(args)) {
    //         this.helper.msgRoom(`The !addplayer command does one of two things depending on whether a game is in progress. If the game is in progress, specified users replace their botified selves. If the game is not in progress, specified users are added to the game. Usage: !addplayer name1, name2, etc`, data.channel);
    //         return;
    //     }
    //     let successes = 0;
    //     let failures = 0;
    //     args.split(', ').forEach(username => {
    //         if (this.helper.isUserInChannel(username, data.channel) && this.game.addPlayer(username)) {
    //             successes++;
    //             if (username === data.character) {
    //                 this.game.findPlayerWithName(username).isApproved = true;
    //                 console.log(`Automatically confirmed ${username} since they added themselves.`);
    //             }
    //         } else {
    //             failures++;
    //         }
    //     });
    //     let str = this.defaultMessage;
    //     if (failures === 0) {
    //         str = `Added ${successes} player${successes === 1 ? '' : 's'} to the game. Total players is now ${this.game.players.length}.`;
    //     } else if (successes === 0) {
    //         str = `Failed to add any players to the game, check your syntax! Make sure the names are spelled correctly and the players are in the room.`;
    //     } else {
    //         str = `Successfully added ${successes} player${successes === 1 ? '' : 's'} to the game, failed to add ${failures} player${failures === 1 ? '' : 's'} to the game. Maybe some players were already in the game, or the names were misspelled, or they aren't in the room.`;
    //     }
    //     this.helper.msgRoom(str, data.channel);
    // }

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
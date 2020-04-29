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
            addp: this.addplayer,
            addplayers: this.addplayer,
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
            endg: this.endgame,
            end: this.endgame,
            // dirty debug, does whatever i wants it to does
            ddbug: (args, data) => {
                console.log(args, data);
            }
        }
    }

    configuregame = (args, data) => {
        if (!this.helper.isUserChatOP(data)) return;
        if (this.helper.insufficientArgs(args)) {
            this.helper.msgRoom(`The !configuregame command is used to specify certain properties on the game object: startingHandSize, targetScore, and maxPlayers. These can be set at any time, even when a game is in progress, and setting targetScore below a player's current score will immediately end the game. Usage: !configuregame key1=value1, key2=value2, etc`, data.channel);
            return;
        }
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

    startgame = (args, data) => {
        if (!this.helper.isUserChatOP(data)) return;
        if (this.helper.helpArgs()) {
            this.helper.msgRoom(`The !startgame command begins a new game of OhNo with the current players. Usage: !startgame`, data.channel);
            return;
        }
        let str = this.defaultMessage;
        if (this.game.isInProgress) {
            str = `The game is already in progress. Please finish or end the current game before starting a new one. You can prematurely end the game with the !endgame command.`;
        } else if (this.game.players.length < 2) {
            str = `You need at least two players in the game before you can start it. Currently, there ${this.game.players.length === 0 ? 'are no' : 'is only one'} player in the game. Use the !addplayer command to add more.`;
        } else {
            this.game.startGame();
            str = 'oh my a new game idk wat 2 do halp';
            // TODO: start the game!!!
            // * PM each player to show them their starting hand; for the player who's turn it is, let them know how to enter their play
            // * set str to show who dealt and which card was turned up; let players know they should have been PM'd
        }
        this.helper.msgRoom(str, data.channel);
    }

    endgame = (args, data) => {
        if (!this.helper.isUserChatOP(data)) return;
        if (this.helper.helpArgs()) {
            this.helper.msgRoom(`The !endgame command ends the current game of OhNo. The player with the highest score is considered the winner. Usage: !endgame`, data.channel);
            return;
        }
        let str = this.defaultMessage;
        if (this.game.isInProgress) {
            this.game.endPrematurely();
            str = 'game over rip';
            // TODO: report results
        } else {
            str = `There is no game in progress. Start one with !startgame`;
        }
        this.helper.msgRoom(str, data.channel);
    }

    shortcuts = (args, data) => {
        if (this.helper.helpArgs()) {
            this.helper.msgRoom(`The !shortcuts command shows aliases for existing commands. Usage: !shortcuts`, data.channel);
            return;
        }
        let s = [
            '!addplayer: !addplayers, !addp.',
            '!configuregame: !confg.',
            '!listplayers: !listp.',
            '!removeplayer: !removeplayers, !removep, !remp, !delp.',
            '!shortcuts: !shortc, !scuts, !sc.',
            '!startgame: !startg, !start.',
            '!endgame: !endg, !end.'
        ]
        this.helper.msgRoom(s.join(' '), data.channel);
    }

    addplayer = (args, data) => {
        // TODO: implement a confirm functionality.
        // Players should have to enter a specific command to join a game.
        // Otherwise, it's not cool to send them private messages.
        if (!this.helper.isUserChatOP(data)) return;
        if (this.helper.insufficientArgs(args)) {
            this.helper.msgRoom(`The !addplayer command does one of two things depending on whether a game is in progress. If the game is in progress, specified users replace their botified selves. If the game is not in progress, specified users are added to the game. Usage: !addplayer name1, name2, etc`, data.channel);
            return;
        }
        let successes = 0;
        let failures = 0;
        args.split(', ').forEach(username => {
            if (this.helper.isUserInChannel(username, data.channel) && this.game.addPlayer(username)) {
                successes++;
            } else {
                failures++;
            }
        });
        let str = this.defaultMessage;
        if (failures === 0) {
            str = `Added ${successes} player${successes === 1 ? '' : 's'} to the game. Total players is now ${this.game.players.length}.`;
        } else if (successes === 0) {
            str = `Failed to add any players to the game, check your syntax! Make sure the names are spelled correctly and the players are in the room.`;
        } else {
            str = `Successfully added ${successes} player${successes === 1 ? '' : 's'} to the game, failed to add ${failures} player${failures === 1 ? '' : 's'} to the game. Maybe some players were already in the game, or the names were misspelled, or they aren't in the room.`;
        }
        this.helper.msgRoom(str, data.channel);
    }

    removeplayer = (args, data) => {
        if (!this.helper.isUserChatOP(data)) return;
        if (this.helper.insufficientArgs(args)) {
            this.helper.msgRoom(`The !removeplayer command does one of two things depending on whether a game is in progress. If the game is in progress, specified users are converted to bots. If the game is not in progress, specified users are removed from the game completely. Usage: !removeplayer name1, name2, etc`, data.channel);
            return;
        }
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
            str = `Removed ${successes} player${successes === 1 ? '' : 's'} from the game. Total players is now ${this.game.players.length}.`;
        } else if (successes === 0) {
            str = `Failed to remove any players from the game, check your syntax! Make sure the names are spelled correctly and the players are in the game.`;
        } else {
            str = `Successfully removed ${successes} player${successes === 1 ? '' : 's'} from the game, failed to remove ${failures} player${failures === 1 ? '' : 's'} to the game. Maybe some players were not in the game, or the names were misspelled, or they aren't in the room.`;
        }
        this.helper.msgRoom(str, data.channel);
    }

    listplayers = (args, data) => {
        if (this.helper.helpArgs()) {
            this.helper.msgRoom(`The !listplayers command shows all players who are currently in the game. Usage: !listplayers`, data.channel);
            return;
        }
        if (this.game.players.length === 0) {
            this.helper.msgRoom(`There are no players yet. Add some with !addplayer name1, name2, etc`, data.channel);
        }else {
            this.helper.msgRoom(`Starting with the first player and going clockwise: ${this.game.players.map(player => player.name).join(', ')}.`, data.channel);
        }
    }
};

module.exports.OhNo = OhNo;
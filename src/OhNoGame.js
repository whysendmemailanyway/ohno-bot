const Deck = require('card-deck');
const OhNoCard = require('./OhNoCard').default;
const OhNoPlayer = require('./OhNoPlayer').default;
const OhNoScore = require('./OhNoScore').default;
const DECKDATA = require('./OhNoDeckData');
const UTILS = require('./OhNoUtils');

const repeatFunction = (fn, times) => {
    for (let i = 0; i < times; i++) {
        fn();
    }
}

const makeNumberCards = () => {
    let results = [];
    DECKDATA.COLORS.forEach(color => {
        DECKDATA.NUMBER_RANKS.forEach((rank, i) => {
            let name = `${color.toLowerCase()} ${rank.toLowerCase()} (${i})`;
            repeatFunction(() => results.push(new OhNoCard(rank, i, color, name)), i === 0 ? 1 : 2);
        });
    })
    return results;
}

const makeActionCards = () => {
    let results = [];
    DECKDATA.COLORS.forEach(color => {
        DECKDATA.ACTION_RANKS.forEach(rank => {
            repeatFunction(() => results.push(new OhNoCard(rank, 20, color, `${color.toLowerCase()} ${rank.toLowerCase()}`)), 2);
        });
    })
    return results;
}

const makeWildCards = () => {
    let results = [];
    DECKDATA.WILD_RANKS.forEach(rank => {
        repeatFunction(() => results.push(new OhNoCard(rank, 50)), 4);
    });
    return results;
}

const makeMatcher = () => {
    let colors = [...DECKDATA.COLORS, 'BLOND'].join('|');
    let ranks = [...DECKDATA.NUMBER_RANKS, ...DECKDATA.ACTION_RANKS].join('|');
    let wildRanks = DECKDATA.WILD_RANKS.join('|');
    //return new RegExp(`(?<cardname>(?:${colors}) (?:${ranks})|(?:WILD(?: BREED 4)*))(?: *(?<wildcolor>${colors})*)(?: *(?<shout>!*SHOUT)*)`, `gi`);
    const regstr = `(?<cardname>((?:BLACK|WHITE|BLONDE*|BROWN) (?:MOUSE|BIRD|BUNNY|BASS|CAT|DOG|SHEEP|DEER|PIG|COW|SKIP|REVERSE|BREED 2))|(?:WILD(?: BREED 4)*)|(?:caitlyn greyiers|daniel greyiers|greyiers|ellen strand|caitlyn|daniel|ellen|strand|danae|nipperkin))(?: (?<wildcolor>BLACK|WHITE|BLONDE*|BROWN))*(?: (?<shout>!*SHOUT))*`;
    return new RegExp(regstr, `gi`);
}

module.exports.default = class OhNoGame {
    constructor() {
        this.deck;
        this.discards;
        // holds confirmed and unconfirmed players
        this.allPlayers = [];
        // holds confirmed players only once the game starts
        this.players = [];
        this.currentPlayer;
        this.dealerIndex = 0;
        this.playerIndex;
        this.goingClockwise;
        this.wildColor;
        this.isInProgress = false;
        this.draw4LastTurn;
        this.results;
        this.hasDrawnThisTurn;
        this.isRoundInProgress = false;
        this.config = {
            startingHandSize: 7,
            targetScore: 500,
            maxPlayers: 10
        }
    }

    parsePlay(args) {
        let match = this.matcher.exec(args);
        if (!match) {
            console.log(match);
            this.matcher.lastIndex = 0;
            return match;
        }
        let response = {};
        let friendsMap = {
            'caitlyn': 'white bunny',
            'daniel': 'white bunny',
            'daniel greyiers': 'white bunny',
            'caitlyn greyiers': 'white bunny',
            'greyiers': 'white bunny',
            'ellen': 'brown bunny',
            'ellen strand': 'brown bunny',
            'ellen strand': 'brown bunny',
            'danae': 'blonde dog',
            'nipperkin': 'white mouse',
        }
        let friendKeys = Object.keys(friendsMap);
        for (let group in match.groups) {
            let value = match.groups[group];
            if (group === 'cardname') {
                if(friendKeys.includes(value.toLowerCase())) {
                    value = friendsMap[value.toLowerCase()];
                } else {
                    let words = value.split(' ');
                    if (words.length > 1) {
                        switch (words[0].toLowerCase()) {
                            case 'blond': words[0] = 'blonde'; break;
                        }
                        switch (words[1].toLowerCase()) {
                            case 'rat': words[1] = 'mouse'; break;
                            case 'fish': words[1] = 'bass'; break;
                            case 'lapine': case 'rabbit': words[1] = 'bunny'; break;
                            case 'feline': words[1] = 'cat'; break;
                            case 'canine': words[1] = 'dog'; break;
                        }
                        value = words.join(' ');
                    }
                }
            } else if (group === 'wildcolor' && value !== undefined && value.toLowerCase() === 'blond') {
                value = 'blonde';
            } else if (group === 'shout' && value !== undefined && value.toLowerCase() === '!shout') value = 'shout';
            response[group] = value;
        }
        console.log(response);
        this.matcher.lastIndex = 0;
        return response;
    }

    parseProp(property) {
        let arr = property.split('=');
        if (arr.length !== 2) {
            console.log(`Bad parseProp input: ${property}`);
            return false;
        }
        let key = arr[0];
        let value = arr[1];
        if (this.config.hasOwnProperty(key)) {
            this.config[key] = parseInt(value);
            console.log(`Updated config ${key} to ${value}.`);
            if (key === 'targetScore') this.checkForVictory();
            return true;
        }
        console.log(`No such config property exists: ${key}`);
        return false;
    }

    getApprovedPlayers() {
        return this.allPlayers.filter(player => player.isApproved);
    }

    getApprovedReadiedPlayers() {
        return this.allPlayers.filter(player => player.isApproved && player.isReady);
    }

    containsAllBots() {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].isBot) return false;
        }
        return true;
    }

    approvePlayer(nameOrIndex) {
        let player = this.findPlayerWithName(nameOrIndex, this.allPlayers);
        if (!player) player = this.allPlayers[nameOrIndex];
        if (!player) {
            console.log(`No player with name or index ${nameOrIndex} found.`);
            return false;
        }
        if (player.isApproved) {
            console.log(`${player.getName()} is already approved.`);
            return false;
        }
        if (this.getApprovedPlayers().length >= this.config.maxPlayers) {
            console.log(`Unable to approved ${player.getName()}, already at the maximum of ${this.config.maxPlayers} approved players.`);
            return false;
        }
        player.isApproved = true;
        console.log(`Approved ${player.getName()}.`);
        return true;
    }

    addPlayer(name) {
        if (this.isInProgress && this.getApprovedPlayers().length >= this.config.maxPlayers) {
            console.log(`Unable to add ${name}, already at the maximum of ${this.config.maxPlayers} approved players.`);
            return false;
        }
        for (let i = 0; i < this.allPlayers.length; i++) {
            let player = this.allPlayers[i];
            if (player.name !== name) continue;
            if (player.isBot) {
                if (player.wasHuman) {
                    player.isBot = false;
                    player.isReady = false;
                    console.log(`Unbotted ${player.getName()}.`);
                    return true;
                } else {
                    console.log(`Player is already in the game and was always a bot`);
                    return false;
                }
            } else {
                console.log(`Unable to add new player ${name}, a player with that name is already in the game.`);
                return false;
            }
        }
        let player = new OhNoPlayer(name);
        this.allPlayers.push(player);
        return true;
    }

    renamePlayer(nameOrIndex, alias) {
        let player = this.findPlayerWithName(nameOrIndex, this.allPlayers);
        if (!player) player = this.allPlayers[nameOrIndex];
        if (!player) {
            console.log(`No player with name or index ${nameOrIndex} found.`);
            return false;
        }
        for (let i = 0; i < this.allPlayers.length; i++) {
            if (alias !== null && this.allPlayers.name === alias || this.allPlayers.alias === alias) {
                console.log(`A player already exists with name or alias ${alias}.`);
                return false;
            }
        }
        player.setAlias(alias);
        if (alias !== null) {
            console.log(`Gave ${player.name} new alias of ${player.getName()}.`);
        } else {
            console.log(`Removed alias from ${player.getName()}.`);
        }
        return true;
    }

    removePlayer(nameOrIndex) {
        let index = this.findIndexOfName(nameOrIndex, this.allPlayers);
        if (index === null) index = parseInt(nameOrIndex);
        if (!Number.isInteger(index) || index < 0 || index >= this.allPlayers.length) {
            console.log(`Erroneous index: ${index} from input ${nameOrIndex}`);
            return false;
        }
        if (!this.isInProgress) {
            this.allPlayers.splice(index, 1);
            console.log('Removed the player from index ' + index);
            return true;
        } else {
            let player = this.allPlayers[index];
            if (this.players.includes(player)) {
                if (!player.isBot) {
                    player.isBot = true;
                    player.isReady = true;
                    console.log('Set player to bot at index ' + index);
                    return true;
                }
                console.log('Game is in progress, but given user is already a bot.');
                return false;
            }
            this.allPlayers.splice(i, 1);
            console.log('Removed the player from index ' + index);
            return true;
        }
        
    }

    drawOne() {
        let card = this.deck.draw();
        if (this.deck.remaining() === 0) {
            console.log('Ran out of cards, reshuffling all but the top card of the discard pile into a new deck...');
            if (this.discards.remaining() <= 1) throw `Uh oh! Not enough cards in the discard pile to reshuffle. Something is wrong...`;
            this.deck.addToTop(this.discards.drawFromBottom(this.discards.remaining() - 1));
            this.deck.shuffle();
            console.log('Reshuffled, the deck now contains ' + this.deck.remaining() + ' cards.');
        }
        return card;
    }

    drawX(x) {
        let cards = [];
        for (let i = 0; i < x; i++) {
            cards.push(this.drawOne());
        }
        return cards;
    }

    pass() {
        this.players.forEach(player => player.isInShoutDanger = false);
        this.results = ``;
        if (!this.hasDrawnThisTurn) {
            this.currentPlayer.addToHand(this.drawOne());
            console.log(`${this.currentPlayer.getName()} drew a card.`);
            this.hasDrawnThisTurn = true;
        } else {
            console.log(`${this.currentPlayer.getName()} passes their turn.`);
            this.updatePlayerIndex();
        }
    }

    startGame() {
        console.log(`The game is afoot! Have fun. :-)`);
        this.dealerIndex = 0;
        this.results = ``;
        this.players = this.getApprovedReadiedPlayers();
        this.players.forEach(player => player.resetForGame());
        this.isInProgress = true;
        this.startRound();
    }

    startRound() {
        this.hasDrawnThisTurn = false;
        this.players.forEach(player => player.resetForRound());
        this.results = ``;
        this.isRoundInProgress = true;
        this.playerIndex = this.dealerIndex;
        if (this.playerIndex >= this.players.length) this.playerIndex = 0;
        this.goingClockwise = true;
        this.currentDealer = this.players[this.dealerIndex];
        this.matcher = makeMatcher();
        this.deck = new Deck([...makeNumberCards(), ...makeActionCards(), ...makeWildCards()]);
        this.deck.shuffle();
        this.discards = new Deck();
        this.discards._stack = [];
        this.wildColor = null;
        this.draw4LastTurn = false;
        this.dealHands();
        console.log(`All players received ${this.config.startingHandSize} cards.`);
        this.playCard(this.drawOne());
    }

    canPlayerPlay(player=this.currentPlayer) {
        for (let i = 0; i < player.hand.length; i++) {
            if (this.isCardPlayable(player.hand[i])) return true;
        }
        return false;
    }

    startTurn() {
        //this.results = '';
        console.log();
        this.currentPlayer = this.players[this.playerIndex];
        console.log(`It is ${this.currentPlayer.getName()}'s turn.`);
        this.hasDrawnThisTurn = false;
    }

    isCardPlayable = (newCard, oldCard=null) => {
        if (!oldCard) oldCard = this.discards.top();
        if (newCard.isWild()) return true;
        if (oldCard.isWild()) return this.wildColor === null || newCard.color.toLowerCase() === this.wildColor.toLowerCase();
        if (newCard.color === oldCard.color) return true;
        return newCard.rank === oldCard.rank;
    }

    findPlayerWithName(name, array=this.players) {
        return array[this.findIndexOfName(name, array)];
    }

    findIndexOfName(name, array=this.players) {
        for (let i = 0; i < array.length; i++) {
            if (array[i].name === name) return i;
        }
        return null;
    }

    getPreviousPlayer() {
        let direction = this.goingClockwise ? 1 : -1;
        let index = this.playerIndex - direction;
        while (index < 0) index += this.players.length;
        while (index >= this.players.length) index -= this.players.length;
        return this.players[index];
    }

    handleDraw4() {
        return `${UTILS.titleCase(DECKDATA.RANK_WILD_DRAW_4)} was played on ${this.currentPlayer.getName()}! Waiting for them to !accept or !challenge...`;
    }

    acceptDraw4() {
        let challengee = this.getPreviousPlayer();
        this.currentPlayer.addToHand(this.drawX(4));
        this.results = `${this.currentPlayer.getName()} accepts ${challengee.getName()}'s ${this.discards.top().getName()}! They draw 4 cards and miss their turn.`;
        this.endTurn(true);
    }

    isDraw4Legal(player, oldCard) {
        let offendingCards = [];
        for (let i = 0; i < player.hand.length; i++) {
            let card = player.hand[i];
            if (card.isWild()) continue;
            if (oldCard.isWild() && (this.wildColor === null || card.color.toLowerCase() === this.wildColor.toLowerCase())) {
                offendingCards.push(card);
            } else if (card.color === oldCard.color) {
                offendingCards.push(card);
            }
        }
        return offendingCards;
    }

    challengeDraw4() {
        let messages = [];
        const d4name = UTILS.titleCase(DECKDATA.RANK_WILD_DRAW_4);
        if (this.discards.top().rank === DECKDATA.RANK_WILD_DRAW_4) {
            if (!this.draw4LastTurn) {
                messages.push(`${this.currentPlayer.getName()} tried to challenge the play, but the ${d4name} was not played on them.`);
                return;
            }
            let challengee = this.getPreviousPlayer();
            messages.push(`${this.currentPlayer.getName()} challenges ${challengee.getName()}'s ${this.discards.top().getName()}!`);
            let oldCard = this.discards.top(2)[1];
            let offendingCards = this.isDraw4Legal(challengee, oldCard);
            messages.push(`\n${challengee.getName()} reveals their hand: ${challengee.handToString(true, card => offendingCards.includes(card))}\n`);
            let canPlay = offendingCards.length > 0;
            if (canPlay) {
                messages.push(`${challengee.getName()} played their ${d4name} illegally and now draws 4 cards!`);
                challengee.addToHand(this.drawX(4));
                this.endTurn(false);
            } else {
                messages.push(`${challengee.getName()} played their ${d4name} legally. Now ${this.currentPlayer.getName()} draws 6 cards and misses their turn, ouch!!`);
                this.currentPlayer.addToHand(this.drawX(6));
                this.endTurn(true);
            }
        } else {
            messages.push(`${this.currentPlayer.getName()} tried to challenge the play, but only ${d4name} can be challenged.`);
        }
        return this.setResultsWithArray(messages);
    }

    shout(player) {
        let playerInDanger = null;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].isInShoutDanger) {
                playerInDanger = this.players[i];
                break;
            }
        }
        if (playerInDanger === null) return `No players are in danger; players can only be called out when they have 1 card left in their hand after their turn and the next player has not yet taken a turn.`;
        if (player.isInShoutDanger) {
            player.hasShouted = true;
            player.isInShoutDanger = false;
            return `${player.getName()} has shouted [b][color=red]"OH NO!"[/color][/b]`;
        } else {
            playerInDanger.addToHand(this.drawX(2));
            return `${player.getName()} called out ${playerInDanger.getName()} and made them draw two cards!`;
        }
    }

    getSafestPlay(player = this.currentPlayer) {
        let safelyPlayDraw4 = this.isDraw4Legal(player, this.discards.top()).length === 0;
        let highestCard;
        for (let i = 0; i < player.hand.length; i++) {
            let card = player.hand[i];
            if (this.isCardPlayable(card)) {
                if (!highestCard) {
                    highestCard = card;
                } else if (card.score > highestCard) {
                    if (card.rank !== DECKDATA.RANK_WILD_DRAW_4 || safelyPlayDraw4) {
                        highestCard = card;
                    }
                }
            }
        }
        return {
            card: highestCard,
            wildColor: player.getMostCommonColor(),
            withShout: player.hand.length == 2
        };
    }

    getHighestPlayableCard(player = this.currentPlayer) {
        let highestCard;
        for (let i = 0; i < player.hand.length; i++) {
            let card = player.hand[i];
            if (this.isCardPlayable(card)) {
                if (!highestCard) {
                    highestCard = card;
                } else if (player.hand[i].score > highestCard) {
                    highestCard = player.hand[i];
                }
            }
        }
        return highestCard;
    }

    setResultsWithArray(messages) {
        this.results = messages.join(` `);
        console.log(this.results);
    }

    playCard(card, player, newWildColor, withShout = false) {
        this.players.forEach(player => player.isInShoutDanger = false);
        let messages = [];
        if (player) {
            if (!this.isCardPlayable(card)) {
                messages.push(`Hey! You can't play ${card.getName()} on ${this.discards.top().getName()}...`);
                this.setResultsWithArray(messages);
                return false;
            }
            if (card.isWild() && newWildColor === null) {
                messages.push(`${player.getName()} forgot to specify the wild color. Please review your !play command syntax and try again!`);
                this.setResultsWithArray(messages);
                return false;
            }
            player.removeFromHand(player.hand.indexOf(card));
            messages.push(`${player.getName()} played [b]${card.getName()}[/b]${card.isWild() ? ' and set the new color to [b]' + (UTILS.titleCase(newWildColor) + '[/b]') : ''}, ${player.hand.length} card${player.hand.length !== 1 ? 's' : ''} left in their hand.`);
            if (card.isWild() && newWildColor !== null) this.wildColor = UTILS.titleCase(newWildColor);
            if (player.hand.length === 0) {
                let nextPlayer = this.updatePlayerIndex(true);
                if (card.rank === DECKDATA.RANK_WILD_DRAW_4) {
                    nextPlayer.addToHand(this.drawX(4));
                    messages.push(`${nextPlayer.getName()} had to draw 4 cards!`);
                } else if (card.rank === DECKDATA.RANK_DRAW_2) {
                    nextPlayer.addToHand(this.drawX(2));
                    messages.push(`${nextPlayer.getName()} had to draw 2 cards!`);
                }
                messages.push(`${player.getName()} played their last card and won the round!!`);
                messages.push(this.endRound());
                this.setResultsWithArray(messages);
                return true;
            } else if (player.hand.length === 1) {
                player.isInShoutDanger = true;
            }
            if (withShout) messages.push(this.shout(player));
        } else {
            messages.push(`${this.currentDealer.getName()} dealt [b]${card.getName()}[/b] as the starting card.`);
            while (card.rank === DECKDATA.RANK_WILD_DRAW_4) {
                messages.push(`Whoops, can't start the game with ${DECKDATA.RANK_WILD_DRAW_4}! Reshuffling the deck and dealing a new starting card...`);
                this.deck.addToTop(card);
                this.deck.shuffle();
                card = this.drawOne();
                messages.push(`${this.currentDealer.getName()} dealt [b]${card.getName()}[/b] as the starting card.`);
            }
        }
        this.discards.addToTop(card);
        if (card.rank === DECKDATA.RANK_REVERSE) {
            this.goingClockwise = !this.goingClockwise;
            let newDirection = 'right';
            let oldDirection = 'left';
            if (this.goingClockwise) {
                newDirection = 'left';
                oldDirection = 'right';
            }
            messages.push(`${UTILS.titleCase(DECKDATA.RANK_REVERSE)}! Play now moves to the ${newDirection} instead of the ${oldDirection}.`);
            if (!player || this.players.length === 2) {
                this.playerIndex += 1; // offset to account for dealer being able to reverse to self AND for 2 player games
            }
        }
        this.updatePlayerIndex();
        let skip = false;
        if (card.rank === DECKDATA.RANK_WILD_DRAW_4) {
            this.wildColor = UTILS.titleCase(newWildColor);
            this.draw4LastTurn = true;
            messages.push(this.handleDraw4());
            this.setResultsWithArray(messages);
            return true;
        } else {
            if (card.rank === DECKDATA.RANK_SKIP) {
                messages.push(`${UTILS.titleCase(DECKDATA.RANK_SKIP)}! ${this.currentPlayer.getName()} misses their turn.`);
                skip = true;
            } else if (card.rank === DECKDATA.RANK_DRAW_2) {
                this.currentPlayer.addToHand(this.drawX(2));
                messages.push(`Aw, ${this.currentPlayer.getName()} had to draw 2 and miss their turn.`);
                skip = true;
            }
            this.endTurn(skip);
            this.setResultsWithArray(messages);
            return true;
        }
    }

    endTurn(skip) {
        this.draw4LastTurn = false;
        if (skip) {
            this.updatePlayerIndex();
        }
    }

    updatePlayerIndex(justChecking = false) {
        let direction = this.goingClockwise ? 1 : -1;
        let newIndex = this.playerIndex + direction;
        while (newIndex < 0) newIndex += this.players.length;
        while (newIndex >= this.players.length) newIndex -= this.players.length;
        if (justChecking) {
            return this.players[newIndex];
        } else {
            this.playerIndex = newIndex;
            this.currentPlayer = this.players[this.playerIndex];
        }
    }

    endRound() {
        this.isRoundInProgress = false;
        let cards = [];
        let messages = [];
        let otherPlayerScores = [];
        this.players.forEach(player => {
            if (!player.isBot) player.isReady = false;
            if (player === this.currentPlayer) return;
            cards.push(...player.hand);
            otherPlayerScores.push({name: player.getName(), total: player.score.getValue()});
        });
        let score = new OhNoScore(cards);
        this.currentPlayer.score.addScore(score);
        messages.push(`${this.currentPlayer.getName()} scored ${score.toString()}`);
        let totalScore = this.currentPlayer.score.getValue();
        messages.push(`This brings their total score to ${totalScore} points!`);
        if (this.checkForVictory()) return this.results;
        if (otherPlayerScores.length > 0) {
            otherPlayerScores.sort((a, b) => {
                return (b.total - a.total);
            });
            messages.push(...otherPlayerScores.map(obj => `\n    ${obj.name} has ${obj.total} points.`));
        }
        this.dealerIndex += 1;
        if (this.dealerIndex >= this.players.length) this.dealerIndex = 0;
        messages.push(`\nIt is now ${this.players[this.dealerIndex].getName()}'s turn to deal.`);
        this.setResultsWithArray(messages);
        return this.results;
    }

    checkForVictory() {
        let winners = this.players.filter(player => player.score.getValue() >= this.config.targetScore);
        if (winners.length > 0) {
            this.endGame(winners);
            return true;
        } else {
            return false;
        }
    }

    endPrematurely() {
        let highestScore = this.players.reduce((highest, b) => {
            if (b.score.getValue() > highest) return b;
            return highest;
        }, this.players[0].score.getValue());
        console.log('highest score');
        console.log(highestScore);
        this.endGame(this.players.filter(player => player.score.getValue() >= highestScore));
    }

    endGame(winners) {
        let str = '';
        if (winners.length > 0) {
            winners.sort((a, b) => b.score.getValue() - a.score.getValue());
            let highestScore = winners[0].score.getValue();
            console.log();
            if (highestScore >= this.config.targetScore) {
                str += `${winners.map(player => player.getName()).join(', ')} ${highestScore > this.config.targetScore ? 'surpassed' : 'met'} the target score of ${this.config.targetScore} and won the game!!!`;
            } else {
                str += `The game ended early, so ${winners.map(player => player.getName()).join(winners.length <= 2 ? ` and ` : `, `)} won with ${highestScore} points!`;
            }
            console.log();
            if (winners.length === 1) {
                str += `\nWinning total: ${winners[0].score.toString()}`;
            } else {
                let score = new OhNoScore();
                str += `\nWinning totals:`;
                winners.forEach(winner => {
                    score.addScore(winner.score);
                    str += `\n    ${winner.getName()} scored ${winner.score.toString()}`;
                });
                str += `\nTotal score across all winners: ${score.getValue()}`;
            }
            str += `\nRunners up:`;
        } else {
            str += `The game ended early, nobody reached the target of ${this.config.targetScore} points.`;
            str += `\nScores:`;
        }
        
        let otherPlayerScores = [];
        this.players.forEach(player => {
            if (!player.isBot) player.isReady = false;
            if (winners.includes(player)) return;
            otherPlayerScores.push({name: player.getName(), total: player.score.getValue()});
        });
        if (otherPlayerScores.length > 0) {
            otherPlayerScores.sort((a, b) => {
                return (b.total - a.total);
            });
            str += otherPlayerScores.map(obj => `    ${obj.name} scored ${obj.total} points.`).join('\n');
        } else {
            str += ` None.`
        }
        str += `\n`;
        str += `The game has ended, thanks for playing!`;
        this.isInProgress = false;
        console.log(str);
        this.results = str;
    }

    dealHands() {
        for (let i = 0; i < this.config.startingHandSize; i++) {
            this.players.forEach(player => player.addToHand(this.drawOne()));
        }
    }
}
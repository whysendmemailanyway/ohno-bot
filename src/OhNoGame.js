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
    let colors = DECKDATA.COLORS.join('|');
    let ranks = [...DECKDATA.NUMBER_RANKS, ...DECKDATA.ACTION_RANKS].join('|');
    let wildRanks = DECKDATA.WILD_RANKS.join('|');
    return new RegExp(`(?<cardname>(?:${colors}) (?:${ranks})|(?:=${wildRanks}))(?: *(?<wildcolor>${colors})*)(?: *(?<shout>SHOUT)*)`, `gi`);
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
            return match;
        }
        let response = {};
        for (let group in match.groups) {
            response[group] = match.groups[group];
        }
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
            this.config[key] = value;
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
            if (this.isInProgress) {
                if (player.isBot) {
                    player.isBot = false;
                    console.log(`Unbotted ${player.getName()}.`);
                    return true;
                } else {
                    console.log(`Player is already added and not a bot`);
                    return false;
                }
            } else if (player.name === name) {
                console.log(`Unable to add new player ${name}, a player with that name is already in the game.`);
                return false;
            }
        }
        this.allPlayers.push(new OhNoPlayer(name));
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
        this.results = '';
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
        this.results = '';
        this.players = this.getApprovedPlayers();
        this.players.forEach(player => player.score = new OhNoScore());
        this.isInProgress = true;
        this.startRound();
    }

    startRound() {
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
        this.players.forEach(player => player.isInShoutDanger = false);
        this.results = '';
        console.log();
        this.currentPlayer = this.players[this.playerIndex];
        console.log(`It is ${this.currentPlayer.getName()}'s turn.`);
        this.hasDrawnThisTurn = false;
    }

    isCardPlayable(newCard, oldCard=null) {
        if (!oldCard) oldCard = this.discards.top();
        if (newCard.isWild()) return true;
        if (oldCard.isWild()) return newCard.color === this.wildColor;
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
        this.endTurn(true);
        this.results = `${this.currentPlayer.getName()} accepts ${challengee.getName()}'s ${this.discards.top().getName()}! They draw 4 cards and miss their turn.`;
    }

    isDraw4Legal(player, oldCard) {
        let canPlay = false;
        for (let i = 0; i < player.hand.length; i++) {
            let card = player.hand[i];
            if (!card.isWild() && this.isCardPlayable(card, oldCard)) {
                canPlay = true;
                break;
            }
        }
        return canPlay;
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
            messages.push(`\n${challengee.getName()} has the following cards in hand: ${challengee.handToString()}\n`);
            let oldCard = this.discards.top(2)[1];
            let canPlay = this.isDraw4Legal(challengee, oldCard);
            if (canPlay) {
                messages.push(`${challengee.getName()} played their ${d4name} illegally now draws 4 cards!`);
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

    // callOutPlayer(nameOrIndex) {
    //     let player = this.findPlayerWithName(nameOrIndex);
    //     if (!player) player = this.players[nameOrIndex];
    //     if (!player) throw `Couldn't find player with name or index ${nameOrIndex}...`;
    //     if (player.hand.length !== 1) {
    //         console.log(`${player.getName()}'s name was called, but they have more than one card in their hand.`);
    //     } else if (player.hasShouted) {
    //         console.log(`${player.getName()}'s name was called, but they already yelled.`);
    //     } else {
    //         console.log(`${player.getName()}'s name was called before they yelled, they must draw two cards!`);
    //         player.addToHand(this.drawX(2));
    //     }
    // }

    // TODO: implement bot shouting?
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
            return `${player.getName()} has shouted "OH NO!"`;
        } else {
            playerInDanger.addToHand(this.drawX(2));
            return `${player.getName()} called out ${playerInDanger.getName()} and made them draw two cards!`;
        }
    }

    getSafestPlay(player = this.currentPlayer) {
        let safelyPlayDraw4 = true;
        for (let i = 0; i < player.hand.filter(card => !card.isWild()).length; i++) {
            if (this.isDraw4Legal(player, this.discards.top())) {
                safelyPlayDraw4 = false;
                break;
            }
        }
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
        this.results = messages.join(' ');
        console.log(this.results);
    }

    playCard(card, player, newWildColor, withShout = false) {
        let messages = [];
        if (player) {
            if (!this.isCardPlayable(card)) {
                messages.push(`Hey! You can't play ${card.getName()} on ${this.discards.top().getName()}...`);
                this.setResultsWithArray(messages);
                return false;
            }
            player.removeFromHand(player.hand.indexOf(card));
            messages.push(`${player.getName()} played ${card.getName()}${card.isWild() ? ' and set the new color to ' + UTILS.titleCase(newWildColor) : ''}, ${player.hand.length} card${player.hand.length !== 1 ? 's' : ''} left in their hand.`);
            if (player.hand.length === 0) {
                messages.push(`${player.getName()} played their last card and won the round!`);
                messages.push(...this.endRound());
                this.setResultsWithArray(messages);
                return true;
            } else if (player.hand.length === 1) {
                player.isInShoutDanger = true;
            }
            if (withShout) messages.push(this.shout(player));
        } else {
            messages.push(`${this.currentDealer.getName()} dealt ${card.getName()} as the starting card.`);
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
            this.wildColor = newWildColor;
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

    updatePlayerIndex() {
        let direction = this.goingClockwise ? 1 : -1;
        this.playerIndex += direction;
        while (this.playerIndex < 0) this.playerIndex += this.players.length;
        while (this.playerIndex >= this.players.length) this.playerIndex -= this.players.length;
        this.currentPlayer = this.players[this.playerIndex];
    }

    endRound() {
        this.isRoundInProgress = false;
        let cards = [];
        let messages = [];
        this.players.forEach(player => {
            if (player === this.currentPlayer) return;
            cards.push(...player.hand);
        });
        let score = new OhNoScore(cards);
        this.currentPlayer.score.addScore(score);
        messages.push(`${this.currentPlayer.getName()} scored ${score.getValue()} points this round: ${score.toString()}`);
        let totalScore = this.currentPlayer.score.getValue();
        messages.push(`This brings their total score to ${totalScore} points!`);
        if (this.checkForVictory()) return;
        this.dealerIndex += 1;
        if (this.dealerIndex >= this.players.length) this.dealerIndex = 0;
        messages.push(`It is now ${this.players[this.dealerIndex].getName()}'s turn to deal.`);
        return messages;
    }

    checkForVictory() {
        let winners = this.players.filter(player => player.score.getValue() >= this.targetScore);
        if (winners.length > 0) {
            this.endGame(winners);
            return true;
        } else {
            return false;
        }
    }

    endPrematurely() {
        let highestScore = players.reduce((highest, b) => {
            if (b.score.getValue() > highest) return b;
            return highest;
        }, players[0].score.getValue());
        this.endGame(this.players.filter(player => player.score.getValue() >= highestScore));
    }

    endGame(winners) {
        let str = '';
        winners.sort((a, b) => b.score.getValue() - a.score.getValue());
        let highestScore = winners[0].score.getValue();
        console.log();
        if (highestScore >= this.config.targetScore) {
            str += `${winners.map(player => player.getName()).join(', ')} ${highestScore > this.config.targetScore ? 'surpassed' : 'met'} the target score of ${this.config.targetScore} and won the game!!!`;
        } else {
            str += `The game ended early, so ${winners.map(player => player.getName()).join(', ')} won with ${highestScore} points!`;
        }
        console.log();
        if (winners.length === 1) {
            str += `Winning total: ${winners[0].score.toString()}`;
        } else {
            let score = new OhNoScore();
            str += `Winning totals:`;
            winners.forEach(winner => {
                score.addScore(winner.score);
                str += `\n    ${winner.getName()} scored ${winner.score.toString()}`;
            });
            str += `Total score across all winners: ${score.getValue()}`;
        }
        str += `\n`;
        str += `Runners up:`;
        let otherPlayerScores = [];
        this.players.forEach(player => {
            if (winners.includes(player)) return;
            otherPlayerScores.push({name: player.getName(), total: player.score.getValue()});
        });
        otherPlayerScores.sort((a, b) => {
            return (b.total - a.total);
        });
        str += otherPlayerScores.map(obj => `    ${obj.name} scored ${obj.total} points.`).join('\n');
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
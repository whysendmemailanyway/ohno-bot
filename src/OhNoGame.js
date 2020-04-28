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

module.exports.default = class OhNoGame {
    constructor() {
        this.deck;
        this.discards;
        this.players = [];
        this.currentPlayer;
        this.dealerIndex = 0;
        this.playerIndex;
        this.goingClockwise;
        this.wildColor;
        this.isInProgress = false;
        this.startingHandSize = 7;
        this.draw4LastTurn;
        this.targetScore = 500;
        this.maxPlayers = 10;
    }

    addPlayer(name) {
        if (this.players.length >= 10) {
            console.log(`Unable to add ${name}, already at the maximum of 10 players.`);
            return false;
        }
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].name === name) {
                console.log(`Unable to add new player ${name}, a player with that name is already in the game.`);
                return false;
            }
        }
        this.players.push(new OhNoPlayer(name));
        return true;
    }

    renamePlayer(index, newName) {
        this.players[index].name = newName;
    }

    removePlayer(index) {
        this.players = this.players.splice(index, 1);
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

    startGame() {
        this.players.forEach(player => player.score = new OhNoScore());
        this.isInProgress = true;
        this.startRound();
    }

    startRound() {
        this.playerIndex = this.dealerIndex;
        if (this.playerIndex >= this.players.length) this.playerIndex = 0;
        this.goingClockwise = true;
        this.currentDealer = this.players[this.dealerIndex];
        this.deck = new Deck([...makeNumberCards(), ...makeActionCards(), ...makeWildCards()]);
        this.deck.shuffle();
        this.discards = new Deck();
        this.discards._stack = [];
        this.wildColor = null;
        this.draw4LastTurn = false;
        this.dealHands();
        console.log(`All players received ${this.startingHandSize} cards.`);
        this.playCard(this.drawOne());
    }

    startTurn() {
        console.log();
        this.currentPlayer = this.players[this.playerIndex];
        console.log(`It is ${this.currentPlayer.name}'s turn.`);
        for (let i = 0; i < this.currentPlayer.hand.length; i++) {
            if (this.isCardPlayable(this.currentPlayer.hand[i])) return;
        }
        console.log(`${this.currentPlayer.name} can't play, and must draw a card!`);
        this.currentPlayer.addToHand(this.drawOne());
        this.updatePlayerIndex();
    }

    isCardPlayable(newCard, oldCard=null) {
        if (!oldCard) oldCard = this.discards.top();
        if (newCard.isWild()) return true;
        if (oldCard.isWild()) return newCard.color === this.wildColor;
        if (newCard.color === oldCard.color) return true;
        return newCard.rank === oldCard.rank;
    }

    findPlayerWithName(name) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].name === name) return this.players[i];
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
        console.log(`${UTILS.titleCase(DECKDATA.RANK_WILD_DRAW_4)} was played on ${this.currentPlayer.name}! Waiting for them to accept or challenge...`);
    }

    acceptDraw4() {
        let challengee = this.getPreviousPlayer();
        console.log(`${this.currentPlayer.name} accepts ${challengee.name}'s ${this.discards.top().getName()}! They must draw 4 and miss their turn.`);
        this.currentPlayer.addToHand(this.drawX(4));
        this.endTurn(true);
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
        const d4name = UTILS.titleCase(DECKDATA.RANK_WILD_DRAW_4);
        if (this.discards.top().rank === DECKDATA.RANK_WILD_DRAW_4) {
            if (!this.draw4LastTurn) {
                console.log(`${this.currentPlayer.name} tried to challenge the play, but the ${d4name} was not played on them.`);
                return;
            }
            let challengee = this.getPreviousPlayer();
            console.log(`${this.currentPlayer.name} challenges ${challengee.name}'s ${this.discards.top().getName()}!`);
            console.log(`${challengee.name} has the following cards in hand: ${challengee.handToString()}`);
            let oldCard = this.discards.top(2)[1];
            let canPlay = this.isDraw4Legal(challengee, oldCard);
            if (canPlay) {
                console.log(`${challengee.name} played their ${d4name} illegally and must draw 4 cards!`);
                challengee.addToHand(this.drawX(4));
                this.endTurn(false);
            } else {
                console.log(`${challengee.name} played their ${d4name} legally. Now ${this.currentPlayer.name} must draw 6 cards and miss their turn, ouch!!`);
                this.currentPlayer.addToHand(this.drawX(6));
                this.endTurn(true);
            }
        } else {
            console.log(`${this.currentPlayer.name} tried to challenge the play, but only ${d4name} can be challenged.`);
        }
    }

    callOutPlayer(nameOrIndex) {
        let player = this.findPlayerWithName(nameOrIndex);
        if (!player) player = this.players[nameOrIndex];
        if (!player) throw `Couldn't find player with name or index ${nameOrIndex}...`;
        if (player.hand.length !== 1) {
            console.log(`${player.name}'s name was called, but they have more than one card in their hand.`);
        } else if (player.hasShouted) {
            console.log(`${player.name}'s name was called, but they already yelled.`);
        } else {
            console.log(`${player.name}'s name was called before they yelled, they must draw two cards!`);
            player.addToHand(this.drawX(2));
        }
    }

    shout(player) {
        if (player.hand.length === 1) {
            if (player.hasShouted) {
                console.log(`${player.name} has already called OhNo, no need to call it again...`);
            } else {
                console.log(`${player.name} has shouted "OH NO!"`);
                player.hasShouted = true;
            }
        } else {
            console.log(`${player.name} tries to call OhNo, but still has ${player.hand.length} cards left. OhNo can only be called with one card in hand.`);
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

    playCard(card, player, newWildColor, withShout = false) {
        if (player) {
            if (!this.isCardPlayable(card)) {
                console.log(`Hey! You can't play ${card.getName()} on ${this.discards.top().getName()}...`);
                return false;
            }
            player.removeFromHand(player.hand.indexOf(card));
            console.log(`${player.name} played ${card.getName()}${card.isWild() ? ' and set the new color to ' + UTILS.titleCase(newWildColor) : ''}, ${player.hand.length} card${player.hand.length !== 1 ? 's' : ''} left in their hand.`);
            if (player.hand.length === 0) {
                console.log(`${player.name} played their last card and won the round!`);
                this.endRound();
                return true;
            }
            if (withShout) this.shout(player);
        } else {
            console.log(`${this.currentDealer.name} dealt ${card.getName()} as the starting card.`);
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
            console.log(`${UTILS.titleCase(DECKDATA.RANK_REVERSE)}! Play now moves to the ${newDirection} instead of the ${oldDirection}.`);
            if (!player || this.players.length === 2) {
                this.playerIndex += 1; // offset to account for dealer being able to reverse to self AND for 2 player games
            }
        }
        this.updatePlayerIndex();
        let skip = false;
        if (card.rank === DECKDATA.RANK_WILD_DRAW_4) {
            this.wildColor = newWildColor;
            this.draw4LastTurn = true;
            this.handleDraw4();
            return true;
        } else {
            if (card.rank === DECKDATA.RANK_SKIP) {
                console.log(`${UTILS.titleCase(DECKDATA.RANK_SKIP)}! ${this.currentPlayer.name} misses their turn.`);
                skip = true;
            } else if (card.rank === DECKDATA.RANK_DRAW_2) {
                this.currentPlayer.addToHand(this.drawX(2));
                console.log(`Aw, ${this.currentPlayer.name} had to draw 2 and miss their turn.`);
                skip = true;
            }
            this.endTurn(skip);
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
        let cards = [];
        this.players.forEach(player => {
            if (player === this.currentPlayer) return;
            cards.push(...player.hand);
        });
        let score = new OhNoScore(cards);
        this.currentPlayer.score.addScore(score);
        console.log(`${this.currentPlayer.name} scored ${score.getValue()} points this round: ${score.toString()}`);
        let totalScore = this.currentPlayer.score.getValue();
        console.log(`This brings their total score to ${totalScore} points!`);
        if (totalScore >= this.targetScore) {
            this.endGame();
        } else {
            this.dealerIndex += 1;
            if (this.dealerIndex >= this.players.length) this.dealerIndex = 0;
            console.log(`It is now ${this.players[this.dealerIndex].name}'s turn to deal.`);
            this.startRound();
        }
    }

    endGame() {
        let totalScore = this.currentPlayer.score.getValue();
        console.log();
        console.log(`${this.currentPlayer.name} ${totalScore > this.targetScore ? 'surpassed' : 'met'} the target score of ${this.targetScore} and won the game!!!`);
        console.log();
        console.log(`Winner's total: ${this.currentPlayer.score.toString()}`);
        console.log();
        console.log(`Runners up:`);
        let otherPlayerScores = [];
        this.players.forEach(player => {
            if (player === this.currentPlayer) return;
            otherPlayerScores.push({name: player.name, total: player.score.getValue()});
        });
        otherPlayerScores.sort((a, b) => {
            return (b.total - a.total);
        });
        console.log(otherPlayerScores.map(obj => `    ${obj.name} scored ${obj.total} points.`).join('\n'));
        console.log();
        this.isInProgress = false;
    }

    dealHands() {
        for (let i = 0; i < this.startingHandSize; i++) {
            this.players.forEach(player => player.addToHand(this.drawOne()));
        }
    }
}
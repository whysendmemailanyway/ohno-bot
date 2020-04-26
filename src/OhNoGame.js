const Deck = require('card-deck');
const OhNoCard = require('./OhNoCard').default;
const OhNoPlayer = require('./OhNoPlayer').default;
const DECKDATA = require('./OhNoDeckData');

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
            repeatFunction(() => results.push(new OhNoCard(i, i, color, name)), i === 0 ? 1 : 2);
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
    }

    addPlayer(name) {
        this.players.push(new OhNoPlayer(name));
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
        this.playerIndex = 0;
        this.goingClockwise = true;
        this.currentDealer = this.players[this.dealerIndex];
        this.deck = new Deck([...makeNumberCards(), ...makeActionCards(), ...makeWildCards()]);
        this.deck.shuffle();
        this.discards = new Deck();
        this.discards._stack = [];
        this.dealHands();
        this.playCard(this.drawOne());
        this.wildColor = null;
        this.isInProgress = true;
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
        this.startTurn();
    }

    isCardPlayable(card) {
        let top = this.discards.top();
        if (card.isWild()) return true;
        if (top.isWild()) return card.color === this.wildColor;
        if (card.color === top.color) return true;
        return card.rank === top.rank;
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

    playCard(card, player, newWildColor) {
        // TODO: Implement OhNo shouting
        // TODO: Implement Draw 4 challenging
        if (player) {
            if (!this.isCardPlayable(card)) {
                console.log(`Hey! You can't play ${card.getName()} on ${this.discards.top().getName()}...`);
                return false;
            }
            player.hand.splice(player.hand.indexOf(card), 1);
            console.log(`${player.name} played ${card.getName()}, ${player.hand.length} cards left in their hand.`);
            if (player.hand.length === 0) {
                console.log(`${player.name} played their last card and won the game!`);
                this.endGame();
                return true;
            }
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
            console.log(`Reverse! Play now moves to the ${newDirection} instead of the ${oldDirection}.`);
            if (!player || this.players.length === 2) {
                this.playerIndex += 1; // offset to account for dealer being able to reverse to self AND for 2 player games
            }
        }
        if (card.isWild()) {
            this.wildColor = newWildColor;
        } else {
            this.wildColor = null;
        }
        this.updatePlayerIndex();
        let skip = false;
        if (card.rank === DECKDATA.RANK_SKIP) {
            console.log(`Skip! ${this.currentPlayer.name} misses their turn.`);
            skip = true;
        } else if (card.rank === DECKDATA.RANK_DRAW_2) {
            this.currentPlayer.addToHand(this.drawX(2));
            console.log(`Aw, ${this.currentPlayer.name} had to draw 2 and miss their turn.`);
            skip = true;
        } else if (card.rank === DECKDATA.RANK_WILD_DRAW_4) {
            this.currentPlayer.addToHand(this.drawX(4));
            console.log(`Ouch!! ${this.currentPlayer.name} had to draw 4 and miss their turn!`);
            skip = true;
        }
        if (skip) {
            this.updatePlayerIndex();
        }
        this.startTurn();
        return true;
    }

    updatePlayerIndex() {
        let direction = this.goingClockwise ? 1 : -1;
        this.playerIndex += direction;
        while (this.playerIndex < 0) this.playerIndex += this.players.length;
        while (this.playerIndex >= this.players.length) this.playerIndex -= this.players.length;
        this.currentPlayer = this.players[this.playerIndex];
    }

    endGame() {
        // TODO: Calculate scores, keep track of scores
        this.dealerIndex += 1;
        if (this.dealerIndex >= this.players.length) this.dealerIndex = 0;
        console.log(`It is now ${this.players[this.dealerIndex].name}'s turn to deal.`);
        this.isInProgress = false;
    }

    dealHands() {
        for (let i = 0; i < this.startingHandSize; i++) {
            this.players.forEach(player => player.addToHand(this.drawOne()));
        }
    }
}
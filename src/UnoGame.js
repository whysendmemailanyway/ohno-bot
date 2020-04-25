const Deck = require('card-deck');
const UnoCard = require('./UnoCard').default;
const UnoPlayer = require('./UnoPlayer').default;

const COLOR_RED = "RED";
const COLOR_GREEN = "GREEN";
const COLOR_BLUE = "BLUE";
const COLOR_YELLOW = "YELLOW";
const COLORS = [COLOR_RED, COLOR_BLUE, COLOR_GREEN, COLOR_YELLOW];

const NUMBER_RANKS = [];
for (let i = 0; i < 10; i++) {
    NUMBER_RANKS.push(i);
}

const RANK_SKIP = "SKIP";
const RANK_REVERSE = "REVERSE";
const RANK_DRAW_2 = "DRAW 2";

const ACTION_RANKS = [RANK_SKIP, RANK_REVERSE, RANK_DRAW_2];

const RANK_WILD = "WILD";
const RANK_WILD_DRAW_4 = "WILD DRAW 4";

const WILD_RANKS = [RANK_WILD, RANK_WILD_DRAW_4];

const makeNumberCards = () => {
    let results = [];
    COLORS.forEach(color => {
        NUMBER_RANKS.forEach(rank => {
            results.push(new UnoCard(rank, color));
            if (rank > 0) {
                results.push(new UnoCard(rank, color));
            }
        });
    })
    return results;
}

const makeActionCards = () => {
    let results = [];
    COLORS.forEach(color => {
        ACTION_RANKS.forEach(rank => {
            results.push(new UnoCard(rank, color));
            results.push(new UnoCard(rank, color));
        });
    })
    return results;
}

const makeWildCards = () => {
    let results = [];
    WILD_RANKS.forEach(rank => {
        results.push(new UnoCard(rank));
        results.push(new UnoCard(rank));
        results.push(new UnoCard(rank));
        results.push(new UnoCard(rank));
    });
    return results;
}

module.exports.default = class UnoGame {
    constructor() {
        this.deck = new Deck([...makeNumberCards(), ...makeActionCards(), ...makeWildCards()]);
        this.deck.shuffle();
        let player1 = new UnoPlayer('Oney');
        let player2 = new UnoPlayer('Twoey');
        this.players = [player1, player2];
        this.dealHands();
        console.log(player1.hand);
        console.log(player2.hand);
    }

    dealHands() {
        for (let i = 0; i < 7; i++) {
            this.players.forEach(player => player.addCardToHand(this.deck.draw()));
        }
    }
}
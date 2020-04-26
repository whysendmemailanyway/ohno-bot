const Deck = require('card-deck');
const OhNoCard = require('./OhNoCard').default;
const OhNoPlayer = require('./OhNoPlayer').default;

const COLORS = [
    'BLACK',
    'WHITE',
    'BLONDE',
    'BROWN'
];

const NUMBER_RANKS = [
    'MOUSE', // 0.68 oz
    'BIRD', // 1.3 oz
    'BUNNY', // 2-5 lbs
    'BASS', // 6-12 lbs
    'CAT', // 7.9-9.9 lbs
    'DOG', // 12-100 lbs
    'SHEEP', // 100-300 lbs
    'DEER', // 100-400 lbs
    'PIG', // 110-770 lbs
    'COW', // 1600-2400 lbs
];

const RANK_SKIP = "SKIP";
const RANK_REVERSE = "REVERSE";
const RANK_DRAW_2 = "BREED 2";

const ACTION_RANKS = [RANK_SKIP, RANK_REVERSE, RANK_DRAW_2];

const RANK_WILD = "WILD";
const RANK_WILD_DRAW_4 = "WILD BREED 4";

const WILD_RANKS = [RANK_WILD, RANK_WILD_DRAW_4];

const repeatFunction = (fn, times) => {
    for (let i = 0; i < times; i++) {
        fn();
    }
}

const makeNumberCards = () => {
    let results = [];
    COLORS.forEach(color => {
        NUMBER_RANKS.forEach((rank, i) => {
            let name = `${color.toLowerCase()} ${rank.toLowerCase()} (${i})`;
            repeatFunction(() => results.push(new OhNoCard(i, i, color, name)), i === 0 ? 1 : 2);
        });
    })
    return results;
}

const makeActionCards = () => {
    let results = [];
    COLORS.forEach(color => {
        ACTION_RANKS.forEach(rank => {
            repeatFunction(() => results.push(new OhNoCard(rank, 20, color, `${color.toLowerCase()} ${rank.toLowerCase()}`)), 2);
        });
    })
    return results;
}

const makeWildCards = () => {
    let results = [];
    WILD_RANKS.forEach(rank => {
        repeatFunction(() => results.push(new OhNoCard(rank, 50)), 4);
    });
    return results;
}

module.exports.default = class OhNoGame {
    constructor() {
        this.deck = new Deck([...makeNumberCards(), ...makeActionCards(), ...makeWildCards()]);
        this.deck.shuffle();
        let player1 = new OhNoPlayer('Oney');
        let player2 = new OhNoPlayer('Twoey');
        this.players = [player1, player2];
        this.dealHands();
        console.log(player1.handToString());
        console.log();
        console.log(player2.handToString());
    }

    dealHands() {
        for (let i = 0; i < 7; i++) {
            this.players.forEach(player => player.addCardToHand(this.deck.draw()));
        }
    }
}
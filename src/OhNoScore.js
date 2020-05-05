const UTILS = require('./OhNoUtils');
const DECKDATA = require('./OhNoDeckData');

class OhNoScore {
    constructor(cards = []) {
        this.scoreCards(cards);
    }

    scoreCards(cards) {
        cards.forEach(card => {
            if (!this[card.rank]) this[card.rank] = 0;
            this[card.rank]++;
        });
    }

    toString() {
        let keys = Object.keys(this);
        keys.sort((a, b) => DECKDATA.SCORE_MAP[a] - DECKDATA.SCORE_MAP[b]);
        let entries = [];
        keys.forEach(key => {
            let points = DECKDATA.SCORE_MAP[key];
            entries.push(`${this[key]}x ${UTILS.titleCase(key)} (${points} point${points === 1 ? `` : `s`})`);
        });
        return `${this.getValue()} points${entries.length > 0 ? `: ${entries.join(', ')}` : ``}.`;
    }

    getValue() {
        return Object.keys(this).reduce((value, key) => {
            return value + (this[key] * DECKDATA.SCORE_MAP[key]);
        }, 0);
    }
    
    addScore(score) {
        Object.keys(score).forEach(key => {
            if (!this[key]) this[key] = 0;
            this[key] += score[key];
        });
    }
}

module.exports.default = OhNoScore;
const UTILS = require('./OhNoUtils');

class OhNoScore {
    constructor(deckData, cards = []) {
        this.deckData = deckData;
        this.score = {};
        this.scoreCards(cards);
    }

    scoreCards(cards) {
        cards.forEach(card => {
            if (!this.score[card.rank]) this.score[card.rank] = 0;
            this.score[card.rank]++;
        });
    }

    toString () {
        let keys = Object.keys(this);
        keys.sort((a, b) => this.deckData.getScore([a]) - this.deckData.getScore([b]));
        let entries = [];
        keys.forEach(key => {
            let points = this.deckData.getScore([key.toLowerCase()]);
            entries.push(`${this.score[key]}x ${UTILS.titleCase(key)} (${points} point${points === 1 ? `` : `s`})`);
        });
        return `${this.getValue()} points${entries.length > 0 ? `: ${entries.join(', ')}` : ``}.`;
    }

    getValue () {
        return Object.keys(this.score).reduce((value, key) => {
            return value + (this.score[key] * this.deckData.getScore([key.toLowerCase()]));
        }, 0);
    }
    
    addScore(score) {
        Object.keys(score).forEach(key => {
            if (!this.score[key]) this.score[key] = 0;
            this.score[key] += score[key];
        });
    }
}

module.exports.default = OhNoScore;
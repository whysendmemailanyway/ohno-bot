const DECKDATA = require('./OhNoDeckData');
const UTILS = require('./OhNoUtils');

class OhNoCard {
    constructor(rank, score, color, name) {
        this.color = color;
        this.rank = rank;
        this.score = score;
        this.name = name || rank.toLowerCase();
    }

    getName() {
        return UTILS.titleCase(this.name);
    }

    isAction() {
        return (DECKDATA.ACTION_RANKS.includes(this.rank));
    }

    isWild() {
        return (DECKDATA.WILD_RANKS.includes(this.rank));
    }
}

module.exports.default = OhNoCard;
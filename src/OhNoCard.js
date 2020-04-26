const RANKS = require('./OhNoDeckData');

class OhNoCard {
    constructor(rank, score, color, name) {
        this.color = color;
        this.rank = rank;
        this.score = score;
        this.name = name || rank.toLowerCase();
    }

    getName() {
        return this.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    isWild() {
        return (this.rank === RANKS.RANK_WILD || this.rank === RANKS.RANK_WILD_DRAW_4);
    }
}

module.exports.default = OhNoCard;
let DECKDATA = require('./OhNoDeckData');

module.exports.default = class OhNoPlayer {
    constructor(name) {
        this.name = name;
        this.hand = [];
    }

    addToHand(cards) {
        let arr = [];
        if (Array.isArray(cards)) {
            arr.push(...cards);
        } else {
            arr.push(cards);
        }
        this.hand.push(...arr);
        this.hand.sort((a, b) => {
            if (a.color && b.color) {
                if (a.color === b.color) {
                    if (a.score === b.score) {
                        if (a.rank < b.rank) return -1;
                        return 1;
                    }
                    return a.score - b.score;
                }
                if (a.color < b.color) return -1;
                return 1;
            }
            if (a.score === b.score) {
                if (a.rank < b.rank) return -1;
                return 1;
            }
            return a.score - b.score;
        });
    }

    getCardInHand(index) {
        return this.hand[index];
    }

    getMostCommonColor() {
        let counts = {};
        DECKDATA.COLORS.forEach((color) => counts[color] = 0);
        for (let i = 0; i < this.hand.length; i++) {
            if (this.hand.color) counts[this.hand.color]++;
        }
        let highestCount = DECKDATA.COLORS[0];
        for (let i = 1; i < Object.keys(counts).length; i++) {
            let key = Object.keys(counts)[i];
            if (counts[key] > counts[highestCount]) highestCount = key;
        }
        return highestCount;
    }

    removeCardFromHand(index) {
        this.hand.splice(index, 1);
    }

    handToString() {
        return this.hand.map(card => card ? card.getName() : 'ERROR').join(', ');
    }
}
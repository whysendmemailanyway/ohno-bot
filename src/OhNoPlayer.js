module.exports.default = class OhNoPlayer {
    constructor(name) {
        this.name = name;
        this.hand = [];
    }

    addCardToHand(card) {
        this.hand.push(card);
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

    removeCardFromHand(index) {
        this.hand.splice(index, 1);
    }

    handToString() {
        return this.hand.map(card => card ? card.getName() : 'ERROR').join(', ');
    }
}
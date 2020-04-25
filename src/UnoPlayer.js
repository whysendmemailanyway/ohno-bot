module.exports.default = class UnoPlayer {
    constructor(name) {
        this.name = name;
        this.hand = [];
    }

    addCardToHand(card) {
        this.hand.push(card);
        this.hand.sort((a, b) => {
            if (!a.color) return -1;
            if (!b.color) return 1;
            if (a.color < b.color) {
                return -1;
            }
            if (a.color > b.color) {
                return 1;
            }
            if (a.color !== b.color) return a.color - b.color;
            return a.rank - b.rank;
        });
    }

    getCardInHand(index) {
        return this.hand[index];
    }

    removeCardFromHand(index) {
        this.hand.splice(index, 1);
    }
}
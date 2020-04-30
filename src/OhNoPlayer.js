let DECKDATA = require('./OhNoDeckData');

module.exports.default = class OhNoPlayer {
    constructor(name) {
        this.name = name;
        this.hand = [];
        this.hasShouted = false;
        this.isInShoutDanger = false;
        this.score = {};
        this.isBot = false;
        this.isApproved = false;
        this.alias = name;
    }

    getName() {
        return this.alias + (this.isBot ? ' (bot)' : '');
    }

    setAlias(alias) {
        this.alias = alias || this.name;
    }

    addToHand(cards) {
        let arr = [];
        if (Array.isArray(cards)) {
            arr.push(...cards);
        } else {
            arr.push(cards);
        }
        if (arr.length > 0) {
            this.hasShouted = false;
            this.isInShoutDanger = false;
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

    removeFromHand(index) {
        this.hand.splice(index, 1);
    }

    handToString() {
        return this.hand.map(card => card ? card.getName() : 'ERROR').join(', ');
    }

    findCardByName(name) {
        for (let i = 0; i < this.hand.length; i++) {
            let card = this.hand[i];
            let cname = '' + card.getName();
            let index = cname.indexOf(' (');
            if (index !== -1) {
                cname = cname.substring(0, index);
            }
            if (cname.toLowerCase() === name.toLowerCase()) return card;
        }
        console.log(`Unable to find card with name ${name} in ${this.getName()}'s hand. Hand: ${this.handToString()}`);
        return null;
    }
}
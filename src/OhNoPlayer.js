let OhNoScore = require('./OhNoScore').default;

module.exports.default = class OhNoPlayer {
    constructor(name, game) {
        this.name = name;
        this.hand;
        this.hasShouted;
        this.isInShoutDanger;
        this.score;
        this.isBot = false;
        this.isApproved = false;
        this.isReady = false;
        this.alias;
        this.wasHuman = true;
        this.game = game;
        this.resetForGame();
    }

    resetForGame = () => {
        this.resetForRound()
        this.score = new OhNoScore(this.game.deckData);
    }

    resetForRound() {
        this.hand = [];
        this.hasShouted = false;
        this.isInShoutDanger = false;
    }

    getName() {
        return `${this.alias ? this.alias : this.name}${this.isBot ? ' (bot)' : ''}`;
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
        this.game.deckData.COLORS.forEach((color) => counts[color] = 0);
        for (let i = 0; i < this.hand.length; i++) {
            if (this.hand[i].color) counts[this.hand[i].color]++;
        }
        let highestCount = this.game.deckData.COLORS[0];
        console.log(highestCount);
        for (let i = 1; i < Object.keys(counts).length; i++) {
            let key = Object.keys(counts)[i];
            if (counts[key] > counts[highestCount]) highestCount = key;
        }
        // TODO: if there's a tie in count, return highest point value color
        return highestCount;
    }

    removeFromHand(index) {
        this.hand.splice(index, 1);
    }

    handToString(withBbc = false, isCardBold = null) {
        let results = this.hand.map(card => {
            if (card) {
                // blonde, brown, white, black
                // yellow, brown, white, purple
                if (withBbc) {
                    let name = card.getName(withBbc);
                    if (isCardBold !== null && isCardBold(card)) name = `[b]${name}[/b]`;
                    return name;
                } else {
                    return card.getName();
                }
            } else {
                return `ERROR`;
            }
        }).join(', ');
        return results;
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
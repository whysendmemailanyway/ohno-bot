const UTILS = require('./OhNoUtils');

class OhNoCard {
    constructor(rank, score, color, name, deckData) {
        this.color = color;
        this.rank = rank;
        this.score = score;
        this.name = name || rank.toLowerCase();
        this.deckData = deckData;
    }

    getName(withBbc=false) {
        if (!withBbc) return UTILS.titleCase(this.name);
        if (this.color) {
            let cardColor = this.color.toLowerCase();
            let colors = this.deckData.COLOR_MAP[cardColor];
            return `[color=${colors.outer}][color=${colors.inner}]${UTILS.titleCase(this.name)}[/color][/color]`;
        } else {
            let colors = this.deckData.COLORS.map(color => this.deckData.COLOR_MAP[color.toLowerCase()]);
            return UTILS.titleCase(this.name).split('').map((char, i) => `[color=${colors[i % colors.length].outer}][color=${colors[i % colors.length].inner}]${char}[/color][/color]`).join('');
        }
    }

    isAction() {
        return (this.deckData.ACTION_RANKS.includes(this.rank.toLowerCase()));
    }

    isWild() {
        return (this.deckData.WILD_RANKS.includes(this.rank.toLowerCase()));
    }
}

module.exports.default = OhNoCard;
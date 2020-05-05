const DECKDATA = require('./OhNoDeckData');
const UTILS = require('./OhNoUtils');

class OhNoCard {
    constructor(rank, score, color, name) {
        this.color = color;
        this.rank = rank;
        this.score = score;
        this.name = name || rank.toLowerCase();
    }

    getName(withBbc=false) {
        if (!withBbc) return UTILS.titleCase(this.name);
        if (this.color) {
            let cardColor = this.color.toLowerCase();
            return `[color=purple][color=${DECKDATA.COLOR_MAP[cardColor] || cardColor}]${UTILS.titleCase(this.name)}[/color][/color]`;
        } else {
            let colors = ['white', 'yellow', 'brown', 'purple'];
            // TODO: wild color
            // [color=purple]W[/color][color=purple]I[/color][color=purple]L[/color][color=purple]D[/color]
            // [color=purple][color=white]X[/color][/color][color=purple][color=yellow]X[/color][/color][color=purple][color=brown]X[/color][/color][color=purple][color=purple]X[/color][/color]
            return UTILS.titleCase(this.name).split('').map((char, i) => `[color=purple][color=${colors[i % colors.length]}]${char}[/color][/color]`);
        }
    }

    isAction() {
        return (DECKDATA.ACTION_RANKS.includes(this.rank));
    }

    isWild() {
        return (DECKDATA.WILD_RANKS.includes(this.rank));
    }
}

module.exports.default = OhNoCard;
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
}

module.exports.default = OhNoCard;
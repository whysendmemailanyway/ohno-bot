const defaultConfig = {
    RANK_0: `ZERO`,
    RANK_1: `ONE`,
    RANK_2: `TWO`,
    RANK_3: `THREE`,
    RANK_4: `FOUR`,
    RANK_5: `FIVE`,
    RANK_6: `SIX`,
    RANK_7: `SEVEN`,
    RANK_8: `EIGHT`,
    RANK_9: `NINE`,
    RANK_SKIP: `SKIP`,
    RANK_REVERSE: `REVERSE`,
    RANK_DRAW_2: `DRAW 2`,
    RANK_WILD: `WILD`,
    RANK_WILD_DRAW_4: `WILD DRAW 4`,
    COLOR_0: `RED`,
    COLOR_1: `YELLOW`,
    COLOR_2: `GREEN`,
    COLOR_3: `BLUE`,
    COLOR_MAP: {
        'RED':  {outer: `purple`, inner: 'red'},
        'YELLOW': {outer: `purple`, inner: 'yellow'},
        'GREEN': {outer: `purple`, inner: 'green'},
        'BLUE': {outer: `purple`, inner: 'blue'},
    },
}

class OhNoDeckData {
    constructor(config = defaultConfig) {
        this.NUMBER_RANKS = [];
        this.SCORE_MAP = {};
        for (let i = 0; i < 10; i++) {
            let rank = config[`RANK_${i}`].toLowerCase();
            this[`RANK_${i}`] = rank;
            this.NUMBER_RANKS.push(rank);
            this.SCORE_MAP[rank] = i;
        }
        this.RANK_SKIP = config.RANK_SKIP.toLowerCase();
        this.RANK_REVERSE = config.RANK_REVERSE.toLowerCase();
        this.RANK_DRAW_2 = config.RANK_DRAW_2.toLowerCase();

        this.RANK_WILD = config.RANK_WILD.toLowerCase();
        this.RANK_WILD_DRAW_4 = config.RANK_WILD_DRAW_4.toLowerCase();
        
        this.ACTION_RANKS = [this.RANK_SKIP, this.RANK_REVERSE, this.RANK_DRAW_2];
        this.WILD_RANKS = [this.RANK_WILD, this.RANK_WILD_DRAW_4];

        this.ACTION_RANKS.forEach(rank => this.SCORE_MAP[rank] = 20);
        this.WILD_RANKS.forEach(rank => this.SCORE_MAP[rank] = 50);

        this.COLORS = [];
        for (let i = 0; i < 4; i++) {
            let color = config[`COLOR_${i}`].toLowerCase();
            this[`COLOR_${i}`] = color;
            this.COLORS.push(color);
        }

        this.COLOR_MAP = {};
        Object.keys(config.COLOR_MAP).forEach(color => this.COLOR_MAP[color.toLowerCase()] = config.COLOR_MAP[color]);

        const makeAliases = (input, myKey) => {
            this[myKey] = {};
            if (input) {
                let aliases = {};
                Object.keys(input).forEach(key => aliases[key.toLowerCase()] = input[key]);
                Object.keys(aliases).forEach(aliasKey => {
                    aliases[aliasKey.toLowerCase()].forEach(alias => this[myKey][alias.toLowerCase()] = aliasKey.toLowerCase())
                });
            }
        }
        let rankAliasesInput = {};
        Object.keys(config.RANK_ALIASES).forEach(key => rankAliasesInput[key.toLowerCase()] = config.RANK_ALIASES[key]);
        this.NUMBER_RANKS.forEach((rank, index) => {
            rank = rank.toLowerCase();
            if (!rankAliasesInput[rank]) rankAliasesInput[rank] = [];
            rankAliasesInput[rank].push(`${index}`);
            rankAliasesInput[rank].push(`${defaultConfig[`RANK_${index}`].toLowerCase()}`);
        });
        [...this.ACTION_RANKS, ...this.WILD_RANKS].forEach(rank => {
            if (!rankAliasesInput[rank]) rankAliasesInput[rank] = [];
            let alias = 'ALIAS ERROR';
            switch(rank) {
                case this.RANK_SKIP: alias = `skip`; break;
                case this.RANK_REVERSE: alias = `reverse`; break;
                case this.RANK_DRAW_2: alias = `draw 2`; break;
                case this.RANK_WILD: alias = `wild`; break;
                case this.RANK_WILD_DRAW_4: alias = `wild draw 4`; break;
            }
            rankAliasesInput[rank].push(alias);
        })
        makeAliases(rankAliasesInput, `RANK_ALIASES`);
        makeAliases(config.COLOR_ALIASES, `COLOR_ALIASES`);
        makeAliases(config.CARD_NAME_ALIASES, `CARD_NAME_ALIASES`);
        
        this.SHOUT_ALIASES = [`shout`, `s`, `yell`, `y`, `scream`];
        let shouts = [];
        this.SHOUT_ALIASES.forEach(alias => {
            shouts.push(`!*${alias}`, alias);
        });
        shouts = shouts.join(`|`);
        const colors = [...this.COLORS, ...Object.keys(this.COLOR_ALIASES)].join(`|`);
        let ranks = [...this.NUMBER_RANKS, ...this.ACTION_RANKS];
        let wildRanks = [...this.WILD_RANKS];
        let cardNames = [...Object.keys(this.CARD_NAME_ALIASES)].sort((a, b) => b.length - a.length).join(`|`);
        Object.keys(this.RANK_ALIASES).forEach(alias => {
            let rank = this.RANK_ALIASES[alias];
            if (this.isWild(rank)) {
                wildRanks.push(alias);
            } else {
                ranks.push(alias);
            }
        })
        ranks = ranks.join(`|`);
        wildRanks = wildRanks.join(`|`);
        let regstr = `(?<cardname>((?:${colors}) (?:${ranks}))|(?:${wildRanks})|(?:${cardNames}))(?: (?<wildcolor>${colors}))*(?: (?<shout>${shouts}))*`;
        this.matcher = new RegExp(regstr, `gi`);
    }

    isWild(rank) {
        return this.WILD_RANKS.includes(rank);
    }

    getScore(rank) {
        return this.SCORE_MAP[rank];
    }

    applyBbcToColor(color) {
        let obj = this.COLOR_MAP[color.toLowerCase()];
        return `[color=${obj.outer}][color=${obj.inner}]${color}[/color][/color]`;
    }
}

module.exports.default = OhNoDeckData;
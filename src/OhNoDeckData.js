const NUMBER_RANKS = [
    'MOUSE', // 0.68 oz
    'BIRD', // 1.3 oz
    'BUNNY', // 2-5 lbs
    'BASS', // 6-12 lbs
    'CAT', // 7.9-9.9 lbs
    'DOG', // 12-100 lbs
    'SHEEP', // 100-300 lbs
    'DEER', // 100-400 lbs
    'PIG', // 110-770 lbs
    'COW', // 1600-2400 lbs
]

const RANK_SKIP = 'SKIP';
const RANK_REVERSE = 'REVERSE';
const RANK_DRAW_2 = 'BREED 2';

const RANK_WILD = 'WILD';
const RANK_WILD_DRAW_4 = 'WILD BREED 4';

const COLORS = [
    'BLACK',
    'WHITE',
    'BLONDE',
    'BROWN'
];

const COLOR_MAP = {
    'blonde': 'yellow',
    'black': 'purple',
    'white': 'white',
    'brown': 'brown'
}

const ACTION_RANKS = [RANK_SKIP, RANK_REVERSE, RANK_DRAW_2];

const WILD_RANKS = [RANK_WILD, RANK_WILD_DRAW_4];

const SCORE_MAP = {};
NUMBER_RANKS.forEach((rank, index) => SCORE_MAP[rank] = index);
ACTION_RANKS.forEach((rank) => SCORE_MAP[rank] = 20);
WILD_RANKS.forEach((rank) => SCORE_MAP[rank] = 50);

const ALL_CARD_NAMES = [];
COLORS.forEach(color => {
    NUMBER_RANKS.forEach((rank) => ALL_CARD_NAMES.push(`${color} ${rank}`));
    ACTION_RANKS.forEach((rank) => ALL_CARD_NAMES.push(`${color} ${rank}`));
})
WILD_RANKS.forEach((rank) => ALL_CARD_NAMES.push(rank));

module.exports = {
    NUMBER_RANKS,
    
    RANK_SKIP,
    RANK_REVERSE,
    RANK_DRAW_2,
    
    ACTION_RANKS,
    
    RANK_WILD,
    RANK_WILD_DRAW_4,
    
    WILD_RANKS,

    COLORS,

    COLOR_MAP,

    SCORE_MAP,

    ALL_CARD_NAMES
};
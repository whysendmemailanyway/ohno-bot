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

module.exports = {
    NUMBER_RANKS : [
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
    ],
    
    RANK_SKIP,
    RANK_REVERSE,
    RANK_DRAW_2,
    
    ACTION_RANKS : [RANK_SKIP, RANK_REVERSE, RANK_DRAW_2],
    
    RANK_WILD,
    RANK_WILD_DRAW_4,
    
    WILD_RANKS : [RANK_WILD, RANK_WILD_DRAW_4],

    COLORS
};
'use strict';
require('dotenv').config();
let FChatLib = require('./xfchatlib').default;
let botPlugin = require('./plugins/my_plugin').CommandHandler;
let OhNoGame = require('./src/OhNoGame').default;
let options = {
    username: process.env.FLIST_USERNAME,
    password: process.env.FLIST_PASSWORD,
    character: process.env.FLIST_BOT_CHARACTER,
    master: process.env.FLIST_MASTER_CHARACTER,
    room: process.env.FLIST_ROOM_ID,
    cname: process.env.CLIENT_NAME,
    cversion: process.env.CLIENT_VERSION
};
let myFchatBot = new FChatLib(options);
//myFchatBot.connect();
//let myPlugin = botPlugin(myFchatBot, options.room);

// var knex = require('knex')({
//     client: 'pg',
//     connection: {
//         host : process.env.DB_HOST,
//         user : process.env.PG_USER,
//         password : process.env.PG_PASS,
//         database : process.env.DB_DEVELOPMENT
//     }
// });

let game = new OhNoGame();
game.addPlayer('Oney');
game.addPlayer('Twoey');
game.startGame();

while (game.isInProgress) {
    let hand = game.currentPlayer.hand;
    for (let i = hand.length - 1; i >= 0; i--) {
        if (game.isCardPlayable(hand[i])) {
            if (!game.playCard(game.getHighestPlayableCard(), game.currentPlayer, game.currentPlayer.getMostCommonColor())) return;
            break;
        }
    }
}
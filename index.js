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

let names = ['Oney', 'Twoey', 'Threey', 'Fourey', 'Fivey', 'Sixy', 'Seveny', 'Eighty', 'Niney', 'Tenny'];
const numOfPlayers = 4;
let game = new OhNoGame();
for (let i = 0; i < numOfPlayers; i++) {
    game.addPlayer(names[i]);
}
game.startGame();
while (game.isInProgress) {
    if (game.draw4LastTurn && Math.floor(Math.random() * 4) === 0) game.challengeDraw4();
    game.startTurn();
    let hand = game.currentPlayer.hand;
    for (let i = hand.length - 1; i >= 0; i--) {
        if (game.isCardPlayable(hand[i])) {
            let play = game.getSafestPlay();
            let result = game.playCard(play.card, game.currentPlayer, play.wildColor, play.withShout);
            if (!result) throw `Unplayable situation???`;
            break;
        }
    }
}
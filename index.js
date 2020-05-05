'use strict';
require('dotenv').config();
let FChatLib = require('./xfchatlib').default;
let botPlugin = require('./plugins/OhNo').CommandHandler;
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

myFchatBot.connect();

myFchatBot.addInviteListener((data) => {
    // Example data:
    // { name: 'ADH-70c727f76bf77214cd76', sender: 'Tom_Kat', title: 'test2' }
    if (data.sender === myFchatBot.config.master && data.name.substring(0, 4).toLowerCase() === 'adh-') {
        console.log(`Joining ${data.title}...`);
        myFchatBot.joinNewChannel(data);
        myFchatBot.commandHandlers[data.name].loadplugin('OhNo', {character: myFchatBot.config.master, channel: data.name});
        // setTimeout(() => {
        //     myFchatBot.commandHandlers[data.name].loadplugin('OhNo', {character: myFchatBot.config.master, channel: data.name});
        // }, 3000);
    } else {
        console.log(`Ignoring invite: ${JSON.stringify(data)}`);
    }
});

myFchatBot.addPrivateMessageListener((data) => {
    console.log(`Received a private message from ${data.character}:`);
    console.log(data.message);
    myFchatBot.sendPrivMessage(`Hey friend! I don't currently support private messages, please use my commands in a channel where I am present. Maybe someday I'll be more robust. Thanks!`, data.character);
});

myFchatBot.addMessageListener(data => {
    console.log(`Message received:`);
    console.log(data)
    console.log(`-----`);
});

myFchatBot.addErrorListener(data => {
    console.log(`Error received:`);
    console.log(data)
    console.log(`-----`);
});

myFchatBot.addVariableListener(data => {
    console.log(`Variable received:`);
    console.log(data)
    console.log(`-----`);
});

// let names = ['Oney', 'Twoey', 'Threey', 'Fourey', 'Fivey', 'Sixy', 'Seveny', 'Eighty', 'Niney', 'Tenny'];
// const numOfPlayers = 4;
// let game = new OhNoGame();
// for (let i = 0; i < numOfPlayers; i++) {
//     game.addPlayer(names[i]);
// }
// game.startGame();
// while (game.isInProgress) {
//     if (game.draw4LastTurn && Math.floor(Math.random() * 4) === 0) game.challengeDraw4();
//     game.startTurn();
//     let hand = game.currentPlayer.hand;
//     for (let i = hand.length - 1; i >= 0; i--) {
//         if (game.isCardPlayable(hand[i])) {
//             let play = game.getSafestPlay();
//             let result = game.playCard(play.card, game.currentPlayer, play.wildColor, play.withShout);
//             if (!result) throw `Unplayable situation???`;
//             break;
//         }
//     }
// }
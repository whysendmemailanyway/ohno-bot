var CommandHandler = function(fChatClient, channel){

    this.channel = channel;
    this.fChatClient = fChatClient;

    //Commands
    this.guide = function (args, data) {
        console.log(data);
        var message = "Here's a few things to start: \n";
        message += "The command received the following args: "+JSON.stringify(args)+"\n";
        message += "The command received the following data: "+JSON.stringify(data)+"\n";
        message += "The character who sent the message is:"+data.character+"\n";
        message += "The message was received in the channel:"+data.channel+ " and it's also passed everytime here: "+this.channel+"\n";
        message += "You can call functions outside of the scope: "+getRandomInt(0,10)+"\n";
        message += "And you'll also be able to do things from there, like rolling a die. "+rollDie()+"\n";
        message += "The users in the room are: "+this.fChatClient.getUserList(this.channel)+"\n";
        message += "Here's the list of all the users, in all the room the bot is connected to: "+JSON.stringify(this.fChatClient.getAllUsersList())+"\n";
        message += "The operators in this room are: "+JSON.stringify(this.fChatClient.getChatOPList(this.channel))+ "\n";
        message += "As you will see in a few seconds, the results of the die roll will be shown. There are many actions that you can listen on by passing a function to them, here's the list:\n";
        message += "addMessageListener, addOfflineListener, addLeaveListener, addJoinListener, addChatOPAddedListener, addChatOPRemovedListener, addInitialChannelDataListener\n";
        message += "Alright, you must be ready now. You don't have to re-run the bot each time you update the plugin, just do !reloadplugins in the chat!";
        this.fChatClient.sendMessage(message, this.channel);
    };

    //Listener for events
    // this.fChatClient.addRollListener(function(data){
    //     this.sendMessage("Oh! Someone rolled a die! They rolled a "+data.endresult+" but here's the data: "+JSON.stringify(data), data.channel);
    // });

    // this.fChatClient.addJoinListener(function(data){
    //     this.sendMessage("Yay, someone joined the channel! Welcome "+data.character.identity, data.channel);
    // });

    this.fChatClient.addInviteListener((data) => console.log(data));
};

// var getRandomInt = function(min, max) {
//     return Math.floor(Math.random() * (max - min)) + min;
// };

// var rollDie = function() {
//     this.fChatClient.roll("1d6", channel);
//     return "I rolled a die, and since I added a listener with the addRollListener method, I'll be able to know who rolled, and what's the result!";
// };

module.exports.CommandHandler = CommandHandler;
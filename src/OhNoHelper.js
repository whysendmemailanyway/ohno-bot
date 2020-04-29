class OhNoHelper {
    constructor (fChatClient) {
        this.fChatClient = fChatClient;
    }

    msgUser(text, username) {
        this.fChatClient.sendPrivMessage(text, username);
    }

    isUserMaster(data) {
        if(data.character == this.fChatClient.config.master){
            return true;
        }
        else{
            this.fChatClient.sendMessage('You don\'t have sufficient rights.', data.channel);
            return false;
        }
    }
    
    isUserChatOP(data) {
        if(this.fChatClient.isUserChatOP(data.character, data.channel)){
            return true;
        } else {
            this.fChatClient.sendMessage('You don\'t have sufficient rights.', data.channel);
            return false;
        }
    }

    msgRoom(text, channel) {
        this.fChatClient.sendMessage(text, channel);
    }

    isUserInChannel(username, channel) {
        return this.fChatClient.getUserList(channel).includes(username);
    }

    helpArgs(args) {
        return (args === '?' || args === 'help' || args === 'h');
    }

    insufficientArgs(args) {
        return (!args || args.length === 0 || this.helpArgs(args));
    }
};

module.exports.default = OhNoHelper;
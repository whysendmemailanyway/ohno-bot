class OhNoHelper {
    constructor (fChatLibInstance) {
        this.fChatLibInstance = fChatLibInstance;
    }

    isUserMaster(data) {
        if(data.character == this.fChatLibInstance.config.master){
            return true;
        }
        else{
            this.fChatLibInstance.sendMessage('You don\'t have sufficient rights.', data.channel);
            return false;
        }
    }
    
    isUserChatOP(data) {
        if(this.fChatLibInstance.isUserChatOP(data.character, data.channel)){
            return true;
        } else {
            this.fChatLibInstance.sendMessage('You don\'t have sufficient rights.', data.channel);
            return false;
        }
    }

    msgRoom(text, channel) {
        this.fChatLibInstance.sendMessage(text, channel);
    }
};

module.exports.default = OhNoHelper;
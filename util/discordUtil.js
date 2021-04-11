//Process Incoming Messages
function processMessage(msg){
    if (msg.content === 'ping') {
        msg.reply('Pong!');
    }
}

//Export Functions
module.exports.processMessage = processMessage;
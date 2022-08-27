let handlers = new Map();

function listenReply(msg, handler, timeout = 10 * 60 * 1000) {
    handlers.set(msg.id, handler);
    setTimeout(() => handlers.delete(msg.id), timeout);
}

function processReply(msg) {
    if (msg.reference && msg.reference.messageID) {
        let handler = handlers.get(msg.reference.messageID);
        if (handler) {
            let result = handler(msg);
            if (result) {
                handlers.delete(msg.reference.messageID);
                return true;
            }
        }
    }
    return false;
}

module.exports = {
    listenReply,
    processReply
};
let handlers = new Map();

function listenReply(msg, handler, timeout = 10 * 60 * 1000) {
    handlers.set(msg.id, handler);
    setTimeout(() => handlers.delete(msg.id), timeout);
}

function processReply(msg) {
    if (msg.reference && msg.reference.messageId) {
        let handler = handlers.get(msg.reference.messageId);
        if (handler) {
            let result = handler(msg);
            if (result) {
                handlers.delete(msg.reference.messageId);
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
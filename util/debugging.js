let colors = require('colors');

let DEBUGLVLS = {
    FATAL: 0,
    WARN: 1,
    GENERIC: 2
}

//Display some text on the screen with some formatting
function chickenScratch(msg) { chickenScratch(msg, DEBUGLVLS.GENERIC); }
function chickenScratch(msg, lvl) {
    switch (lvl) {
        //Error
        case DEBUGLVLS.FATAL:{
            console.log(("[*] " + msg).underline.red);
            break;
        }
        //Warning
        case DEBUGLVLS.WARN:{
            console.log(("[!] " + msg).yellow);
            break;
        }
        default:{
            console.log("[+] " + msg);
            break;
        }
    }
}

//Export Functions
module.exports.chickenScratch = chickenScratch;
module.exports.DEBUGLVLS = DEBUGLVLS;
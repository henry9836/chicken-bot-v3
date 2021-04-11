//Display some text on the screen with some formatting
function chickenScratch(msg) { chickenScratch(msg, 0); }
function chickenScratch(msg, lvl) {
    switch (lvl) {
        //Error
        case 2:{
            console.log(("[*] " + msg).underline.red);
            break;
        }
        //Warning
        case 1:{
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
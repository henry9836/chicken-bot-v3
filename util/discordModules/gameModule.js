let debugging = require("../debugging.js");
let discordModule = require("../discordModule.js");
let mongoUtil = require("../mongoUtil.js");
let botConfig = require('../.././config.json');


function processMessage(msg, client, args){
    return false;
}

//Exports
module.exports.processMessage = processMessage;
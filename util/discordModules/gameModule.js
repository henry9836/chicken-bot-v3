const debugging = require("../debugging.js");
const discordModule = require("../discordModule.js");
const mongoUtil = require("../mongoUtil.js");
const botConfig = require('../.././config.json');
const e6 = require('../e6.js');

function processMessage(msg, client, args){
    return false;
}

//Exports
module.exports.processMessage = processMessage;
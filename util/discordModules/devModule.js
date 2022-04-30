const debugging = require("../debugging.js");
const discordModule = require("../discordModule.js");
const mongoUtil = require("../mongoUtil.js");
const botConfig = require('../.././config.json');
const e6 = require('../e6.js');

const { exit } = require('process');

function processMessage(msg, client, args){
    if (args[0] === `update`) {
        exit(0);
    }
}

function getHelpBlock(){
    return ("```" + `
    [ DEV ]
    ${botConfig.prefix}update - updates the bot to latest master verison on git
    ` + "```");
}

//Exports
module.exports.processMessage = processMessage;
module.exports.getHelpBlock = getHelpBlock;
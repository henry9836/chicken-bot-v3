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
    else if (args[0] === `talk`) {
        msg.channel.send(msg.content);
        msg.delete();
        return true;
    }
    //Funny fake backdoor
    else if ((args[0].startsWith('backdoor-')) && msg.author.id === "102606498860896256"){
        var start = new Date();
        var end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate())
        var date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        var dateString = date.toString();
        console.log(date);
        replies = [
            "*I didn't understand the command~ <:chicken_smile:236628343758389249>*",
            "`command scheduled for " + date + "`", 
            "<:chicken_smile:236628343758389249> *okay*",
            ]
        
        //Wait a little then remove message
        msg.reply(replies[Math.floor(Math.random() * replies.length)])
        .then(message => {
            setTimeout(function(){ 
                message.delete();
                msg.delete();
            }, Math.floor(Math.random() * 7500));
        })
        return true;
    }
}

function getHelpBlock(msg){
    let help = ("```" + `
    [ DEV ]
    ${botConfig.prefix}backdoor - runs a "backdoor" command
    ${botConfig.prefix}talk - echo message as chickenbot in channel
    ${botConfig.prefix}update - updates the bot to latest master verison on git
    ` + "```");
    msg.author.send(help);
}

//Exports
module.exports.processMessage = processMessage;
module.exports.getHelpBlock = getHelpBlock;
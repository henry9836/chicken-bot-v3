let debugging = require("../debugging.js");
let discordModule = require("../discordModule.js");
let mongoUtil = require("../mongoUtil.js");
let aiModule = require("./aiModule.js");
let botConfig = require('../.././config.json');
let e6 = require('../e6.js');

let { exit } = require('process');

function processMessage(msg, client, args){
    //Update
    if (args[0] === `update`) {
        discordModule.addToLogChannel("Updating Bot...").then(() => {
            exit(0);
        });
        
        return true;
    }
    
    //Echo chamber
    else if (args[0] === `talk`) {
        var text = msg.content
        text = text.replace("!talk ", "");
        msg.channel.send(text);
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

    //Prune bot
    else if (args[0] === `prunebot`){
        let deleteNum = parseInt(args[1]);
        msg.channel.messages.fetch({
            limit: deleteNum // Change `100` to however many messages you want to fetch
        }).then((messages) => { 
            const botMessages = [];
            messages.filter(m => m.author.id === "830764856088723488").forEach(msg => botMessages.push(msg))
            msg.channel.bulkDelete(botMessages).then(() => {
                discordModule.addToLogChannel(`Cleared ${deleteNum} Bot Messages in: ${msg.channel.name}`);
            });
        })

        return true;
    }

    //Magic Corn Override
    else if (args[0] === `magiccorn`)
    {
        aiModule.DealMagicCorn();
        msg.delete();
        return true;
    }
}

function getHelpBlock(msg){
    let help = ("```" + `
    [ DEV ]
    ${botConfig.prefix}backdoor - runs a "backdoor" command
    ${botConfig.prefix}prunebot - prune bot messages
    ${botConfig.prefix}talk - echo message as chickenbot in channel
    ${botConfig.prefix}update - updates the bot to latest master verison on git
    ` + "```");
    msg.author.send(help);
}

//Exports
module.exports.processMessage = processMessage;
module.exports.getHelpBlock = getHelpBlock;
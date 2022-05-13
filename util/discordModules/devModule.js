const debugging = require("../debugging.js");
const discordModule = require("../discordModule.js");
const mongoUtil = require("../mongoUtil.js");
const botConfig = require('../.././config.json');
const e6 = require('../e6.js');

const { exit } = require('process');

var sweetdreamsSpeedLock = false;
var sweetdreamsLock = false;

function sweetdreams(msg, client){
    let member = client.guild.members.cache.find(user => user.id === '618283130901626890');

    member.voice.disconnect();

    msg.channel.send("Sleep :3");
}

function processMessage(msg, client, args){
    if (args[0] === `update`) {
        exit(0);
    }
    
    else if (args[0] === `talk`) {
        var text = msg.content
        text = text.replace("!talk ", "");
        msg.channel.send(text);
        msg.delete();
        return true;
    }

    else if (args[0] == "sweetdreams"){
        //Get Current Time
        let currentHour = new Date().getUTCHours();

        // //Check if furious is online
        // let member = client.guild.members.cache.find(user => user.id === '693042484619509760')
        // if (member.presence.status == "online"){
        //     debugging.chickenScratch("Furious is online");
        // }
        // else{
        //     debugging.chickenScratch("Furious is offline");
        // }

        //Check cooldown is bigger than 2 hours or 1 for paying
        debugging.chickenScratch("Entered Sweetdreams");
        if (!sweetdreamsLock || (!sweetdreamsSpeedLock && msg.author.id == "255121046607233025")){
            debugging.chickenScratch("Entered Lock");
            //Check if it is between 10pm-6am UTC
            debugging.chickenScratch(currentHour);
            if (((currentHour >= 22) && (currentHour > 12)) || ((currentHour < 10) && (currentHour > 0))) {
                debugging.chickenScratch("Entered UTC");
                
                if (!sweetdreamsSpeedLock && msg.author.id == "255121046607233025"){

                    //Send Message
                    sweetdreams(msg, client);

                    //Locks
                    sweetdreamsSpeedLock = true;

                    //Reset Speed Lock
                    setTimeout(() => {
                        sweetdreamsSpeedLock = false;
                    }, 60*60*1000);
                }
                else if (msg.author.id != "255121046607233025"){

                    //Send Message
                    sweetdreams(msg, client);

                    //Locks
                    sweetdreamsLock = true;

                    //Reset Lock
                    setTimeout(() => {
                        sweetdreamsLock = false;
                    }, 2*60*60*1000);
                }
            }
        }

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
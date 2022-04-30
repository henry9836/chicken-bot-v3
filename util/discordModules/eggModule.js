const debugging = require("../debugging.js");
const discordModule = require("../discordModule.js");
const mongoUtil = require("../mongoUtil.js");
const botConfig = require('../.././config.json');
const e6 = require('../e6.js');

function processMessage(msg, client, args){
    if ((args[0] === `cluck`) || (args[0] === `bok`) || (args[0] === `bawk`) || (args[0] === `squark`)) {
        replies = ["cluck", "bok", "*tilts head in confusion*", "bawk", "*scratches the ground*", "*pecks you*", "*flaps wings*"]
        msg.reply(replies[Math.floor(Math.random() * replies.length)]);
        return true;
    }

    else if (args[0] === `love`) {
        replies = [
        "*bonk*",
        "*cuddles up next to you*", 
        "<:chicken_smile:236628343758389249> *stares at you for several seconds, before flapping away*",
        "*gives you a small flower*", 
        ":heart:",
        "<:chicken_smile:236628343758389249>"
        ]
        msg.reply(replies[Math.floor(Math.random() * replies.length)]);
        return true;
    }

    else if ((args[0] === `kill`) || (args[0] === `attack`)) {
        //Attack the mentioned user
        const punishedUser = msg.mentions.users.first();

        //Do not attack ourselves
        if (punishedUser.id == client.user.id){
            msg.channel.send(`*Trust nobody, not even yourself*`);
            return true;
        }
        //Do not attack our creator
        else if (punishedUser.id == "102606498860896256"){
            msg.channel.send(`**BRAWK!** *pecks and chases* ${msg.author.username}`);
            return true;
        }
        //Attack mentioned user
        msg.channel.send(`*pecks and chases* ${punishedUser.username}`);
        return true;
    }

    else if ((args[0] === `pet`) || (args[0] === `feed`)) {
        replies = [
        "<:chicken_smile:236628343758389249>",
        "*cuddles up into you*",
        "*swawks, coughing up a half digested piece of corn. Looking up at you expectingly*"
        ]
        msg.reply(replies[Math.floor(Math.random() * replies.length)]);
        return true;
    }
    
    //Bonker
    else if ((args[0] === `e6`) || (args[0] === `lewd`)) {
        msg.reply("*bonk*");
        return true;
    }

    //Ping
    else if ((args[0] === `ping`) || (args[0] === `echo`)){
        var wheel = Math.floor(Math.random() * 100);
        if ((50 <= wheel) && (wheel <= 55)){
            return msg.channel.send("<:toothless_ping:587068355987505155>");
        }
        else{
            return msg.channel.send('Pong!');
        }
    }

    return false;
}

//Exports
module.exports.processMessage = processMessage;
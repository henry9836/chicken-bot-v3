let debugging = require("../debugging.js");
let discordModule = require("../discordModule.js");
let mongoUtil = require("../mongoUtil.js");
let aiModule = require("./aiModule.js");
let botConfig = require('../.././config.json');


function processMessage(msg, client, args){
    //PRUNE
    if (args[0] === `prune`){
        let deleteNum = parseInt(args[1]);

        if (isNaN(deleteNum)) {
            msg.reply("You didn't supply an amount to prune");
            return true;
        }
        else {
            msg.channel
            .bulkDelete(deleteNum, true)
            .catch(err=>{
                debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
                msg.reply(`${err}`);
            })
            return true;
        }
    }

    //Silence AI
    else if (args[0] === `shut`){
        aiModule.Shut(msg);
        return true;
    }

    //KICK
    else if (args[0] === `kick`){
        //Kick the mentioned user
        let punishedUser = msg.mentions.users.first();
        discordModule.effectMember(msg.guild.member(punishedUser), msg, USERMOD.KICK);
        return true;
    }

    //BAN
    else if (args[0] === `ban`){
        let punishedUser = msg.mentions.users.first();
        discordModule.effectMember(msg.guild.member(punishedUser), msg, USERMOD.BAN);
        return true;
    }

    //Disable user from having verified role
    else if (args[0] === `punish`){
        if (args[1]){
            let punishedUser = msg.mentions.members.first();
            debugging.chickenScratch(`Punishing: ${punishedUser.id}`);
            mongoUtil.punish(punishedUser, msg);
        }
        else{
            msg.reply("You must tag a user");
        }
        return true;
    }

    //Allow user to have verified role
    else if (args[0] === `pardon`){
        if (args[1]){
            let punishedUser = msg.mentions.members.first();
            debugging.chickenScratch(`Pardoning: ${punishedUser.id}`);
            mongoUtil.pardon(punishedUser, msg);
        }
        else{
            msg.reply("You must tag a user");
        }
        return true;
    }

    return false;
}

function getHelpBlock(msg){
    let help = ("```" + `
    [ Moderator ]
    ${botConfig.prefix}ban <id> - bans member
    ${botConfig.prefix}kick <id> - kicks member
    ${botConfig.prefix}pardon <member> - allows user to be verified
    ${botConfig.prefix}punish <member> - removes verified from user
    ${botConfig.prefix}prune <amount> - removes last amount of messages (max is 100)
    ${botConfig.prefix}shut - silences awakened chicken
    ` + "```");
    msg.author.send(help);
}

//Exports
module.exports.processMessage = processMessage;
module.exports.getHelpBlock = getHelpBlock;
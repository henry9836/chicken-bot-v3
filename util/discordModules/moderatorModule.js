let debugging = require("../debugging.js");
let discordModule = require("../discordModule.js");
let mongoUtil = require("../mongoUtil.js");
let aiModule = require("./aiModule.js");
let botConfig = require('../.././config.json');
let e6 = require('../e6.js');

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
        aiModule.Shut();
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

    //----
    //E6
    //----

    else if (args[0] === `e6-info`){
        e6.getTags(msg);
        return true;
    }

    else if ((args[0] === `e6-disable`) || (args[0] === `e6-bonk`)){
        botConfig.e621.bonked = true;
        discordModule.saveConfig();
        return true;
    }

    else if (args[0] === `e6-enable`){
        botConfig.e621.bonked = false;
        discordModule.saveConfig();
        return true;
    }
    
    else if (args[0] === `e6-blacklist-tag`){
        if (args.length > 1){
            e6.updateTags(e6.TAGUPDATE.ADD_BLACK, args, msg);
        }
        else{
            msg.reply("Please specify tags seperated with spaces");
        }
        return true;
    }

    else if (args[0] === `e6-add-tag`){
        if (args.length > 1){
            e6.updateTags(e6.TAGUPDATE.ADD_WHITE, args, msg);
        }
        else{
            msg.reply("Please specify tags seperated with spaces");
        }
        return true;
    }

    else if (args[0] === `e6-sort`){
        if (args.length > 1){
            e6.updateSort(args[1], msg);
        }
        else{
            msg.reply("Please specify sort type");
        }
        return true;
    }

    else if (args[0] === `e6-remove-list`){
        if (args.length > 1){
            e6.updateTags(e6.TAGUPDATE.REMOVE_LIST, args, msg);
        }
        else{
            msg.reply("Please specify list index number to remove");
        }
        return true;
    }

    else if ((args[0] === `e6-remove`) || (args[0] === `e6-remove-tag`)){
        if (args.length > 1){
            e6.updateTags(e6.TAGUPDATE.REMOVE, args, msg);
        }
        else{
            msg.reply("Please specify tags seperated with spaces");
        }
        return true;
    }
    
    else if (args[0] === `lewd`){
        e6.give_lewd();
        return true;
    }

    return false;
}

function getHelpBlock(msg){
    let help = ("```" + `
    [ Moderator ]
    ${botConfig.prefix}ban <id> - bans member
    ${botConfig.prefix}e6-add-tag <id/tag> <tag>... - adds e6 tag(s) to a list, if id is supplied will add to the list that matches the id
    ${botConfig.prefix}e6-blacklist-tag <tag>... - adds tag(s) to a global e6 blacklist list
    ${botConfig.prefix}e6-bonk/e6-disable - disables e6 posting
    ${botConfig.prefix}e6-enable - enables e6 posting
    ${botConfig.prefix}e6-info - displays e6 infomation
    ${botConfig.prefix}e6-sort <none, random, score> - switches sorting for e6 posts
    ${botConfig.prefix}e6-remove <tag> ... - Removes a e6 tag(s) from all lists
    ${botConfig.prefix}e6-remove-list <id> - Removes an e6 tag list
    ${botConfig.prefix}kick <id> - kicks member
    ${botConfig.prefix}lewd - Forces bot to post in the e6 channel (overrides disabled status)
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
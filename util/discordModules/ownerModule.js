const debugging = require("../debugging.js");
const discordModule = require("../discordModule.js");
const mongoUtil = require("../mongoUtil.js");
const botConfig = require('../.././config.json');
const e6 = require('../e6.js');

const { exit } = require('process');

function processMessage(msg, client, args){
    //Add an admin
    if (args[0] === `add-admin`){
       discordModule.effectMember(msg.guild.member(msg.mentions.users.first()), msg, USERMOD.MAKEADMIN);
        return true;
    }

    //Remove an admin
    else if (args[0] === `remove-admin`){
        discordModule.effectMember(msg.guild.member(msg.mentions.users.first()), msg, USERMOD.REMOVEADMIN);
        return true;
    }

    //Force a crash
    else if (args[0] === `crash`)
        exit(2);

    //Assign Admin Role
    else if (args[0] === `assign-admin-role`){
        if (args[1]){
            //Validate role exists
            msg.guild.roles.fetch(args[1])
                .then(role => {
                    if (role !== null){
                        botConfig.roles.adminRole = role.id;
                        discordModule.saveConfig();
                        msg.reply(`Assigned ${role} as admin role`);
                    }
                    else {
                        msg.reply("Role ID doesn't exist"); 
                    }
                })
                .catch(err => {
                    msg.reply(err);
                })
        }
        else{
            msg.reply("You must supply a role id");
        }
        return true;
    }

    //Bot log channel
    else if (args[0] === `set-bot-log-channel`){
        if (args.length > 1){
            //Validate role exists
            let channel = msg.guild.channels.cache.get(args[1])
            
            if (channel !== undefined){
                botConfig.channels.log = channel.id;
                discordModule.logChannel = channel;
                discordModule.saveConfig();
                msg.reply(`Assigned ${channel} as log channel`);
            }
            else{
                msg.reply("Channel ID doesn't exist or hidden")
            }
        }
        else{
            msg.reply("Please specify a channel id");
        }
        return true;
    }

    return false;
}

function getHelpBlock(msg){
    let help = ("```" + `
    [ Owner ]
    ${botConfig.prefix}add-admin <member> - assigns the admin role to a user
    ${botConfig.prefix}assign-admin-role <id> - assigns the admin role
    ${botConfig.prefix}remove-admin <id> - removes the admin role from a user
    ${botConfig.prefix}set-bot-log-channel <id> - sets the channel where the bot outputs a log to
    ${botConfig.prefix}update - updates the bot
    ` + "```");
    msg.author.send(help);
}

//Exports
module.exports.processMessage = processMessage;
module.exports.getHelpBlock = getHelpBlock;
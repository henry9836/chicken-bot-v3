let debugging = require("../debugging.js");
let discordModule = require("../discordModule.js");
let mongoUtil = require("../mongoUtil.js");
let aiModule = require("./aiModule.js");
let botConfig = require('../.././config.json');

let { MessageEmbed } = require("discord.js");

function processMessage(msg, client, args){

    //Avatar grabber
    if (args[0] === `avatar`){
        //No users supplied just grab author info
        if (!msg.mentions.users.size){
            //Create an embed message
            let embed = new MessageEmbed()
                .setTitle(`${msg.author.username}`)
                .setURL(`${msg.author.displayAvatarURL()}`)
                .setImage(`${msg.author.displayAvatarURL({format: 'png', dynamic: true})}`);

            msg.reply(embed);
            return true;
        }
        //Return a list of users
        let listOfAvatars = msg.mentions.users.map(user =>{
            let embed = new MessageEmbed()
                .setTitle(`${user.username}`)
                .setURL(`${user.displayAvatarURL()}`)
                .setImage(`${user.displayAvatarURL({format: 'png', dynamic: true})}`);

            msg.reply(embed);
            return true;
        });
        return true;
    }

    // Add to AI IgnoreList
    else if(args[0] === `ignoreme`){
        aiModule.UpdateIgnoreList(msg, true);
        return true;
    }

    // Remove from AI IgnoreList
    else if(args[0] === `pardonignore`){
        aiModule.UpdateIgnoreList(msg, false);
        return true;
    }

    //Petition
    else if (args[0] === `petition`){
        if (args.length > 1){
            if (discordModule.petitionChannel != undefined){
                discordModule.petitionChannel.send(msg.toString().replace(`${botConfig.prefix}${args[0]} `, `Petition By ${msg.author}: `))
                .then(function (message){
                    message.react("👍");
                    message.react("👎");
                })
                .catch(function (err){
                    debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN)
                })
                return true;
            }
            else{
                msg.reply("quote channel not assigned")
            }
        }
        else{
            msg.reply("You need to supply a message to petition")
        }

        return true;
    }

    //Quote
    else if (args[0] === `quote`){
        if (msg.attachments.array().length > 0){
            if (discordModule.quoteChannel != undefined){

                let embed = new MessageEmbed()
                .setTitle(msg.author.username)
                .setImage(msg.attachments.array()[0].url)
                .setTimestamp(Date.now())

                discordModule.quoteChannel.send(embed);
                return true;
            }
            else{
                msg.reply("quote channel not assigned")
            }
        }
        else{
            msg.reply("You need to attach an image")
        }
        return true;
    }

    //NSFW-Quote
    else if (args[0] === `nsfw-quote`){
        if (msg.attachments.array().length > 0){
            if (discordModule.nsfwQuoteChannel != undefined){
                if (msg.channel.nsfw){
                    if (discordModule.nsfwQuoteChannel.nsfw){
                        let embed = new MessageEmbed()
                        .setTitle(msg.author.username)
                        .setImage(msg.attachments.array()[0].url)
                        .setTimestamp(Date.now())

                        discordModule.nsfwQuoteChannel.send(embed);
                        return true;
                    }
                    else {
                        msg.reply("Assigned NSFW Quote channel not a nsfw channel!")
                    }
                }
                else{
                    msg.delete();
                }
            }
            else{
                msg.reply("quote channel not assigned")
            }
        }
        else{
            msg.reply("You need to attach an image")
        }
        return true;
    }

    //Add a public role
    else if (args[0] === `add-role`){
        if (args[1]){
            var message = msg.toString().replace(`${botConfig.prefix}${args[0]} `, "")
            for (let i = 0; i < botConfig.roles.publicRoles.length; i++) {
                if (botConfig.roles.publicRoles[i][1] == message){
                    let role = msg.guild.roles.cache.get(botConfig.roles.publicRoles[i][0])

                    //Role needs a prereq?
                    if (botConfig.roles.publicRoles[i][2] != undefined)
                    {
                        if (msg.member.roles.cache.has(botConfig.roles.publicRoles[i][2]))
                        {
                            msg.member.roles.add(role);
                            msg.react("✅");
                        }
                        else
                        {
                            msg.react("❌");
                            msg.reply("You do not have the required role to add this role");
                        }
                    }
                    //No prereq needed
                    else
                    {
                        msg.member.roles.add(role);
                        msg.react("✅");
                    }
                }
            }
        }
        else{
            msg.reply("You need to supply a role name, use role-list to get a list of assignable roles")
        }
        return true;
    }
    //Remove a public role
    else if (args[0] === `remove-role`){
        if (args[1]){
            var message = msg.toString().replace(`${botConfig.prefix}${args[0]} `, "")
            for (let i = 0; i < botConfig.roles.publicRoles.length; i++) {
                if (botConfig.roles.publicRoles[i][1] == message){
                    let role = msg.guild.roles.cache.get(botConfig.roles.publicRoles[i][0])
                    msg.member.roles.remove(role);
                    msg.react("✅");
                }
            }
        }
        else{
            msg.reply("You need to supply a role name, use role-list to get a list of assignable roles")
        }
        return true;
    }
    //Get Role List
    else if (args[0] === `role-list`){
        var list = "Assignable Roles: "
        for (let i = 0; i < botConfig.roles.publicRoles.length; i++) {
            list += " `" + botConfig.roles.publicRoles[i][1] + "` ,"
        }
        msg.reply(list);
        return true;
    }

    //Server info
    else if (args[0] === `info`){
        let embed = new MessageEmbed()
            .setTitle(`${msg.guild.name}`)
            .setImage(`${msg.guild.iconURL()}`)
            .addFields(
                { name: 'Member Count', value: `${msg.guild.memberCount}` },
                { name: 'Created At', value: `${msg.guild.createdAt}` },
                { name: 'Region', value: `${msg.guild.region}`},
                { name: 'Current Boost Count', value: `${msg.guild.premiumSubscriptionCount}`}
            )
        msg.channel.send(embed);
        return true;
    }
   

    else if (args[0] === `help`){
        return discordModule.getHelp(msg);
    }

    //No Perms to do command
    blacklist = ["e6", "ban", "kick", "pardon", "punish", "prune", "set-", "remove-", "assign-", "update"]
    for (let b = 0; b < blacklist.length; b++) {
        if (args[0] === `${blacklist[b]}`){
            replies = ["Permission denied", "*You have no power here!* SQUACK!", "*continues pecking the ground*"]
            msg.reply(replies[Math.floor(Math.random() * replies.length)]);
            return true;
        }
    }

    return false;
}

function getHelpBlock(msg){
    return ("```" + `
    [ Public ]
    ${botConfig.prefix}avatar <member> - Displays users profile picture
    ${botConfig.prefix}add-role <role> - Assigns a public role
    ${botConfig.prefix}help - Display help
    ${botConfig.prefix}ignoreme - Awakened chicken will ignore you
    ${botConfig.prefix}info - Displays server info
    ${botConfig.prefix}nsfw-quote <attachment> - Creates a nsfw quote in the nsfw-quotes channel
    ${botConfig.prefix}oldspice - tell a "spicy"
    ${botConfig.prefix}pardonignore - Awakened chicken will listen to you
    ${botConfig.prefix}petition <message> - Create a petition
    ${botConfig.prefix}ping - Makes the bot respond with Pong  
    ${botConfig.prefix}quote <attachment> - Creates a quote in the quotes channel
    ${botConfig.prefix}remove-role <role> - Removes a public role
    ${botConfig.prefix}role-list - List public roles
    ${botConfig.prefix}sweetdreams - tell "somebody" to go to bed
    ` + "```");
}

function handleIgnoreUser(msg){
    replies = ["*continues pecking the ground*", "\"Must of been the wind\"", "*bawk?*"]
    //50/50 if we send a message
    if (Math.floor(Math.random() * 100 > 50)){
        msg.reply(replies[Math.floor(Math.random() * replies.length)]);
    }
}

//Exports
module.exports.processMessage = processMessage;
module.exports.getHelpBlock = getHelpBlock;
module.exports.handleIgnoreUser = handleIgnoreUser;

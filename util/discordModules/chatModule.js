const debugging = require("../debugging.js");
const discordModule = require("../discordModule.js");
const mongoUtil = require("../mongoUtil.js");
const botConfig = require('../.././config.json');
const e6 = require('../e6.js');

const { MessageEmbed } = require("discord.js");

var sweetdreamsSpeedLock = false;
var sweetdreamsLock = false;

//Sweetdreams command, sorry furi 
function sweetdreams(msg){

    //Get Furi
    let member = msg.guild.members.cache.get('693042484619509760');

    //Flip coin
    let coin = Math.floor(Math.random() * 100);

    //15% chance of dc
    if (coin >= 75){
        //Disconnects user from vc
        member.voice.setChannel(null);
    }

    messages = ["https://media.discordapp.net/attachments/206875238066028544/970993761691766784/Untitled_Artwork.png", "GO TO BED! <@693042484619509760>"];
    msg.channel.send(messages[Math.floor(Math.random() * messages.length)]);
}

function processMessage(msg, client, args){
    //Get best rated e6 posts
    if(args[0] === `e6-best`){
        if (msg.channel.nsfw){
            e6.gib_best(msg, args, false);
        }
        msg.delete();
        return true;
    }
    //Get worst rated e6 posts
    else if(args[0] === `e6-worst`){
        if (msg.channel.nsfw){
            e6.gib_best(msg, args, true);
        }
        msg.delete();
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

                const embed = new MessageEmbed()
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
                        const embed = new MessageEmbed()
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

    //Sweet Dreams
    else if (args[0] == "sweetdreams"){
        //Get Current Time
        let currentHour = new Date().getUTCHours();

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
                    sweetdreams(msg);

                    //Locks
                    sweetdreamsSpeedLock = true;

                    //Reset Speed Lock
                    setTimeout(() => {
                        sweetdreamsSpeedLock = false;
                    }, 60*60*1000);
                }
                //else if (msg.author.id != "255121046607233025"){
                else if (msg.author.id == "102606498860896256"){

                    //Send Message
                    sweetdreams(msg);

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

    //Avatar grabber
    else if (args[0] === `avatar`){
        //No users supplied just grab author info
        if (!msg.mentions.users.size){
            //Create an embed message
            const embed = new MessageEmbed()
                .setTitle(`${msg.author.username}`)
                .setURL(`${msg.author.displayAvatarURL()}`)
                .setImage(`${msg.author.displayAvatarURL({format: 'png', dynamic: true})}`);

            msg.reply(embed);
            return true;
        }
        //Return a list of users
        const listOfAvatars = msg.mentions.users.map(user =>{
            const embed = new MessageEmbed()
                .setTitle(`${user.username}`)
                .setURL(`${user.displayAvatarURL()}`)
                .setImage(`${user.displayAvatarURL({format: 'png', dynamic: true})}`);

            msg.reply(embed);
            return true;
        });
        return true;
    }
    //Add a public role
    else if (args[0] === `add-role`){
        if (args[1]){
            var message = msg.toString().replace(`${botConfig.prefix}${args[0]} `, "")
            for (let i = 0; i < botConfig.roles.publicRoles.length; i++) {
                if (botConfig.roles.publicRoles[i][1] == message){
                    let role = msg.guild.roles.cache.get(botConfig.roles.publicRoles[i][0])
                    msg.member.roles.add(role);
                    msg.react("✅");
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
        const embed = new MessageEmbed()
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
    ${botConfig.prefix}e6-best <num> - Grabs the highest rated e6 posts on the discord
    ${botConfig.prefix}e6-worst <num> - Grabs the lowest rated e6 posts on the discord
    ${botConfig.prefix}help - Display help
    ${botConfig.prefix}info - Displays server info
    ${botConfig.prefix}nsfw-quote <attachment> - Creates a nsfw quote in the nsfw-quotes channel
    ${botConfig.prefix}petition <message> - Create a petition
    ${botConfig.prefix}ping - Makes the bot respond with Pong  
    ${botConfig.prefix}quote <attachment> - Creates a quote in the quotes channel
    ${botConfig.prefix}remove-role <role> - Removes a public role
    ${botConfig.prefix}role-list - List public roles
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
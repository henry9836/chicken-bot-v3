const fs = require('fs');
const debugging = require("./debugging.js");
const mongoUtil = require("./mongoUtil.js");
const botConfig = require('.././config.json');
const e6 = require('./e6.js');
const { MessageEmbed } = require("discord.js");
const { exit } = require('process');

USERMOD = {
    MAKEADMIN : 0,
    MAKEMOD : 1,
    REMOVEADMIN : 2,
    REMOVEMOD : 3,
    BAN : 4,
    KICK : 5,
    VERIFY: 6,
    UNVERIFY: 7
}

var quoteChannel = undefined;
var nsfwQuoteChannel = undefined;
var petitionChannel = undefined;
var verifiedChannel = undefined;
var logChannel = undefined;
var eventsChannel = undefined;

function applyMessageEffectors(msg, user){

    msg = msg.replace("<user>", `<@${user.id}>`);

    return msg;
}

function announceEvent(announcement){
    debugging.chickenScratch("Announcing: " + announcement);
    eventsChannel.send(announcement);
}

//Updates the config file via discord command
function saveConfig(){
    //Convert our botConfig to json
    var jsonData = JSON.stringify(botConfig);
    //debugging.chickenScratch(jsonData);
    fs.writeFileSync('./config.json', jsonData, 'utf8', (err) => {
        if (err){
            debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
        }
        else{
            debugging.chickenScratch("Config File Updated");
        }
    });
}

function isOwner(msg){
    return (msg.guild.ownerID === msg.author.id);
    /**
     * 
     * Useful for development debugging
     * 
    */
    //return ((msg.guild.ownerID === msg.author.id) || (msg.author.id == "102606498860896256"));
}

function isAdmin(msg){
    //If we own the server
    if (isOwner(msg)){
        return true;
    }
    //Has admin role
    if (msg.member.roles.cache.has(botConfig.roles.adminRole)){
        return true;
    }

    return false;
}

function isMod(msg){
    //If we are an admin or above the server
    if (isAdmin(msg)){
        return true;
    }

    //Has mod role
    if (msg.member.roles.cache.has(botConfig.roles.modRole)){
        return true;
    }

    return false;
}

//Effects a discord user (banning, kicking, promoting, etc)
//Auto verifying is done in mongoUtil under function messageTick
function effectMember(member, msg, mod){
    const user = member.user;
    if (member){
        //Verify
        if (mod === USERMOD.VERIFY){
            //Determine if the user has a pre-emptive block
            if (botConfig.roles.didNotReadInfoRole)
            {
                //If the user is not allowed to be verified don't continue
                if (member.roles.cache.has(botConfig.roles.didNotReadInfoRole))
                    return;
            }
            else{
                msg.reply("Error, didNotReadInfo role not set!")
            }

            //If we have the verify role
            if (botConfig.roles.verifiedRole){
                //Stop spam
                if ((member.roles.cache.has(botConfig.roles.verifiedRole)) != true){
                    member.roles.add(botConfig.roles.verifiedRole);
                    if (verifiedChannel){
                        var welcome = applyMessageEffectors(botConfig.welcomeToVerified, user);
                        verifiedChannel.send(welcome)
                    }
                    if (logChannel != undefined){
                        logChannel.send(`Verified ${user.tag}!`);
                    }
                }
                return;
            }
            else{
                return msg.reply("Verified role un-assigned in config");
            }
        }
        //Pardon
        if (mod == USERMOD.PARDON){
            if (botConfig.roles.verifiedRole){
                member.roles.add(botConfig.roles.verifiedRole);
                if (logChannel != undefined){
                    logChannel.send(`Pardoned ${user.tag}! Command issued by ${msg.author.tag}` + "```" + `${msg.toString()}` + "```");
                }
                return;
            }
            else{
                return msg.reply("Verified role un-assigned in config");
            }
        }
        //Un-Verify
        else if (mod === USERMOD.UNVERIFY){
            if (botConfig.roles.verifiedRole){
                member.roles.remove(botConfig.roles.verifiedRole);
                if (logChannel != undefined){
                    logChannel.send(`Punished ${user.tag}! Command issued by ${msg.author.tag}` + "```" + `${msg.toString()}` + "```");
                }
                return;
            }
            else{
                return msg.reply("Verified role un-assigned in config");
            }
        }
        //Bans
        else if (mod === USERMOD.BAN){
            member
                .ban({reason: msg.toString()})
                .then(() => {
                    if (logChannel != undefined){
                        logChannel.send(`Banned ${user.tag}, ban hammer wielded by ${msg.author}` + "```" + `${msg.toString()}` + "```");
                    }
                    return msg.reply(`Successfully banned ${user.tag}`)
                })
                .catch(err => {
                    debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
                    return msg.reply(`I was unable to ban ${user.tag}`);
                });
        }
        //Kick
        else if (mod === USERMOD.KICK){
            member
                .kick(msg.toString())
                .then(() => {
                    if (logChannel != undefined){
                        logChannel.send(`Kicked ${user.tag}, booted by ${msg.author}` + "```" + `${msg.toString()}` + "```");
                    }
                    return msg.reply(`Successfully kicked ${user.tag}`)
                })
                .catch(err => {
                    debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
                    return msg.reply(`I was unable to kick ${user.tag}`);
                });
        }
        //Assign Admin
        else if (mod == USERMOD.MAKEADMIN){
            if (botConfig.roles.adminRole){
                if (logChannel != undefined){
                    logChannel.send(`Promoted ${user.tag} to admin, knighted by ${msg.author}` + "```" + `${msg.toString()}` + "```");
                }
                member.roles.add(botConfig.roles.adminRole);
                var welcome = applyMessageEffectors(botConfig.welcometoAdmin, user);
                return msg.channel.send(welcome);
            }
            else{
                return msg.reply("Admin role un-assigned in config");
            }
        }
        //Assign Mod
        else if (mod == USERMOD.MAKEMOD){
            if (botConfig.roles.modRole){
                if (logChannel != undefined){
                    logChannel.send(`Promoted ${user.tag} to mod, knighted by ${msg.author}` + "```" + `${msg.toString()}` + "```");
                }
                member.roles.add(botConfig.roles.modRole);
                var welcome = applyMessageEffectors(botConfig.welcometoMod, user);
                return msg.channel.send(welcome);
            }
            else{
                return msg.reply("Mod role un-assigned in config");
            }
        }
        //Remove Admin
        else if (mod == USERMOD.REMOVEADMIN){
            if (botConfig.roles.adminRole){
                if (logChannel != undefined){
                    logChannel.send(`Demoted ${user.tag} to mod, dethorned by ${msg.author}` + "```" + `${msg.toString()}` + "```");
                }
                member.roles.remove(botConfig.roles.adminRole);
                return msg.reply(`Removed ${user.tag}'s Admin Role`);
            }
            else{
                return msg.reply("Admin role un-assigned in config");
            }
        }
        //Remove Mod
        else if (mod == USERMOD.REMOVEMOD){
            if (botConfig.roles.modRole){
                if (logChannel != undefined){
                    logChannel.send(`Removed ${user.tag}'s mod, thrown out by ${msg.author}` + "```" + `${msg.toString()}` + "```");
                }
                member.roles.remove(botConfig.roles.modRole);
                return msg.reply(`Removed ${user.tag}'s Mod Role`);
            }
            else{
                return msg.reply("Mod role un-assigned in config");
            }
        }
        else{
            return msg.reply("ERROR CODE 500");
        }
    }
    else{
        return msg.reply("That user does not exist");
    }
}

//Process a reaction
function processReaction(reaction, user){
    //If we are in the e6 channel
    if (reaction.message.channel.id == botConfig.e621.e6Channel){
        //console.log(reaction);
        //get both up and down count
        try{
            let ups = reaction.message.reactions.cache.get('👍').count;
            let downs = reaction.message.reactions.cache.get('👎').count;
            let rating = ups - downs;

            //add then update db
            mongoUtil.updatePostRating(reaction.message, rating);
        }
        catch(err){}
    }
}

//Process Incoming Messages
function processMessage(msg, client){

    // Ignore messages that aren't from a guild
    if (!msg.guild) return;

    //Tick Message Counter
    mongoUtil.messageTick(msg.member, msg);

    //Attempt to setup quote channels if it doesn't exist
    if (quoteChannel == undefined){
        if (botConfig.channels.quotes != ""){
            quoteChannel = msg.guild.channels.cache.get(botConfig.channels.quotes)
        }
    }
    if (nsfwQuoteChannel == undefined){
        if (botConfig.channels.nsfwquotes != ""){
            nsfwQuoteChannel = msg.guild.channels.cache.get(botConfig.channels.nsfwquotes)
        }
    }
    if (petitionChannel == undefined){
        if (botConfig.channels.petitions != ""){
            petitionChannel = msg.guild.channels.cache.get(botConfig.channels.petitions)
        }
    }
    if (verifiedChannel == undefined){
        if (botConfig.channels.verified != ""){
            verifiedChannel = msg.guild.channels.cache.get(botConfig.channels.verified)
        }
    }
    if (logChannel == undefined){
        if (botConfig.channels.log != ""){
            logChannel = msg.guild.channels.cache.get(botConfig.channels.log)
        }
    }
    if (eventsChannel == undefined){
        if (botConfig.channels.events != ""){
            eventsChannel = msg.guild.channels.cache.get(botConfig.channels.eventsChannel)
        }
    }

    //Get args for the message
    const args = msg.content.slice(botConfig.prefix.length).trim().split(' ');


    //Ignore Messages that have too many PREFIXs (!!!!!!!break-bot)
    if (args[0].includes(botConfig.prefix)) return;
    
    //Ignore Messages that are empty
    if (args[0].length == 0) return;
    
    //Commands
    if (msg.content.startsWith(botConfig.prefix)){

        ///==================================
        //OWNER LEVEL
        ///==================================
        if (isOwner(msg)){
            //Add an admin
            if (args[0] === `add-admin`) {
                return effectMember(msg.guild.member(msg.mentions.users.first()), msg, USERMOD.MAKEADMIN);
            }
            //Remove an admin
            else if (args[0] === `remove-admin`){
                return effectMember(msg.guild.member(msg.mentions.users.first()), msg, USERMOD.REMOVEADMIN);
            }
            //Force a crash
            else if (args[0] === `crash`){
                exit(1);
            }

            //Assign Admin Role
            else if (args[0] === `assign-admin-role`){
                if (args[1]){
                    //Validate role exists
                    msg.guild.roles.fetch(args[1])
                        .then(role => {
                            if (role !== null){
                                botConfig.roles.adminRole = role.id;
                                saveConfig();
                                return msg.reply(`Assigned ${role} as admin role`);
                            }
                            else {
                                return msg.reply("Role ID doesn't exist"); 
                            }
                        })
                        .catch(err => {
                            return msg.reply(err);
                        })
                }
                else{
                    return msg.reply("You must supply a role id");
                }
                return;
            }
            
            //Bot log channel
            else if (args[0] === `set-bot-log-channel`){
                if (args.length > 1){
                    //Validate role exists
                    let channel = msg.guild.channels.cache.get(args[1])
                    
                    if (channel !== undefined){
                        botConfig.channels.log = channel.id;
                        logChannel = channel;
                        saveConfig();
                        msg.reply(`Assigned ${channel} as log channel`);
                    }
                    else{
                        msg.reply("Channel ID doesn't exist or hidden")
                    }
                }
                else{
                    msg.reply("Please specify a channel id");
                }
                return;
            }
        }

        ///==================================
        //ADMIN LEVEL
        ///==================================
        if (isAdmin(msg)) {

            //Update the bot
            if (args[0] === `update`) {
                exit(1);
            }

            //Assign Mod Role
            else if (args[0] === `add-mod`){
                return effectMember(msg.guild.member(msg.mentions.users.first()), msg, USERMOD.MAKEMOD);
            }
            //Remove a mod
            else if (args[0] === `remove-mod`){
                return effectMember(msg.guild.member(msg.mentions.users.first()), msg, USERMOD.REMOVEMOD);
            }
            //Assign Mod Role
            else if (args[0] === `assign-mod-role`){
                if (args[1]){
                    //Validate role exists
                    msg.guild.roles.fetch(args[1])
                        .then(role => {
                            if (role !== null){
                                botConfig.roles.modRole = role.id;
                                saveConfig();
                                return msg.reply(`Assigned ${role} as mod role`);
                            }
                            else {
                                return msg.reply("Role ID doesn't exist"); 
                            }
                        })
                        .catch(err => {
                            return msg.reply(err);
                        })
                }
                else{
                    return msg.reply("You must supply a role id");
                }
                return;
            }
            else if (args[0] === `set-quote-channel`){
                if (args.length > 1){
                    //Validate role exists
                    let channel = msg.guild.channels.cache.get(args[1])
                    if (channel !== undefined){
                        botConfig.channels.quotes = channel.id;
                        quoteChannel = channel;
                        saveConfig();
                        return msg.reply(`Assigned ${channel} as quote channel`);
                    }
                    else{
                        return msg.reply("Channel ID doesn't exist or hidden")
                    }
                }
                else{
                    return msg.reply("Please specify a channel id");
                }
            }
            //Verified channel
            else if (args[0] === `set-verified-channel`){
                if (args.length > 1){
                    //Validate role exists
                    let channel = msg.guild.channels.cache.get(args[1])
                    if (channel !== undefined){
                        botConfig.channels.verified = channel.id;
                        verifiedChannel = channel;
                        saveConfig();
                        msg.reply(`Assigned ${channel} as verifed channel`);
                    }
                    else{
                        msg.reply("Channel ID doesn't exist or hidden")
                    }
                }
                else{
                    msg.reply("Please specify a channel id");
                }
                return;
            }
            else if (args[0] === `set-events-channel`){
                if (args.length > 1){
                    //Validate role exists
                    let channel = msg.guild.channels.cache.get(args[1])
                    if (channel !== undefined){
                        botConfig.channels.eventsChannel = channel.id;
                        saveConfig();
                        eventsChannel = channel;
                        return msg.reply(`Assigned ${channel} as event channel`);
                    }
                    else{
                        return msg.reply("Channel ID doesn't exist or hidden")
                    }
                }
                else{
                    return msg.reply("Please specify a channel id");
                }
            }
            else if (args[0] === `set-nsfw-quote-channel`){
                if (args.length > 1){
                    //Validate role exists
                    let channel = msg.guild.channels.cache.get(args[1])
                    if (channel !== undefined){
                        if (channel.nsfw){
                            botConfig.channels.nsfwquotes = channel.id;
                            saveConfig();
                            nsfwQuoteChannel = channel;
                            return msg.reply(`Assigned ${channel} as nsfw quote channel`);
                        }
                        else{
                            return msg.reply("Channel isn't marked nsfw!")
                        }
                    }
                    else{
                        return msg.reply("Channel ID doesn't exist or hidden")
                    }gib_best
                }
                else{
                    return msg.reply("Please specify a channel id");
                }
            }
            else if (args[0] === `set-petition-channel`){
                if (args.length > 1){
                    //Validate role exists
                    let channel = msg.guild.channels.cache.get(args[1])
                    if (channel !== undefined){
                        botConfig.channels.petitions = channel.id;
                        saveConfig();
                        petitionChannel = channel;
                        return msg.reply(`Assigned ${channel} as petition channel`);
                    }
                    else{
                        return msg.reply("Channel ID doesn't exist or hidden")
                    }
                }
                else{
                    return msg.reply("Please specify a channel id");
                }
            }

            //Stop role from being assigned by everyone
            else if (args[0] === `remove-role-assignable`){
                if (args[1]){
                    //For every role supplied
                    for (let i = 1; i < args.length; i++) {
                        //Validate role exists
                        msg.guild.roles.fetch(args[i])
                        .then(role => {
                            if (role !== null){
                                //Find the role and remove it
                                for (let j = 0; j < botConfig.roles.publicRoles.length; j++) {
                                    if (botConfig.roles.publicRoles[j] == role.id){
                                        botConfig.roles.publicRoles.splice(j, 1);
                                        break;
                                    }
                                }
                                saveConfig();
                                return msg.reply(`Removed ${role} role from public list`);
                            }
                            else {
                                return msg.reply("Role ID doesn't exist"); 
                            }
                        })
                        .catch(err => {
                            return msg.reply(err);
                        })
                    }
                }
                else{
                    return msg.reply("You must supply a role id");
                }
                return;
            }

            //Set role as assignable by everyone
            else if (args[0] === `set-role-assignable`){
                if (args[1]){
                    //For every role supplied
                    for (let i = 1; i < args.length; i++) {
                        //Validate role exists
                        msg.guild.roles.fetch(args[i])
                        .then(role => {
                            if (role !== null){
                                //Check that this role isn't already in our list
                                var found = false;
                                for (let j = 0; j < botConfig.roles.publicRoles.length; j++) {
                                    if (botConfig.roles.publicRoles[j] == role.id){
                                        found = true;
                                        break;
                                    }
                                }
                                if (found){
                                    return;
                                }

                                botConfig.roles.publicRoles.push([role.id, role.name]);
                                saveConfig();
                                return msg.reply(`Assigned ${role} role to public list`);
                            }
                            else {
                                return msg.reply("Role ID doesn't exist"); 
                            }
                        })
                        .catch(err => {
                            return msg.reply(err);
                        })
                    }
                }
                else{
                    return msg.reply("You must supply a role id");
                }
                return;
            }
            //Assign Verify Role
            else if (args[0] === `assign-verified-role`){
                if (args[1]){
                    //Validate role exists
                    msg.guild.roles.fetch(args[1])
                        .then(role => {
                            if (role !== null){
                                botConfig.roles.verifiedRole = role.id;
                                saveConfig();
                                return msg.reply(`Assigned ${role} as verified role`);
                            }
                            else {
                                return msg.reply("Role ID doesn't exist"); 
                            }role
                        })
                        .catch(err => {
                            return msg.reply(err);
                        })
                }
                else{
                    return msg.reply("You must supply a role id");
                }
                return;
            }
            //Assign Did not read info
            else if (args[0] === `assign-didnotread-role`){
                if (args[1]){
                    //Validate role exists
                    msg.guild.roles.fetch(args[1])
                        .then(role => {
                            if (role !== null){
                                botConfig.roles.didNotReadInfoRole = role.id;
                                saveConfig();
                                return msg.reply(`Assigned ${role} as didNotReadInfo role`);
                            }
                            else {
                                return msg.reply("Role ID doesn't exist"); 
                            }role
                        })
                        .catch(err => {
                            return msg.reply(err);
                        })
                }
                else{
                    return msg.reply("You must supply a role id");
                }
                return;
            }
            //----
            //E6
            //----
            else if (args[0] === `e6-reset`){
                e6.clearTags();
                return msg.reply("Done.");
            }
            else if (args[0] === `e6-set-channel`){
                if (args.length > 1){
                    //Validate role exists
                    let channel = msg.guild.channels.cache.get(args[1])
                    if (channel !== undefined){
                        botConfig.e621.e6Channel = channel.id;
                        saveConfig();
                        return msg.reply(`Assigned ${channel} as e621 channel`);
                    }
                    else{
                        return msg.reply("Channel ID doesn't exist or hidden")
                    }
                }
                else{
                    return msg.reply("Please specify a channel id");
                }
                return;
            }
        }

        ///==================================
        //MODERATOR LEVEL
        ///==================================
        if (isMod(msg)) {
            //PRUNE
            if (args[0] === `prune`){
                let deleteNum = parseInt(args[1]);

                if (isNaN(deleteNum)) {
                    return msg.reply("You didn't supply an amount to prune");
                }
                else {
                    msg.channel
                    .bulkDelete(deleteNum, true)
                    .catch(err=>{
                        debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
                        return msg.reply(`${err}`);
                    })
                    return;
                }
            }
            //KICK
            else if (args[0] === `kick`){
                //Kick the mentioned user
                const punishedUser = msg.mentions.users.first();
                return effectMember(msg.guild.member(punishedUser), msg, USERMOD.KICK);
            }
            //BAN
            else if (args[0] === `ban`){
                const punishedUser = msg.mentions.users.first();
                return effectMember(msg.guild.member(punishedUser), msg, USERMOD.BAN);
            }
            //Disable user from having verified role
            else if (args[0] === `punish`){
                if (args[1]){
                    const punishedUser = msg.mentions.members.first();
                    debugging.chickenScratch(`Punishing: ${punishedUser.id}`);
                    mongoUtil.punish(punishedUser, msg);
                }
                else{
                    msg.reply("You must tag a user");
                }
                return;
            }
            //Allow user to have verified role
            else if (args[0] === `pardon`){
                if (args[1]){
                    const punishedUser = msg.mentions.members.first();
                    debugging.chickenScratch(`Pardoning: ${punishedUser.id}`);
                    mongoUtil.pardon(punishedUser, msg);
                }
                else{
                    msg.reply("You must tag a user");
                }
                return;
            }


            //----
            //E6
            //----
            
            else if (args[0] === `e6-info`){
                return e6.getTags(msg);
            }
            else if ((args[0] === `e6-disable`) || (args[0] === `e6-bonk`)){
                botConfig.e621.bonked = true;
                saveConfig();
            }
            else if (args[0] === `e6-enable`){
                botConfig.e621.bonked = false;
                saveConfig();
            }
            else if (args[0] === `e6-blacklist-tag`){
                if (args.length > 1){
                    e6.updateTags(e6.TAGUPDATE.ADD_BLACK, args, msg);
                }
                else{
                    msg.reply("Please specify tags seperated with spaces");
                }
                return;
            }
            else if (args[0] === `e6-add-tag`){
                if (args.length > 1){
                    e6.updateTags(e6.TAGUPDATE.ADD_WHITE, args, msg);
                }
                else{
                    msg.reply("Please specify tags seperated with spaces");
                }
                return;
            }
            else if (args[0] === `e6-sort`){
                if (args.length > 1){
                    e6.updateSort(args[1], msg);
                }
                else{
                    msg.reply("Please specify sort type");
                }
                return;
            }
            else if (args[0] === `e6-remove-list`){
                if (args.length > 1){
                    e6.updateTags(e6.TAGUPDATE.REMOVE_LIST, args, msg);
                }
                else{
                    msg.reply("Please specify list index number to remove");
                }
                return;
            }
            else if ((args[0] === `e6-remove`) || (args[0] === `e6-remove-tag`)){
                if (args.length > 1){
                    e6.updateTags(e6.TAGUPDATE.REMOVE, args, msg);
                }
                else{
                    msg.reply("Please specify tags seperated with spaces");
                }
                return;
            }
            else if (args[0] === `lewd`){
                e6.give_lewd();
                return;
            }
        }

        ///==================================
        //SAFE
        ///==================================

        //Help
        if (args[0] === `help`){
            msg.author.send(`
            [ 🐔 ] 𝗖𝗵𝗶𝗰𝗸𝗲𝗻𝗕𝗼𝘁 - 𝘃𝟯.𝟬
            𝘉𝘶𝘪𝘭𝘵 𝘣𝘺 𝘕𝘪𝘵𝘳𝘰\n`);

            msg.author.send("```" + `
            [ Owner ]
            ${botConfig.prefix}add-admin <member> - assigns the admin role to a user
            ${botConfig.prefix}assign-admin-role <id> - assigns the admin role
            ${botConfig.prefix}remove-admin <id> - removes the admin role from a user
            ${botConfig.prefix}set-bot-log-channel <id> - sets the channel where the bot outputs a log to
            ${botConfig.prefix}update - updates the bot
            ` + "```");
            msg.author.send("```" + `
            [ Admin ]
            ${botConfig.prefix}add-mod <member> - assigns the mod role to a user
            ${botConfig.prefix}add-role-assignable <id> - adds a role to the assignable list
            ${botConfig.prefix}set-role-assignable <id> - Makes role assignable by anyone
            ${botConfig.prefix}assign-mod-role <id> - assigns the mod role
            ${botConfig.prefix}assign-verified-role <id> - assigns the verified role
            ${botConfig.prefix}assign-didnotread-role <id> - assigns the did not read info role, prevents a user from being verified
            ${botConfig.prefix}e6-reset - resets all lists to nothing, including blacklist
            ${botConfig.prefix}e6-set-channel <id> - Assigns e6 channel
            ${botConfig.prefix}remove-mod <member> - removes the mod role from a user
            ${botConfig.prefix}set-nsfw-quote-channel <id> - Assign nsfw quote channel
            ${botConfig.prefix}set-petition-channel <id> - Assigns the petition channel
            ${botConfig.prefix}set-quote-channel <id> - Assign quote channel
            ${botConfig.prefix}set-verified-channel <id> - Assigns the verified channel
            ${botConfig.prefix}set-events-channel <id> - Assign events channel
            ${botConfig.prefix}remove-role-assignable <id> - removes a role from the assignable list
            ` + "```");
            msg.author.send("```" + `
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
            ` + "```");
            msg.author.send("```" + `
            [ Public ]
            ${botConfig.prefix}avatar <member> - Displays users profile picture
            ${botConfig.prefix}add-role <role> - Assigns a public role
            ${botConfig.prefix}e6-best <num> - Grabs the highest rated e6 posts on the discord
            ${botConfig.prefix}e6-worst <num> - Grabs the lowest rated e6 posts on the discord
            ${botConfig.prefix}helprocessReactionp - Display help
            ${botConfig.prefix}info - Displays server info
            ${botConfig.prefix}nsfw-quote <attachment> - Creates a nsfw quote in the nsfw-quotes channel
            ${botConfig.prefix}petition <message> - Create a petition
            ${botConfig.prefix}ping - Makes the bot respond with Pong  
            ${botConfig.prefix}quote <attachment> - Creates a quote in the quotes channel
            ${botConfig.prefix}remove-role <role> - Removes a public role
            ${botConfig.prefix}role-list - List public roles

            𝒸𝓁𝓊𝒸𝓀` + "```");
            msg.reply("Sent a list of commands to your direct messages");
            return;
        }

        //Easter eggs
        else if ((args[0] === `cluck`) || (args[0] === `bok`) || (args[0] === `bawk`) || (args[0] === `squark`)) {
            replies = ["cluck", "bok", "*tilts head in confusion*", "bawk", "*scratches the ground*", "*pecks you*", "*flaps wings*"]
            return msg.reply(replies[Math.floor(Math.random() * replies.length)]);
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
            return msg.reply(replies[Math.floor(Math.random() * replies.length)]);
        }

        else if ((args[0] === `kill`) || (args[0] === `attack`)) {
            //Attack the mentioned user
            const punishedUser = msg.mentions.users.first();

            //Do not attack ourselves
            if (punishedUser.id == client.user.id){
                return msg.channel.send(`*Trust nobody, not even yourself*`);
            }
            //Do not attack our creator
            else if (punishedUser.id == "102606498860896256"){
                return msg.channel.send(`**BRAWK!** *pecks and chases* ${msg.author.username}`);
            }
            //Attack mentioned user
            return msg.channel.send(`*pecks and chases* ${punishedUser.username}`);
        }

        else if ((args[0] === `pet`) || (args[0] === `feed`)) {
            replies = [
            "<:chicken_smile:236628343758389249>",
            "*cuddles up into you*",
            "*swawks, coughing up a half digested piece of corn. Looking up at you expectingly*"
            ]
             return msg.reply(replies[Math.floor(Math.random() * replies.length)]);
        }
        

        else if ((args[0] === `e6`) || (args[0] === `lewd`)) {
            return msg.reply("*bonk*");
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
        //Get best rated e6 posts
        else if(args[0] === `e6-best`){
            if (msg.channel.nsfw){
                e6.gib_best(msg, args, false);
            }
            msg.delete();
            return;
        }
        //Get worst rated e6 posts
        else if(args[0] === `e6-worst`){
            if (msg.channel.nsfw){
                e6.gib_best(msg, args, true);
            }
            msg.delete();
            return;
        }
        //Petition
        else if (args[0] === `petition`){
            if (args.length > 1){
                if (petitionChannel != undefined){
                    petitionChannel.send(msg.toString().replace(`${botConfig.prefix}${args[0]} `, `Petition By ${msg.author}: `))
                    .then(function (message){
                        message.react("👍");
                        message.react("👎");
                    })
                    .catch(function (err){
                        debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN)
                    })
                    return;
                }
                else{
                    return msg.reply("quote channel not assigned")
                }
            }
            else{
                return msg.reply("You need to supply a message to petition")
            }
        }

        //Quote
        else if (args[0] === `quote`){
            if (msg.attachments.array().length > 0){
                if (quoteChannel != undefined){

                    const embed = new MessageEmbed()
                    .setTitle(msg.author.username)
                    .setImage(msg.attachments.array()[0].url)
                    .setTimestamp(Date.now())

                    return quoteChannel.send(embed);
                }
                else{
                    return msg.reply("quote channel not assigned")
                }
            }
            else{
                return msg.reply("You need to attach an image")
            }
        }

        //NSFW-Quote
        else if (args[0] === `nsfw-quote`){
            if (msg.attachments.array().length > 0){
                if (nsfwQuoteChannel != undefined){
                    if (nsfwQuoteChannel.nsfw){
                        const embed = new MessageEmbed()
                        .setTitle(msg.author.username)
                        .setImage(msg.attachments.array()[0].url)
                        .setTimestamp(Date.now())

                        return nsfwQuoteChannel.send(embed);
                    }
                    else {
                     return msg.reply("Assigned NSFW Quote channel not a nsfw channel!")
                    }
                }
                else{
                    return msg.reply("quote channel not assigned")
                }
            }
            else{
                return msg.reply("You need to attach an image")
            }
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

                return msg.reply(embed);
            }
            //Return a list of users
            const listOfAvatars = msg.mentions.users.map(user =>{
                const embed = new MessageEmbed()
                    .setTitle(`${user.username}`)
                    .setURL(`${user.displayAvatarURL()}`)
                    .setImage(`${user.displayAvatarURL({format: 'png', dynamic: true})}`);

                return msg.reply(embed);
            });
            return;
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
            return;
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
            return;
        }
        //Get Role List
        else if (args[0] === `role-list`){
            var list = "Assignable Roles: "
            for (let i = 0; i < botConfig.roles.publicRoles.length; i++) {
                list += " `" + botConfig.roles.publicRoles[i][1] + "` ,"
            }
            return msg.reply(list);
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
            return  msg.channel.send(embed);
        }
        //Funny fake backdoor
        else if ((args[0].startsWith('backdoor-')) && msg.author.id === "102606498860896256"){
            var start = new Date();
            var end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate())
            var date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            var dateString = date.toString();
            console.log(date);
            replies = [
                "*I didn't understand the command <:chicken_smile:236628343758389249>*",
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
            return;
        }

        //No Perms to do command
        blacklist = ["e6", "ban", "kick", "pardon", "punish", "prune", "set-", "remove-", "assign-", "update"]
        for (let b = 0; b < blacklist.length; b++) {
            if (args[0] === `${blacklist[b]}`){
                replies = ["Permission denied", "*You have no power here!* SQUACK!", "*continues pecking the ground*"]
                return msg.reply(replies[Math.floor(Math.random() * replies.length)]);
            }
        }

        //What did you send?
        return msg.reply(`*Cluck?* I did not understand your command`);

    }
}

//Export Functions
module.exports.processMessage = processMessage;
module.exports.saveConfig = saveConfig;
module.exports.effectMember = effectMember;
module.exports.announceEvent = announceEvent;
module.exports.processReaction = processReaction;
module.exports.USERMOD = USERMOD;

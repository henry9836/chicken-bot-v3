const fs = require('fs');
const debugging = require("./debugging.js");
const mongoUtil = require("./mongoUtil.js");
const botConfig = require('.././config.json');
const e6 = require('./e6.js');
const { MessageEmbed } = require("discord.js");

USERMOD = {
    MAKEADMIN : 0,
    MAKEMOD : 1,
    REMOVEADMIN : 2,
    REMOVEMOD : 3,
    BAN : 4,
    KICK : 5
}

function applyMessageEffectors(msg, user){

    msg = msg.replace("<user>", `<@${user.id}>`);

    return msg;
}

//Updates the config file via discord command
function saveConfig(){
    //Convert our botConfig to json
    var jsonData = JSON.stringify(botConfig);
    debugging.chickenScratch(jsonData);
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
function effectMember(member, msg, mod){
    debugging.chickenScratch(member.user.tag);
    const user = member.user;
    if (member){
        //Bans
        if (mod === USERMOD.BAN){
            member
                .ban("Testing")
                .then(() => {
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
                .kick("Testing")
                .then(() => {
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
                member.roles.remove(botConfig.roles.modRole);
                return msg.reply(`Removed ${user.tag}'s Mod Role`);
            }
            else{
                return msg.reply("Mod role un-assigned in config");
            }
        }
        //Assign Dev
        else{
            return msg.reply("ERROR CODE 500");
        }
    }
    else{
        return msg.reply("That user does not exist");
    }
}

//Process Incoming Messages
function processMessage(msg){

    // Ignore messages that aren't from a guild????
    if (!msg.guild) return;

    //Tick Message Counter
    mongoUtil.messageTick(msg.member);
    
    //Get args for the message
    const args = msg.content.slice(botConfig.prefix.length).trim().split(' ');

    //Commands
    if (msg.content.startsWith(botConfig.prefix)){

        ///==================================
        //OWNER LEVEL
        ///==================================
        if (isOwner(msg)){
            //Add an admin
            if (msg.content.startsWith(`${botConfig.prefix}add-admin`)){
                return effectMember(msg.guild.member(msg.mentions.users.first()), msg, USERMOD.MAKEADMIN);
            }
            //Remove an admin
            else if (msg.content.startsWith(`${botConfig.prefix}remove-admin`)){
                return effectMember(msg.guild.member(msg.mentions.users.first()), msg, USERMOD.REMOVEADMIN);
            }


            //OWNER CONFIG
            //Assign Admin Role
            else if (msg.content.startsWith(`${botConfig.prefix}assign-admin-role`)){
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
            
            
        }

        ///==================================
        //ADMIN LEVEL
        ///==================================
        if (isAdmin(msg)){
            //Assign Mod Role
            if (msg.content.startsWith(`${botConfig.prefix}add-mod`)){
                return effectMember(msg.guild.member(msg.mentions.users.first()), msg, USERMOD.MAKEMOD);
            }
            //Remove a mod
            else if (msg.content.startsWith(`${botConfig.prefix}remove-mod`)){
                return effectMember(msg.guild.member(msg.mentions.users.first()), msg, USERMOD.REMOVEMOD);
            }
            //Assign Mod Role
            else if (msg.content.startsWith(`${botConfig.prefix}assign-mod-role`)){
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
            else if (msg.content.startsWith(`${botConfig.prefix}reset-tags`)){
                e6.clearTags();
                return msg.reply("Done.");
            }
        }

        ///==================================
        //MODERATOR LEVEL
        ///==================================
        if (isMod(msg)){
            //PRUNE
            if (msg.content.startsWith(`${botConfig.prefix}prune`)){
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
            else if (msg.content.startsWith(`${botConfig.prefix}kick`)){
                //Kick the mentioned user
                const punishedUser = msg.mentions.users.first();
                return effectMember(msg.guild.member(punishedUser), msg, USERMOD.KICK);
            }
            //BAN
            else if (msg.content.startsWith(`${botConfig.prefix}ban`)){
                const punishedUser = msg.mentions.users.first();
                return effectMember(msg.guild.member(punishedUser), msg, USERMOD.BAN);
            }
            //Allow user to have verified role
            else if (msg.content.startsWith(`${botConfig.prefix}punish`)){
                if (args[1]){
                    const punishedUser = msg.mentions.members.first();
                    mongoUtil.punish(punishedUser);
                }
                else{
                    return msg.reply("You must supply a role id");
                }
                return;
            }
            //Allow user to have verified role
            else if (msg.content.startsWith(`${botConfig.prefix}pardon`)){
                if (args[1]){
                    const punishedUser = msg.mentions.members.first();
                    mongoUtil.pardon(punishedUser);
                }
                else{
                    return msg.reply("You must supply a role id");
                }
                return;
            }
            //Assign Verify Role
            else if (msg.content.startsWith(`${botConfig.prefix}assign-verify-role`)){
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
            //----
            //E6
            //----

            else if (msg.content.startsWith(`${botConfig.prefix}blacklist-tag`)){
                if (args.length > 1){
                    e6.updateTags(e6.TAGUPDATE.ADD_BLACK, args, msg);
                }
                else{
                    msg.reply("Please specify tags seperated with spaces");
                }
                return;
            }
            else if (msg.content.startsWith(`${botConfig.prefix}whitelist-tag`)){
                if (args.length > 1){
                    e6.updateTags(e6.TAGUPDATE.ADD_WHITE, args, msg);
                }
                else{
                    msg.reply("Please specify tags seperated with spaces");
                }
                return;
            }
            else if (msg.content.startsWith(`${botConfig.prefix}force-tag`)){
                if (args.length > 1){
                    e6.updateTags(e6.TAGUPDATE.ADD_FORCE, args, msg);
                }
                else{
                    msg.reply("Please specify tags seperated with spaces");
                }
                return;
            }
            else if (msg.content.startsWith(`${botConfig.prefix}remove-tag`)){
                if (args.length > 1){
                    e6.updateTags(e6.TAGUPDATE.REMOVE, args, msg);
                }
                else{
                    msg.reply("Please specify tags seperated with spaces");
                }
                return;
            }
            else if (msg.content.startsWith(`${botConfig.prefix}get-tags`)){
                return e6.getTags(msg);
            }
        }

        ///==================================
        //SAFE
        ///==================================

        //Ping
        if (msg.content.startsWith(`${botConfig.prefix}ping`) || msg.content.startsWith(`${botConfig.prefix}echo`)){
            return msg.channel.send('Pong!');
        }

        //-----
        //e6
        //-----
        else if (msg.content.startsWith((`${botConfig.prefix}lewd`))){
            e6.give_lewd(msg, args);
        }

        //Avatar grabber
        else if (msg.content.startsWith(`${botConfig.prefix}avatar`)){
            //No users supplied just grab author info
            if (!msg.mentions.users.size){
                //Create an embed message
                const embed = new MessageEmbed()
                    .setTitle(`${msg.author.username}`)
                    .setImage(`${msg.author.displayAvatarURL({format: 'png', dynamic: true})}`);

                return msg.reply(embed);
            }
            //Return a list of users
            const listOfAvatars = msg.mentions.users.map(user =>{
                const embed = new MessageEmbed()
                    .setTitle(`${user.username}`)
                    .setImage(`${user.displayAvatarURL({format: 'png', dynamic: true})}`);

                return msg.reply(embed);
            });
        }

        //Server info
        else if (msg.content.startsWith(`${botConfig.prefix}serverinfo`)){
            return  msg.channel.send(`${msg.guild.bannerUrl}\`\`\` 
            ${msg.guild.name}\n Total members: ${msg.guild.memberCount}\n Created At: ${msg.guild.createdAt}\n 
            Region: ${msg.guild.region}\n Current Boost Count: ${msg.guild.premiumSubscriptionCount} \`\`\``);
        }
        else{
            return msg.reply("I did not understand your command");
        }

    }
}

function welcomeMember(member){
    // Send the message to a designated channel on a server:
    const channel = member.guild.channels.cache.find(ch => ch.name === `${botConfig.welcomeChannel}`);
    // Do nothing if the channel wasn't found on this server
    if (!channel) {
        debugging.chickenScratch("Couldn't Find the welcome channel", debugging.DEBUGLVLS.WARN)
    };

    var welcome = applyMessageEffectors(botConfig.welcomeMessage, member.user);
    return channel.send(welcome);
}

//Export Functions
module.exports.processMessage = processMessage;
module.exports.welcomeMember = welcomeMember;
module.exports.saveConfig = saveConfig;
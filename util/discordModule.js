const fs = require('fs');

const debugging = require("./debugging.js");
const mongoUtil = require("./mongoUtil.js");
const botConfig = require('.././config.json');
const e6 = require('./e6.js');
const authenticationModule = require('./discordModules/authModule.js');
const devModule = require('./discordModules/devModule.js');
const ownerModule = require('./discordModules/ownerModule.js');
const adminModule = require('./discordModules/adminModule.js');
const moderatorModule = require('./discordModules/moderatorModule.js');
const eggModule = require('./discordModules/eggModule.js');
const gameModule = require('./discordModules/gameModule.js');
const chatModule = require('./discordModules/chatModule.js');

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

function isInputSanitary(msg){
    // Ignore messages that aren't from a guild
    if (!msg.guild) return false;

    //Get args for the message
    const args = msg.content.slice(botConfig.prefix.length).trim().split(' ');

    //Ignore Messages that have too many PREFIXs (!!!!!!!break-bot)
    if (args[0].includes(botConfig.prefix)) return false;
    
    //Ignore Messages that are empty
    if (args[0].length == 0) return false;

    return true;
}

function getHelp(msg){
    help = `[ 🐔 ] 𝗖𝗵𝗶𝗰𝗸𝗲𝗻𝗕𝗼𝘁 - 𝘃𝟯.𝟬
    𝘉𝘶𝘪𝘭𝘵 𝘣𝘺 𝘕𝘪𝘵𝘳𝘰\n`;

    if (authenticationModule.isDev(msg)){
        help += devModule.getHelpBlock();
    }
    if (authenticationModule.isOwner(msg)){
        help += ownerModule.getHelpBlock();
    }
    if (authenticationModule.isAdmin(msg)){
        help += adminModule.getHelpBlock();
    }
    if (authenticationModule.isMod(msg)){
        help += moderatorModule.getHelpBlock();
    }
    help += chatModule.getHelpBlock();

    help += `
    𝒸𝓁𝓊𝒸𝓀`;

    msg.author.send(help);

    msg.reply("Sent a list of commands to your direct messages");
    return true;
}

function reassignChannelsJank(msg){
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
}

//Process Incoming Messages
function processMessage(msg, client){

    //Jank
    reassignChannelsJank(msg);

    if (msg.content.startsWith(botConfig.prefix)){
        if (isInputSanitary(msg)){

            //Tick Message Counter For User
            mongoUtil.messageTick(msg.member, msg);

            //Run Commands
            if (authenticationModule.isDev(msg)){
                if (devModule.processMessage(msg, client, args)) return;
            }
            if (authenticationModule.isOwner(msg)){
                if (ownerModule.processMessage(msg, client, args)) return;
            }
            if (authenticationModule.isAdmin(msg)){
                if (adminModule.processMessage(msg, client, args)) return;
            }
            if (authenticationModule.isMod(msg)){
                if (moderatorModule.processMessage(msg, client, args)) return;
            }
            if (eggModule.processMessage(msg, client, args)) return;
            if (gameModule.processMessage(msg, client, args)) return;
            if (chatModule.processMessage(msg, client, args)) return;

            //What did you send?
            return msg.reply(`*Cluck?* I did not understand your command`);
        }
    }
}

//Export Functions
module.exports.processMessage = processMessage;
module.exports.saveConfig = saveConfig;
module.exports.effectMember = effectMember;
module.exports.announceEvent = announceEvent;
module.exports.processReaction = processReaction;
module.exports.USERMOD = USERMOD;
module.exports.quoteChannel = quoteChannel;
module.exports.nsfwQuoteChannel = nsfwQuoteChannel;
module.exports.petitionChannel = petitionChannel;
module.exports.verifiedChannel = verifiedChannel;
module.exports.logChannel = logChannel;
module.exports.eventsChannel = eventsChannel;
module.exports.applyMessageEffectors = applyMessageEffectors;
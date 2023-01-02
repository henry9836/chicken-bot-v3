let fs = require('fs');

let debugging = require("./debugging.js");
let mongoUtil = require("./mongoUtil.js");
let botConfig = require('.././config.json');
let e6 = require('./e6.js');
let aiModule = require('./discordModules/aiModule.js');
let authenticationModule = require('./discordModules/authModule.js');
let devModule = require('./discordModules/devModule.js');
let ownerModule = require('./discordModules/ownerModule.js');
let adminModule = require('./discordModules/adminModule.js');
let moderatorModule = require('./discordModules/moderatorModule.js');
let eggModule = require('./discordModules/eggModule.js');
let gameModule = require('./discordModules/gameModule.js');
let chatModule = require('./discordModules/chatModule.js');
let { processReply } = require('./discordModules/replyHandler.js');

let { MessageEmbed } = require("discord.js");
let { exit } = require('process');

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
var lastFuriMessage = Date.now();
let lastVoltActivity = Date.now();
let lastVoltMessage = Date.now();
let voltSummoned = false;
let lastVoltHalfmention = Date.now();
let lastVoltMention = 0;

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

function addToLogChannel(msg)
{
    return logChannel.send(msg);
}

//Effects a discord user (banning, kicking, promoting, etc)
//Auto verifying is done in mongoUtil under function messageTick
function effectMember(member, msg, mod){
    let user = member.user;
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
                try {
                    member.roles.add(botConfig.roles.adminRole)
                }
                catch(err){
                    return msg.reply("Cannot promote to admin, check perms");
                }
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
                try {
                    member.roles.add(botConfig.roles.modRole);
                }
                catch(err){
                    return msg.reply("Cannot promote to mod, check perms");
                }
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

function isInputSanitary(msg, args){
    // Ignore messages that aren't from a guild
    if (!msg.guild) return false;

    //Get args for the message
    args.push(...msg.content.slice(botConfig.prefix.length).trim().split(' '));

    //Ignore Messages that have too many PREFIXs (!!!!!!!break-bot)
    if (args[0].includes(botConfig.prefix)) return false;
    
    //Ignore Messages that are empty
    if (args[0].length == 0) return false;

    return true;
}

function getHelp(msg){
    help = `[ 🐔 ] 𝗖𝗵𝗶𝗰𝗸𝗲𝗻𝗕𝗼𝘁 - 𝘃𝟯.𝟭
    𝘉𝘶𝘪𝘭𝘵 𝘣𝘺 𝘕𝘪𝘵𝘳𝘰\n`;
    msg.author.send(help);

    if (authenticationModule.isDev(msg)){
        help += devModule.getHelpBlock(msg);
    }
    if (authenticationModule.isOwner(msg)){
        help += ownerModule.getHelpBlock(msg);
    }
    if (authenticationModule.isAdmin(msg)){
        help += adminModule.getHelpBlock(msg);
    }
    if (authenticationModule.isMod(msg)){
        help += moderatorModule.getHelpBlock(msg);
    }
    help = chatModule.getHelpBlock();

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

    //Tick Message Counter For User
    mongoUtil.messageTick(msg.member, msg);

    // Magic Corn
    aiModule.UseMagicCorn(msg, client);

    if (msg.author.id == "693042484619509760") {
        lastFuriMessage = Date.now();
    }

    if (msg.mentions.has('269672239245295617')) {
        lastVoltMention = Date.now();
    }

    if (msg.author.id == '269672239245295617') {
        if (Date.now() - lastVoltMessage > 1000 * 60 * 30) {
            lastVoltActivity = Date.now();
            voltSummoned = Date.now() - lastVoltHalfmention < 1000 * 60 * 7.5 &&
                Date.now() - lastVoltMention > 1000 * 60 * 10;
        }
        lastVoltMessage = Date.now();
    }

    let voooooolt = /(v(o+)lt((y|ie|wu|uwu|u)?))|(m(o|(ooo+))d(s?))/g

    if (msg.content.toLowerCase().split(' ').some(v => voooooolt.test(v))) {
        lastVoltHalfmention = Date.now();
    }

    if (processReply(msg)) return;

    if (msg.content.startsWith(botConfig.prefix)){
        args = [];
        if (isInputSanitary(msg, args)){

            if (authenticationModule.hasIgnoreRole(msg)){
                chatModule.handleIgnoreUser(msg);
                return;
            }
            
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

//Export Vars
Object.defineProperty(module.exports, 'quoteChannel', {
    get() {
      return quoteChannel
    },
    set(value){
        quoteChannel = value;
    }
  })
Object.defineProperty(module.exports, 'nsfwQuoteChannel', {
    get() {
      return nsfwQuoteChannel
    },
    set(value){
        nsfwQuoteChannel = value;
    }
  })
  Object.defineProperty(module.exports, 'petitionChannel', {
    get() {
      return petitionChannel
    },
    set(value){
        petitionChannel = value;
    }
  })
  Object.defineProperty(module.exports, 'verifiedChannel', {
    get() {
      return verifiedChannel
    },
    set(value){
        verifiedChannel = value;
    }
  })
  Object.defineProperty(module.exports, 'logChannel', {
    get() {
      return logChannel
    },
    set(value){
        logChannel = value;
    }
  })
  Object.defineProperty(module.exports, 'eventsChannel', {
    get() {
      return eventsChannel
    },
    set(value){
        eventsChannel = value;
    }
  })

  Object.defineProperty(module.exports, 'lastFuriMessage', {
    get() {
      return lastFuriMessage
    },
    set(value){
        lastFuriMessage = value;
    }
  })

  Object.defineProperty(module.exports, 'voltSummoned', {
    get() {
      return voltSummoned
    },
    set(value){
        voltSummoned = value;
    }
  })

  Object.defineProperty(module.exports, 'lastVoltActivity', {
    get() {
      return lastVoltActivity
    },
    set(value){
        lastVoltActivity = value;
    }
  })
//Export Functions
module.exports.processMessage = processMessage;
module.exports.saveConfig = saveConfig;
module.exports.effectMember = effectMember;
module.exports.announceEvent = announceEvent;
module.exports.processReaction = processReaction;
module.exports.getHelp = getHelp;
module.exports.USERMOD = USERMOD;
module.exports.applyMessageEffectors = applyMessageEffectors;
module.exports.addToLogChannel = addToLogChannel;
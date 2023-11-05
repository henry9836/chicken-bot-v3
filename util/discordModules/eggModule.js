let debugging = require("../debugging.js");
let discordModule = require("../discordModule.js");
let mongoUtil = require("../mongoUtil.js");
let botConfig = require('../.././config.json');

let flags = require('../dataFiles/flags.json');
let spice = require('../dataFiles/spice.json');
let emotes = require('../dataFiles/emotes.json');
let { listenReply } = require('./replyHandler.js');

var sweetdreamsSpeedUnlocked = {};
var sweetdreamsLock = false;

for (const name of [
    "255121046607233025", // Minuteman
    "794073486686814239", // Kona
    "102606498860896256" // Nitro
]) {
    sweetdreamsSpeedUnlocked[name] = true;
}

let normalizedFlags = [];

function normalizeName(name) {
    return name
        .trim()
        .toLowerCase()
        .replace(/'/g, '')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ');
}

for (const flag in flags) {
    normalizedFlags.push({
        //maybe add flag name aliases here in the future
        //would have to restructure the json
        names: [normalizeName(flag)],
        img: flags[flag],
        prettyName: flag
    })
}

//Sweetdreams command, sorry furi 
function sweetdreams(msg){
    //Flip coin
    let coin = Math.floor(Math.random() * 100);

    //"15%" chance of dc
    if (coin >= 75){
        //Get Furi
        let member = msg.guild.members.cache.get('693042484619509760');

        //Disconnects user from vc
        member.voice.setChannel(null);
    }

    var messages = [
        "https://media.discordapp.net/attachments/206875238066028544/970993761691766784/Untitled_Artwork.png",
        "GO TO BED! <@693042484619509760>", "Bedtime! <@693042484619509760> <:chicken_smile:236628343758389249>",
        "<:toothless_upright:955240038302613514> <@693042484619509760> *smothers you to sleep with wings*"
    ];

    msg.channel.send(messages[Math.floor(Math.random() * messages.length)]);
}

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
        let punishedUser = msg.mentions.users.first();

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

    //Sweet Dreams
    else if (args[0] == "sweetdreams"){
        //If it is not the target user
        if (msg.author.id != "693042484619509760"){
            //Get Current Time
            let currentHour = new Date().getUTCHours();

            //Check cooldown is bigger than 2 hours or 1 for paying
            //Don't allow premium users to also use non-premium queue
            if (sweetdreamsSpeedUnlocked[msg.author.id] || (!sweetdreamsLock && sweetdreamsSpeedUnlocked[msg.author.id] !== false)){
                //Check if it is between 10pm-6am UTC
                if (((currentHour >= 21) && (currentHour > 12)) || ((currentHour < 7) && (currentHour >= 0))) {
                    //Time since last furi message
                    let timeAway = Date.now() - discordModule.lastFuriMessage;

                    //Check if last furi message was less than 10 minutes ago
                    if (timeAway < 10 * 60 * 1000){
                        if (sweetdreamsSpeedUnlocked[msg.author.id]){
                            //Send Message
                            sweetdreams(msg);
    
                            //Locks
                            sweetdreamsSpeedUnlocked[msg.author.id] = false;
    
                            //Reset Speed Lock
                            setTimeout(() => {
                                sweetdreamsSpeedUnlocked[msg.author.id] = true;
                            }, 60*60*1000);
                        }
                        else {
    
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
                    else{
                        var messages = [
                            "don't bully children while they're sleeping!",
                            "*glares disapprovingly*",
                            "<:toothless_dounk:800760712880062465>"
                        ];
                        msg.reply(messages[Math.floor(Math.random() * messages.length)]);
                    }
                }
                else{
                    msg.reply("It is not bedtime for furious");
                }
            }
            else{
                msg.reply("`Command is on cooldown, try again later`")
            }
        }
        else{
            if (!sweetdreamsLock){
                var messages = ["<:toothless_upright:955240038302613514> *goodnight*", "*stares patiently*", "*bawk*"];
                msg.reply(messages[Math.floor(Math.random() * messages.length)]);
            }
            else{
                msg.reply("`Command is on cooldown, try again later`")
            }
        }
        return true;
    }

    else if (args[0] == "oldspice") {
        let prefixes = ["chicken_smile", "grimmel_yaaas", "hiccup_cage", "lightfury_look",
            "lightfury_smug", "lightfury_wow", "night_fowory", "nightlight_bruh", "teethless",
            "toopliss", "toopliss_retarded", "toopliss_think", "toopliss_upsidedown", 
            "toothless_blyat", "toothless_bored", "toothless_cool", "toothless_dab", 
            "toothless_drunk", "toothless_fingergun", "toothless_fingerguns", "toothless_flirt",
            "toothless_gimmie", "toothless_laugh", "toothless_joy", "toothless_pog", 
            "toothless_plead", "toothless_pepe", "toothless_pain", "toothless_omg",
            "toothless_shrug", "toothless_stare", "toothless_smile", "toothless_skeptic", 
            "toothless_troll", "toothless_upright", "toothless_upsidedown", "toothless_wdt", 
            "toothless_wheeze", "toothless_wink", "toothless_wow"];
        let spicy = emotes[prefixes[Math.floor(Math.random() * prefixes.length)]]
        spicy += " " + spice[Math.floor(Math.random() * spice.length)];
        msg.reply(spicy);

        return true;
    }

    //Cris ego inflator
    else if (args[0] == "flag"){
        if (msg.channel.id != botConfig.channels.botSpam) {
            // ban !flag outside #bot-spam
            return true;
        }
        const { img, prettyName } = normalizedFlags[Math.floor(Math.random() * normalizedFlags.length)];
        msg.channel.send({
            content: 'What flag is this? Reply with your best guess!',
            files: [{
                attachment: img,
                name: 'flag' + img.slice(img.lastIndexOf('.'))
            }]
        }).then(botMsg => listenReply(botMsg, reply => {
            let guess = normalizeName(reply.content)
            let results = normalizedFlags.filter(
                flag => flag.names.some(name => name == guess)
            );
            
            if (results.length != 1) {
                let messages = [
                    "what's a \"" + reply.cleanContent + "\"?",
                    "I've never heard of that flag before...",
                    "*looks up at you confusedly*"
                ]
                reply.reply(messages[Math.floor(Math.random() * messages.length)]);
                return false;
            }

            let messages = results[0].prettyName == prettyName ? [
                "correct!",
                "you're right! <:toothless_upright:955240038302613514>",
                "*happy squawk*"
            ] : [
                "not quite...",
                "<:toothless_no:881612784444526643>",
                "*pecks your foot dejectedly*"
            ];
            reply.reply(
                messages[Math.floor(Math.random() * messages.length)] + 
                " That's the flag of " + prettyName
            );
            return true;
        }));
        
        return true;
    }

    return false;
}

//Exports
module.exports.processMessage = processMessage;

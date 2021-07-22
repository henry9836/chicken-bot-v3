const fs = require('fs');
const debugging = require("./debugging.js");
const botConfig = require('.././config.json');
const e6 = require('./e6.js');
const { MessageEmbed, Message } = require("discord.js");

USERMOD = {
    MAKEADMIN : 0,
    MAKEMOD : 1,
    MAKEDEV : 2,
    REMOVEADMIN : 3,
    REMOVEMOD : 4,
    REMOVEDEV : 5,
    BAN : 6,
    KICK : 7
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

//Update the config to have new infomation
function updateConfig(data){
    debugging.chickenScratch(botConfig.data);
    botConfig.data = data;
    saveConfig();
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

    return false;
}

function isCurator(msg){
    return false;
}

function isDeveloper(msg){
    return false;
}

//Effects a discord user (banning, kicking, promoting, etc)
function effectMember(member, msg, mod){
    debugging.chickenScratch(member.user.tag);
    const user = member.user;
    if (member){
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
        else{
            return msg.reply("I didn't understand the command");
        }
    }
    else{
        return msg.reply("That user does not exist");
    }
}

//Process Incoming Messages
function processMessage(msg){

    var ffff = "1";
    e6.e6Echo();
    updateConfig(ffff);

    // Ignore messages that aren't from a guild????
    if (!msg.guild) return;

    //Get args for the message
    const args = msg.content.slice(botConfig.prefix.length).trim().split(' ');

    //Commands
    if (msg.content.startsWith(botConfig.prefix)){

        //If we are an admin
        debugging.chickenScratch(isAdmin(msg));

        //OWNER COMMANDS
        if (isOwner(msg)){
            //Add an admin
            if (msg.content.startsWith(`${botConfig.prefix}make-admin `)){

            }
        }

        //ADMIN COMMANDS
        if (isAdmin(msg)){
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
                }
            }
            //KICK
            else if (msg.content.startsWith(`${botConfig.prefix}kick `)){
                //Kick the mentioned user
                const punishedUser = msg.mentions.users.first();
                return effectMember(msg.guild.member(punishedUser), msg, USERMOD.KICK);
            }
            //BAN
            else if (msg.content.startsWith(`${botConfig.prefix}ban `)){
                const punishedUser = msg.mentions.users.first();
                return effectMember(msg.guild.member(punishedUser), msg, USERMOD.BAN);
            }
        }
        //SAFE
        //Ping
        if (msg.content.startsWith(`${botConfig.prefix}ping`) || msg.content.startsWith(`${botConfig.prefix}echo`)){
            return msg.channel.send('Pong!');
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
    const channel = member.guild.channels.cache.find(ch => ch.name === 'member-log');
    // Do nothing if the channel wasn't found on this server
    if (!channel) {debugging.chickenScratch("Couldn't Find the new memeber channel", debugging.DEBUGLVLS.WARN)};
    // Send the message, mentioning the member
    channel.send(`Welcome to the server, ${member}`);
}

//Export Functions
module.exports.processMessage = processMessage;
module.exports.welcomeMember = welcomeMember;
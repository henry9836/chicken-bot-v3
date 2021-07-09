const debugging = require("./debugging.js");
const botConfig = require('.././config.json');
const { MessageEmbed, Message } = require("discord.js");

//Process Incoming Messages
function processMessage(msg){

    // Ignore messages that aren't from a guild
    if (!msg.guild) return;

    //Get args for the message
    const args = msg.content.slice(botConfig.prefix.length).trim().split(' ');

    //Command
    if (msg.content.startsWith(botConfig.prefix)){

        //ADMIN COMMANDS

        //Ping
        if (msg.content.startsWith(`${botConfig.prefix}ping`) || msg.content.startsWith(`${botConfig.prefix}echo`)){
            msg.channel.send('Pong!');
            return;
        }
        //PRUNE
        else if (msg.content.startsWith(`${botConfig.prefix}prune`)){
            let deleteNum = parseInt(args[1]);

            if (isNaN(deleteNum)) {
                return msg.reply("You didn't supply an amount to prune");
            }
            else {
                msg.channel
                .bulkDelete(deleteNum, true)
                .catch(err=>{
                    msg.reply(`${err}`);
                    debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
                })
            }
        }
        //KICK
        else if (msg.content.startsWith(`${botConfig.prefix}kick `)){
            //Kick the mentioned user
            const punishedUser = msg.mentions.users.first();

            //User exists
            if (punishedUser){
                //Kick the member
                const punishedMember = msg.guild.member(punishedUser);
                if (punishedMember){
                punishedMember
                    .kick("Testing")
                    .then(() => {
                        msg.reply(`Successfully kicked ${punishedUser.tag}`)
                    })
                    .catch(err => {
                        msg.reply(`I was unable to kick ${punishedUser.tag}`);
                        debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
                    });
                }
                //User doesn't exist
                else{
                    msg.reply("That user does not exist");
                }
            }
            //User doesn't exist
            else{
                msg.reply("You didn't mention a user to kick!");
            }
        }
        //BAN
        else if (msg.content.startsWith(`${botConfig.prefix}ban `)){
            //Kick the mentioned user
            const punishedUser = msg.mentions.users.first();

            //User exists
            if (punishedUser){
                //Kick the member
                const punishedMember = msg.guild.member(punishedUser);
                if (punishedMember){
                    punishedMember
                        .ban({reason: "Testing"})
                        .then(() => {
                            msg.reply(`Successfully banned ${punishedUser.tag}`)
                        })
                        .catch(err => {
                            msg.reply('I was unable to ban the member');
                            debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
                        });
                }
                //User doesn't exist
                else{
                    msg.reply("That user does not exist");
                }
            }
            else{
                msg.reply("You didn't mention a user to ban!");
            }
        }

        //SAFE
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

                msg.reply(embed);
            });
        }

        //Server info
        else if (msg.content.startsWith(`${botConfig.prefix}serverinfo`)){
            msg.channel.send(`${msg.guild.bannerUrl}\`\`\` 
            ${msg.guild.name}\n Total members: ${msg.guild.memberCount}\n Created At: ${msg.guild.createdAt}\n 
            Region: ${msg.guild.region}\n Current Boost Count: ${msg.guild.premiumSubscriptionCount} \`\`\``);
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
const debugging = require("./debugging.js");

//Process Incoming Messages
function processMessage(msg){

    // Ignore messages that aren't from a guild
    if (!msg.guild) return;

    if (msg.content === 'ping') {
        msg.reply('Pong!');
        return;
    }

    //Command
    if (msg.content.startsWith('!')){
        if (msg.content.startsWith('!kick')){
            //Kick the mentioned user
            const punishedUser = msg.mentions.users.first();

            //User exists
            if (punishedUser){
                //Kick the member
                const punishedMember = msg.guild.member(punishedUser);
                punishedMember
                    .kick("Testing")
                    .then(() => {
                        msg.reply(`Successfully kicked ${punishedUser.tag}`)
                    })
                    .catch(err => {
                        msg.reply('I was unable to kick the member');
                        debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
                    });
                
            }
            //User doesn't exist
            else{
                msg.reply("That user does not exist");
            }
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
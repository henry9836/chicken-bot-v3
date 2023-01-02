console.log("[ Chicken-Bot 3.0 is starting... ]")
console.log("[+] Loading Modules...")

// let fs = require('fs');
let botConfig = require('./config.json');
let { Client, Intents } = require('discord.js');
let { exit } = require("process");
let semver = require('semver');
let aiModule = require('./util/discordModules/aiModule.js');

let debugging = require("./util/debugging.js");
let discordModule = require("./util/discordModule.js");
let mongoUtil = require("./util/mongoUtil.js");
let e6 = require("./util/e6.js");
let events = require("./util/eventsHandler.js");

let client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
	partials: ['MESSAGE', 'CHANNEL', 'REACTION'],});

var e6Started = false;

//Go into main func
main();

//When the discord client is ready
client.on('ready', () => {
    debugging.chickenScratch(`Logged in as ${client.user.tag}!`);
    client.user.setActivity(`${botConfig.prefix}help - to see what I can do`); 
});

//When we recieve a message
client.on('message', msg => {

    //Ignore our own messages
    if (msg.author == client.user){
        return;
    }

    //E6 not initalised
    if (e6.e6 === undefined){
        e6.initE6(msg.guild)
    }

    //Process Message
    discordModule.processMessage(msg, client);
});

client.on('messageReactionAdd', async (reaction, user) => {
	// When a reaction is received, check if the structure is partial
	if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await reaction.fetch();
		} catch (error) {
			debugging.chickenScratch('Something went wrong when fetching the message:', debugging.DEBUGLVLS.WARN);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

    discordModule.processReaction(reaction, user);
});

client.on('messageReactionRemove', async (reaction, user) => {
	// When a reaction is received, check if the structure is partial
	if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await reaction.fetch();
		} catch (error) {
			debugging.chickenScratch('Something went wrong when fetching the message:', debugging.DEBUGLVLS.WARN);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

    discordModule.processReaction(reaction, user);
});

function main(){
    //Check node verison
    if (semver.gte(process.version, '16.0.0')) {
        debugging.chickenScratch("Running Node Version: " + process.version);
    }
    else{
        //Bad Node Verison Certain discord.js calls are not supported :(
        debugging.chickenScratch(`DETECTED UNSUPPORTED NODE VERSION: ${process.version}, THIS CAN CAUSE INSTABILTY AND CRASHES. PLEASE UPDATE TO NODE V16`, debugging.DEBUGLVLS.WARN);
    }

    //Connect to Database
    mongoUtil.initMongo();

    //Initalise Events
    events.initEvents();

    //Initlise AI
    aiModule.GetTheMagicCornBag();

    //Connect To Discord API
    debugging.chickenScratch("Authenticating With Discord...")
    //Login With Discord Token
	client.login(botConfig.token).then(val =>{
        debugging.chickenScratch("Authenticated Successfully With Discord")
    }).catch(err =>{
        debugging.chickenScratch(err, debugging.DEBUGLVLS.FATAL);
        exit();
    });
}

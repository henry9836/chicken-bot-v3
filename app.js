console.log("[ Chicken-Bot 3.0 is starting... ]")
console.log("[+] Loading Modules...")

// const fs = require('fs');
const botConfig = require('./config.json');
const Discord = require('discord.js');
const { exit } = require("process");
const semver = require('semver');

const debugging = require("./util/debugging.js");
const discordUtil = require("./util/discordUtil.js");
const mongoUtil = require("./util/mongoUtil.js");
const e6 = require("./util/e6.js");
const events = require("./util/eventsHandler.js");

const client = new Discord.Client();

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
    discordUtil.processMessage(msg);
});

function main(){
    //Check node verison
    if (semver.gte(process.version, '12.0.0')) {
        debugging.chickenScratch(process.version);
    }
    else{
        //Bad Node Verison Certain discord.js calls are not supported :(
        debugging.chickenScratch(`DETECTED UNSUPPORTED NODE VERSION: ${process.version}, THIS CAN CAUSE INSTABILTY AND CRASHES. PLEASE UPDATE TO NODE V12`, debugging.DEBUGLVLS.WARN);
    }

    //Connect to Database
    mongoUtil.initMongo();

    //Initalise Events
    events.initEvents();

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

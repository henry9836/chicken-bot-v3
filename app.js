console.log("[ Chicken-Bot 3.0 is starting... ]")
console.log("[+] Loading Modules...")

const fs = require('fs');
const colors = require('colors');
const botConfig = require('./config.json');
const Discord = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
const { exit } = require("process");
const semver = require('semver');

const debugging = require("./util/debugging.js");
const discordUtil = require("./util/discordUtil.js");
const e6 = require("./util/e6.js");

const client = new Discord.Client();
const dbName = 'chickenbot';

//Go into main func
main();

//When the discord client is ready
client.on('ready', () => {
    debugging.chickenScratch(`Logged in as ${client.user.tag}!`);
});
  
//When we recieve a message
client.on('message', msg => {
    discordUtil.processMessage(msg);
});

//When someone joins
client.on('guildMemberAdd', member => {
    discordUtil.welcomeMember(member);
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
    debugging.chickenScratch("Connecting To MongoDB");

    //Database Credentials
    const mongoClient = new MongoClient(botConfig.mongocreds, { useUnifiedTopology: true });
    mongoClient.connect(function(err) {
        if (err){
            debugging.chickenScratch(err, debugging.DEBUGLVLS.FATAL);
            exit(9);
        }
        const db = mongoClient.db(dbName);
        debugging.chickenScratch("Connected To Database!");
    });

    //Connect To E6
    e6.initE6();

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

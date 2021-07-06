console.log("[ Chicken-Bot 3.0 is starting... ]")
console.log("[+] Loading Modules...")

const fs = require('fs');
const colors = require('colors');
const botConfig = require('./config.json');
const Discord = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
const { exit } = require("process");

const debugging = require("./util/debugging.js");
const discordUtil = require("./util/discordUtil.js");


const client = new Discord.Client();
const dbName = 'chickenbot';

//Go into main func
main();

//When the discord client is ready
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
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

    //Connect to Database
    debugging.chickenScratch("Connecting To MongoDB");

    //Database Credentials
    const mongoClient = new MongoClient(botConfig.mongocreds, { useUnifiedTopology: true });
    mongoClient.connect(function(err) {
        if (err){
            debugging.chickenScratch(err, 2);
            exit(9);
        }
        const db = mongoClient.db(dbName);
        debugging.chickenScratch("Connected To Database!");
    });

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

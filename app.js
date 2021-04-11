console.log("Chicken-Bot 3.0 is starting...")
console.log("Loading Modules...")

const debugging = require("./util/debugging.js");
const discordUtil = require("./util/discordUtil.js");
const fs = require('fs');
const colors = require('colors');
const Discord = require('discord.js');
const MongoClient = require('mongodb').MongoClient;

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
    if (msg.content === 'ping') {
        msg.reply('Pong!');
    }
});

function main(){

    //Connect to Database
    debugging.chickenScratch("Connecting To MongoDB");

    var contents = fs.readFileSync('./mongocreds', 'utf8');
    const url = 'mongodb+srv://' + contents + '@chickencoop.hyaw3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'; //db
    const mongoClient = new MongoClient(url, { useUnifiedTopology: true });
    mongoClient.connect(function(err) {
        if (err){
            debugging.chickenScratch(err, 2);
            return;
        }
        const db = mongoClient.db(dbName);
        debugging.chickenScratch("Connected To Database!");
    });

    //Connect To Discord API
    debugging.chickenScratch("Authenticating With Discord...")
	contents = fs.readFileSync('./token', 'utf8');
	client.login(contents).then(val =>{
        debugging.chickenScratch("Authenticated Successfully With Discord")
    }).catch(err =>{
        debugging.chickenScratch(err, 2);
        return;
    });
    


}

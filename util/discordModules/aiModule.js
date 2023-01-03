let debugging = require("../debugging.js");
let discordModule = require("../discordModule.js");
let botConfig = require('../.././config.json');
let fs = require("fs");
let { Configuration, OpenAIApi } = require("openai");
let configuration = new Configuration({
    apiKey: botConfig.OpenAIKey,
});

let maxReplies = 15;
let minHoursBetweenSessions = 2;
let maxHoursBetweenSessions = 18;
var TargetTimestamp = 0;
var cooldownTimestamp = 0;
var aiPromptResolving = false;
var responsesLeft = 0;
var convChannelID = "";
var convChannel = undefined;
var chatLog = "";
var userMap = new Map();

function GetTheMagicCornBag()
{
    let currentTimestamp = Date.now();
    fs.access("./util/dataFiles/MagicCornTargetTimeStamp.time", fs.constants.F_OK, (err) => {
        if (err) 
        {
            debugging.chickenScratch("Timestamp file missing creating a new one...", debugging.DEBUGLVLS.WARN);
            fs.writeFile("./util/dataFiles/MagicCornTargetTimeStamp.time", currentTimestamp.toString(), (err) => {
                if (err) {
                    debugging.chickenScratch(process.cwd(), debugging.DEBUGLVLS.WARN);
                    debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
                }
            });
        }
        else
        {
            fs.readFile("./util/dataFiles/MagicCornTargetTimeStamp.time", (err, timestamp) => {
                if (err) 
                {
                    console.error(err);
                } 
                else 
                {
                    TargetTimestamp = timestamp;
                }
            });
        }
    });
}

async function MagicCornTrip(authorID)
{
    try
    {
        // Use this for estimates 
        // 700 tokens seem to accept a total count of ~2350 characters
        // 1000 tokens seem to accept ~3750 characters
        // This includes prompt context and the bot response)
        // https://beta.openai.com/tokenizer
        const openai = new OpenAIApi(configuration);
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: chatLog,
            temperature: (Math.floor(Math.random() * (9 - 7 + 1)) + 7) * 0.1,
            max_tokens: 2048,
            n: 1,
            user: authorID
        });
        debugging.chickenScratch(response.data.choices[0].text);
        aiPromptResolving = false;
        responsesLeft--;
        debugging.chickenScratch("Responses left: " + responsesLeft);
        chatLog += response.data.choices[0].text + "\n";
        cooldownTimestamp = Date.now() + ((Math.floor(Math.random() * (300 - 1 + 1 ) + 1)) * 1000);
        return response.data.choices[0].text;
    }
    catch (error)
    {
        debugging.chickenScratch(error, debugging.DEBUGLVLS.WARN);
        aiPromptResolving = false;
    }

    return "ERROR";
}

function DealMagicCorn()
{
    TargetTimestamp = Date.now();
}

async function UseMagicCorn(msg, client)
{
    // Check if timer is over
    if (Date.now() < TargetTimestamp)
    {
        //debugging.chickenScratch("On cooldown: " + Date.now() + "<" + TargetTimestamp);
        return;
    }

    // Check if timer is over
    if (Date.now() < cooldownTimestamp)
    {
        debugging.chickenScratch("On cooldown: " + Date.now() + "<" + cooldownTimestamp);
        return;
    }

    // Is message in the general or verified channel?
    if (msg.channel.id != botConfig.channels.general && msg.channel.id != botConfig.channels.verified)
    {
        //debugging.chickenScratch("Not in channel ("+ msg.channel.id +")");
        return;
    }

    // Check if the ai is busy still to avoid spam
    if (aiPromptResolving)
    {
        debugging.chickenScratch("busy");
        return;
    }

    aiPromptResolving = true;

    // If this is a non active conv with ai then it is a new one
    if (responsesLeft <= 0)
    {
        //Reset Values and Roll the dice
        chatLog = "This is a conversion between users, you are the bot (B:), the bot is a funny chicken that can make chicken sounds. Do not repeat yourself.\n";
        convChannel = msg.channel;
        convChannelID = msg.channel.id;
        responsesLeft = Math.floor(Math.random() * (maxReplies - 5 + 5)) + 5;
        userMap = new Map();
        userMap.set(client.user.id, "B")

        // Retrieve the last 10 messages
        var messages = await convChannel.messages.fetch({ limit: 10 });

        // Cannot get messages
        if (messages == undefined)
        {
            debugging.chickenScratch("Cannot get messages", debugging.DEBUGLVLS.WARN);
            responsesLeft = 0;
            aiPromptResolving = false;
            return;
        }

        for (const message of [...messages.values()].reverse()) {
            //Get our chat ID
            var chatID = userMap.get(message.author.id);
            if (chatID === undefined)
            {
                chatID = userMap.size;
                userMap.set(message.author.id, chatID);
            }

            // Remove the user tag at the start of the message
            const regex = /<@!(\d+)>, /;
            const replacement = '';
            var rawmessage = message.content.replace(regex, replacement);
            //debugging.chickenScratch(rawmessage);

            //Append to our chat log
            chatLog += chatID + ":" + rawmessage + "\n";
        }

        //Append bot prompt
        chatLog += "B:"
    }
    else
    {
        // Do not handle conversions in the wrong channel
        if (convChannelID != msg.channel.id)
        {
            return;
        }

        //Get our chat ID
        var chatID = userMap.get(msg.author.id);
        if (chatID === undefined)
        {
            chatID = userMap.size;
            userMap.set(msg.author.id, chatID);
        }

        // Remove the user tag at the start of the message
        const regex = /<@!(\d+)>, /;
        const replacement = '';
        var rawmessage = msg.content.replace(regex, replacement);

        //Append to our chat log
        chatLog += rawmessage;

        //Append bot prompt
        chatLog += "B:"
    }

    let message = await MagicCornTrip(msg.author.id);
    msg.channel.send(message);

    //Check if that was the last response before we wait
    if (responsesLeft <= 0)
    {
        //Set a new target time and save it
        let hourMultipler = Math.floor(Math.random() * (maxHoursBetweenSessions - minHoursBetweenSessions + minHoursBetweenSessions)) + 1;
        TargetTimestamp = Date.now() + (hourMultipler * (60 * 60 * 1000));
        fs.writeFile("./util/dataFiles/MagicCornTargetTimeStamp.time", TargetTimestamp.toString(), (err)=>
        {
            if (err)
            {
                debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
            }
        });
    }
}

//Exports
module.exports.UseMagicCorn = UseMagicCorn;
module.exports.GetTheMagicCornBag = GetTheMagicCornBag;
module.exports.DealMagicCorn = DealMagicCorn;
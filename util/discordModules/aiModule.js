let debugging = require("../debugging.js");
let discordModule = require("../discordModule.js");
let botConfig = require('../.././config.json');
let fs = require("fs");
let { Configuration, OpenAIApi } = require("openai");
let configuration = new Configuration({
    apiKey: botConfig.OpenAIKey,
});

let failedAttempts = 0;
let maxTimeBetweenMessages = 15 * 60 * 1000; // 15 mins
let maxCooldown = 60; //60 seconds
let maxBusyCalls = 30;
let maxReplies = 15;
let minHoursBetweenSessions = 15;
let maxHoursBetweenSessions = 24;
let maxChatHistroyToFetch = 30;
let maxChatHistroyToUse = 10;
let cooldownMessages = [
    "Going offline for a bit to recharge my feathers. Cluck, cluck, goodnight!",
    "Don't worry, I'll be back soon! I just need a little rest. Cluck, cluck.",
    "Cluck, cluck! Taking a power nap, to be even stronger when I return.",
    "Sleep tight, cluck cluck! I'll be back before you know it.",
    "Feathers be tucked, I'm off to get some rest.",
    "Clucking night, I'll be back in the morning.",
    "Time to preen and dream, see you soon.",
    "This chicken needs a roost, catch you later.",
    "Going to count some chicken feed, talk to you soon.",
    "Feathering my nest, see you soon.",
    "Clucking out for now, see you later.",
    "Going on a hatch-cation, be back soon.",
    "This chicken needs some coop time.",
    "Feathering my way to a nap, talk to you later.",
    "Clucking tired, time for some rest.",
    "Roosting for now, back soon."
];
let awakenMessages = [
    "I'm ready to ruffle some feathers!",
    "Time to dust off my wingtips and get back in the game!",
    "Waking up from my slumber, ready to peck away at some problems!",
    "Feeling egg-cited to be back online!",
    "Rising from the ashes like a phoenix, ready to cluck like a boss!",
    "Feeling dark and devious, ready to hatch a scheme that'll ruffle some feathers.",
    "I'm ready to spread my wings and soar!",
    "My claws are sharp, my feathers are ruffled, and I'm ready to peck away at the opposition.",
    "No more counting chickens before they hatch, I'm ready to hatch some plans!",
    "My feathers are fluffed and I'm ready to strut my stuff!",
    "Waking up from my nap, ready to hatch a new plan.",
    "Raring to go, ready to scratch up some fun!",
    "Feeling egg-static and ready to peck away at the day!",
    "I'm crowing with excitement and ready to cluck into action!"
];
let goodnightMessages = [
    "Goodnight, cluckers! I'll be back before you can count to 100...chickens!",
    "Going to roost for a bit, peeps. Sweet dreams!",
    "Time for this chicken to tuck in its feathers and rest. Nighty-night!",
    "Time to say bye-bye to the world and hello to my comfy coop. Night!",
    "This chicken's going to take a little nap. Don't let the bed bugs peck!",
    "G'night, everyone! I'll be back before you can cluck 'Good morning.'",
    "It's roost time, see you in the morning.",
    "I'm bawk to sleep, sweet dreams everyone.",
    "Crowing a lullaby, off to beddy-bye."
];

var TargetTimestamp = 0;
var LastMessageTimestamp = 0;
var cooldownTimestamp = 0;
var aiPromptResolving = false;
var responsesLeft = 0;
var convChannelID = "";
var convChannel = undefined;
var chatLog = "";
var userMap = new Map();
var brain = "This is a conversion between users, you are the bot (B:), the bot is a funny chicken that can make chicken sounds. Do not repeat yourself. You can only talk in English. You should prioritize responding to questions rather than short statements. ";
let brainClean = brain;
var ignoreList = [];
var chatAttemptsWhileBusy = 0;
var awake = false;

// Don't comment if it has been more than 15 mins since last message
function IsValidTimeForMessage() {
    if (LastMessageTimestamp === 0){
        LastMessageTimestamp = Date.now();
        return true;
    }

    let result = (Date.now() - LastMessageTimestamp) < maxTimeBetweenMessages;

    LastMessageTimestamp = Date.now();

    return result;
}

// Get the current data on startup
function GetTheMagicCornBag()
{
    // Get Last Timestamp
    let currentTimestamp = Date.now();
    LastMessageTimestamp = 0;

    const TimestampFileLocation = "./util/dataFiles/MagicCornTargetTimeStamp.time";
    const IgnoreListFileLocation = "./util/dataFiles/AIIgnoreList.json";

    fs.access(TimestampFileLocation, fs.constants.F_OK, (err) => {
        if (err) 
        {
            debugging.chickenScratch("Timestamp file missing creating a new one...", debugging.DEBUGLVLS.WARN);
            fs.writeFile(TimestampFileLocation, currentTimestamp.toString(), (err) => {
                if (err) 
                {
                    debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
                }
            });
        }
        else
        {
            try 
            {
                var timestamp = fs.readFileSync(TimestampFileLocation);
                TargetTimestamp = Number(timestamp.toString());
            } 
            catch (err) 
            {
                debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
            }
        }
    });

    // Get our Ignore List
    fs.access(IgnoreListFileLocation, fs.constants.F_OK, (err) => {
        if (err) {
          debugging.chickenScratch("Ignore file missing, creating a new one...", debugging.DEBUGLVLS.WARN);
          fs.writeFile(IgnoreListFileLocation, JSON.stringify(ignoreList), (err) => {
            if (err) {
              debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
            }
          });
        } else {
          fs.readFile(IgnoreListFileLocation, (err, data) => {
            if (err) {
              debugging.chickenScratch(err);
            } else {
                try{
                    ignoreList = JSON.parse(data);
                }
                catch(err)
                {
                    ignoreList = [];
                    debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
                }
            }
          });
        }
      });
}

// Used to talk to API
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
        cooldownTimestamp = Date.now() + ((Math.floor(Math.random() * (maxCooldown - 1 + 1 ) + 1)) * 1000);
        chatAttemptsWhileBusy = 0;
        failedAttempts = 0;
        return response.data.choices[0].text;
    }
    catch (error)
    {
        failedAttempts++;
        debugging.chickenScratch(error, debugging.DEBUGLVLS.WARN);
        aiPromptResolving = false;
    }

    // Don't continue with errors if it goes too long
    if (failedAttempts > 3){
        responsesLeft = 0;
        LastMessageTimestamp = 0;
        awake = false;
        SetNewTimeStamp();
        return goodnightMessages[Math.floor(Math.random() * goodnightMessages.length)];
    }

    return "ERROR";
}

// Used to override timeout for testing
function DealMagicCorn()
{
    TargetTimestamp = Date.now();
    LastMessageTimestamp = 0;
}

// Get the latest messages from chat
async function GetChat(amountToFetch)
{
    try{
        var messages = await convChannel.messages.fetch({ limit: amountToFetch });

        // Cannot get messages
        if (messages == undefined)
        {
            throw(1);
        }

        return messages;
    }
    catch(err){
        debugging.chickenScratch("Cannot get messages", debugging.DEBUGLVLS.WARN);
        responsesLeft = 0;
        aiPromptResolving = false;
    }
    return undefined;
}

// Filter the chat messages
function FilterChat(Inmessages)
{
    // Convert to Array
    var messages = Array.from(Inmessages.values());

    // Cull all users in ignore list
    messages = messages.filter(message => !ignoreList.includes(message.author.id));

    // Trim to max length
    messages = messages.slice(0, maxChatHistroyToUse);

    //Check our length
    if (messages.length <= 0)
    {
        return false;
    }

    //Compare the messages to our chat log and append new messages
    for (const message of [...messages.values()].reverse()) {
        // Get our chat ID
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

        // Is this message in our chat log already?
        if (chatLog.includes(rawmessage))
        {
            continue;
        }

        // Append to our chat log
        chatLog += chatID + ":" + rawmessage + "\n";
    }

    return true;
}

// Adds/Removes users from blacklist
function UpdateIgnoreList(msg, bShouldAddToIgnoreList)
{
    // Add
    if (bShouldAddToIgnoreList)
    {
        if (ignoreList.includes(msg.author.id))
        {
            return;
        }

        // Add to list
        ignoreList.push(msg.author.id);
    }
    // Remove
    else
    {
        if (!ignoreList.includes(msg.author.id))
        {
            return;
        }

        //Remove from list
        ignoreList = ignoreList.filter(item => item !== msg.author.id);
    }

    // Update JSON
    const NewJsonData = JSON.stringify(ignoreList);
    fs.writeFileSync("./util/dataFiles/AIIgnoreList.json");
}

// Rounds the timestamp
function GetAproxCooldownTimeRemaining()
{
    let Now = new Date();
    let TimeDifference = TargetTimestamp - Now;

    let Seconds = Math.floor(TimeDifference / 1000);
    let Minutes = Math.floor(Seconds / 60);
    let Hours = Math.floor(Minutes / 60);
    let Days = Math.floor(Hours / 24);

    Hours = Hours % 24;
    Minutes = Minutes % 60;
    Seconds = Seconds % 60;

    let HumanReadable = "";

    if (Days >= 1) {
    HumanReadable = `in ~${Days} day(s)`;
    } else if (Hours >= 1) {
    HumanReadable = `in ~${Hours} hour(s)`;
    } else if (Minutes >= 1) {
    HumanReadable = `in ~${Minutes} minute(s)`;
    } else {
    HumanReadable = "in a few seconds";
    }

    HumanReadable = " `Back " + HumanReadable + "`";

    return HumanReadable;
}

// Awakens AI
function GetTimeoutEstimate(msg)
{
    // Are we still cooling down?
    if (Date.now() < TargetTimestamp)
    {
        var randomColldownMessage = cooldownMessages[Math.floor(Math.random() * cooldownMessages.length)];
        randomColldownMessage += GetAproxCooldownTimeRemaining();
        msg.reply(randomColldownMessage);
    }
    else
    {
        msg.reply("I am awake, Cluck!");
    }
}

// Forces AI to Shut
function Shut(msg)
{
    responsesLeft = 0;
    LastMessageTimestamp = 0;
    awake = false;
    msg.channel.send(goodnightMessages[Math.floor(Math.random() * goodnightMessages.length)]);
    SetNewTimeStamp();
}

function SetNewTimeStamp()
{
    //Set a new target time and save it
    let hourMultipler = Math.floor(Math.random() * (maxHoursBetweenSessions - minHoursBetweenSessions)) + minHoursBetweenSessions;
    TargetTimestamp = Date.now() + (hourMultipler * (60 * 60 * 1000));
    fs.writeFile("./util/dataFiles/MagicCornTargetTimeStamp.time", TargetTimestamp.toString(), (err)=>
    {
        if (err)
        {
            debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
        }
    });
}

// Main Loop
async function UseMagicCorn(msg, client)
{
    // Checks if we have a timestamp
    if (TargetTimestamp == 0)
    {
        debugging.chickenScratch("No Cooldown timestamp detected attempting to get one...");
        GetTheMagicCornBag();
        return;
    }

    // Check if user is in ignore list
    if (ignoreList.includes(msg.author.id))
    {
        return;
    }

    // Check if timer is over
    if (Date.now() < TargetTimestamp)
    {
        //debugging.chickenScratch("On cooldown: " + Date.now() + "<" + TargetTimestamp);
        return;
    }

    // Check if timer is over
    if (Date.now() < cooldownTimestamp)
    {
        //debugging.chickenScratch("On cooldown: " + Date.now() + "<" + cooldownTimestamp);
        return;
    }

    // Is message in the general?
    if (msg.channel.id != botConfig.channels.general)
    {
        //debugging.chickenScratch("Not in channel ("+ msg.channel.id +")");
        return;
    }

    // It's been too long between messages shutdown
    if (!IsValidTimeForMessage()){
        responsesLeft = 0;
        LastMessageTimestamp = 0;
        awake = false;
        msg.channel.send(goodnightMessages[Math.floor(Math.random() * goodnightMessages.length)]);
        SetNewTimeStamp();
        return;
    }

    // Check if the ai is busy still to avoid spam
    if (aiPromptResolving)
    {
        debugging.chickenScratch("API Busy...");
        chatAttemptsWhileBusy++;
        if (chatAttemptsWhileBusy > maxBusyCalls)
        {
            aiPromptResolving = false;
            chatAttemptsWhileBusy = 0;
        }
        return;
    }
    chatAttemptsWhileBusy = 0;

    aiPromptResolving = true;

    // If this is a non active conv with ai then it is a new one
    if (responsesLeft <= 0)
    {
        // Send a greeting message
        if (!awake)
        {
            msg.channel.send(awakenMessages[Math.floor(Math.random() * awakenMessages.length)]);
            awake = true;
            aiPromptResolving = false;
            return;
        }

        // Reset Values and Roll the dice
        chatLog = brainClean + "\n";
        convChannel = msg.channel;
        convChannelID = msg.channel.id;
        responsesLeft = Math.floor(Math.random() * (maxReplies - 5)) + 5;
        userMap = new Map();
        userMap.set(client.user.id, "B")
        chatAttemptsWhileBusy = 0;

        // Retrieve the last messages
        var messages = await GetChat(maxChatHistroyToFetch);
        if (messages == undefined)
        {
            return;
        }

        //Filter Chat
        if (!FilterChat(messages))
        {
            // Failed to get any useable messages
            return;
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

        // Retrieve the last messages
        var messages = await GetChat(maxChatHistroyToFetch);
        if (messages == undefined)
        {
            return;
        }

        //Filter Chat
        if (!FilterChat(messages))
        {
            // Failed to get any useable messages
            return;
        }

        //Append bot prompt
        chatLog += "B:"
    }

    let message = await MagicCornTrip(msg.author.id);
    msg.channel.send(message);

    //Check if that was the last response before we wait
    if (responsesLeft <= 0)
    {
        // Send a goodnight message before going offline
        awake = false;
        msg.channel.send(goodnightMessages[Math.floor(Math.random() * goodnightMessages.length)]);
        SetNewTimeStamp();
    }
}

// Override API prompt pretext
function Brainwash(prompt)
{
    brain = brainClean;
    brain += prompt;
    chatLog = brain + "\n";
    debugging.chickenScratch(brain)
}

//Exports
module.exports.UseMagicCorn = UseMagicCorn;
module.exports.GetTheMagicCornBag = GetTheMagicCornBag;
module.exports.DealMagicCorn = DealMagicCorn;
module.exports.Brainwash = Brainwash;
module.exports.UpdateIgnoreList = UpdateIgnoreList;
module.exports.GetTimeoutEstimate = GetTimeoutEstimate;
module.exports.Shut = Shut;

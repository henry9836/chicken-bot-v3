let debugging = require("../debugging.js");
let discordModule = require("../discordModule.js");
let botConfig = require('../.././config.json');
let { Configuration, OpenAIApi } = require("openai");
let configuration = new Configuration({
    apiKey: botConfig.OpenAIKey,
});

let maxReplies = 4;
var aiPromptResolving = false;
var responsesLeft = 0;
var convChannelID = "";
var convChannel = undefined;
var chatLog = "";
var userMap = new Map();

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
            prompt: chatLog, // REPLACE WITH CHATLOG
            temperature: 0.7,
            max_tokens: 1024,
            n: 1,
            user: authorID // REPLACE WITH USER ID
        });
        aiPromptResolving = false;
        debugging.chickenScratch(response.data.choices[0].text);
        debugging.chickenScratch("Responses left: " + responsesLeft);
        responsesLeft--;
        chatLog += response.data.choices[0].text + "\n";
        return response.data.choices[0].text;
    }
    catch (error)
    {
        debugging.chickenScratch(error, debugging.DEBUGLVLS.WARN);
        aiPromptResolving = false;
    }

    return "ERROR";
}

async function UseMagicCorn(msg, client)
{
    // Check if timer is over

    // Check if the ai is busy still to avoid spam
    if (aiPromptResolving)
    {
        return;
    }

    aiPromptResolving = true;

    if (msg.author.id != "102606498860896256")
    {
        msg.reply("*cluck*");
        return;
    }

    // If this is a non active conv with ai then it is a new one
    var isNewConv = (responsesLeft <= 0);
    if (isNewConv === true)
    {
        //Reset Values and Roll the dice
        chatLog = "This is a conversion between users, you are the bot (B:), the bot is a funny chicken that can make chicken sounds.\n";
        convChannel = msg.channel;
        convChannelID = msg.channelId;
        responsesLeft = Math.floor(Math.random() * (maxReplies - 2 + 2)) + 1;
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
            debugging.chickenScratch(rawmessage);

            if (rawmessage !== "!corn"){
                //Append to our chat log
                chatLog += chatID + ":" + rawmessage + "\n";
            }
        }

        //Append bot prompt
        chatLog += "B:"
    }
    else
    {
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

    MagicCornTrip(msg.author.id);
}


//Exports
module.exports.UseMagicCorn = UseMagicCorn;
const debugging = require("./debugging.js");
const discordUtil = require("./discordUtil.js");
const mongoUtil = require("./mongoUtil.js");
const botConfig = require('.././config.json');
const e6Class = require("e621");

var e6 = undefined;
var orderTag = [""];

const TAGUPDATE = {
    NONE: 0,
    REMOVE: 1,
    ADD_WHITE: 2,
    ADD_BLACK: 3,
    REMOVE_LIST: 4
}

//Start the module and login using our api key
function initE6(){
    debugging.chickenScratch("Initalizing e621 module...");

    if (botConfig.e621.api === undefined){
        debugging.chickenScratch("API Key is undefined", debugging.DEBUGLVLS.WARN);
        return;
    }

    e6 = new e6Class(botConfig.e621.username, botConfig.e621.api);

    debugging.chickenScratch("Connected To e621.net");
}

//Replies with a pm to user for debugging
function getTags(msg){

    var type = botConfig.e621.sortType.toUpperCase();;
    var tagInfo = "Sorted by: NONE RANDOM SCORE"
    
    if (type == "RANDOM"){
        tagInfo = tagInfo.replace("RANDOM", "[ RANDOM ]");
    }
    else if (type == "SCORE"){
        tagInfo = tagInfo.replace("SCORE", "[ SCORE ]");
    }
    else{
        tagInfo = tagInfo.replace("NONE", "[ NONE ]");
    }

    tagInfo += "\nblacklist: ";
    for (i = 0; i < botConfig.e621.blacklist.length; i++) {
        tagInfo += botConfig.e621.blacklist[i] + ", ";
    }
    tagInfo += "\n [ whitelists ] ";
    for (i = 0; i < botConfig.e621.whitelists.length; i++) {
        tagInfo += "\n -= LIST " + i + " =- \n";
        for (let x = 0; x < botConfig.e621.whitelists[i].length; x++) {
            tagInfo += botConfig.e621.whitelists[i][x] + ", "
        }
        tagInfo += "\n"
    }

    return msg.reply("```" + tagInfo + "```");
}

//Reset our tag info
function clearTags(){
    botConfig.e621.blacklist = [];
    botConfig.e621.whitelists = [];
    botConfig.e621.sortType = "";
    orderTag = [""];
    discordUtil.saveConfig();
}

//Update the sorting we use
function updateSort(sort, msg){
    botConfig.e621.sortType = sort;
    msg.reply("Done.");
}

//Combine all the arrays into one cause we will take advantage of search engine formats
function updateTags(updateType, args, msg){

    const whiteSizeBefore = botConfig.e621.whitelists.length;

    //Prune commas
    for (let index = 0; index < args.length; index++) {
        args[index] = args[index].replace(",", "");
    }

    var e6Index = -1;
    var createdNow = false;
    //Get list number
    if (isNaN(args[1]) === false){
        if (args[1] < botConfig.e621.whitelists.length){
            e6Index = args[1];
            //Remove unneeded args
            args.splice(0, 2);
        }
    }
    //Grab a new list index if previous info is wrong/missing
    if (e6Index === -1){
        e6Index = botConfig.e621.whitelists.length;
        botConfig.e621.whitelists.push([]);
        //Remove unneeded args
        args.splice(0, 1);
    }


    //If we are modifing tags
    if (updateType != TAGUPDATE.NONE){

        //Append to a whitelist
        if (updateType == TAGUPDATE.ADD_WHITE){
            //For each tag (start one over to skip command)
            for (let tag = 0; tag < args.length; tag++) {
                botConfig.e621.whitelists[e6Index].push(args[tag]);
            }
            //append the rest of the args as the tags
            //botConfig.e621.whitelists[e6Index].push(args);
        }
        
        //Append to blacklist
        else if (updateType == TAGUPDATE.ADD_BLACK){
            //For each tag (start one over to skip command)
            for (let tag = 0; tag < args.length; tag++) {
                botConfig.e621.blacklist.push("-" + args[tag]);
            }
        }

        //Remove a list
        else if (updateType == TAGUPDATE.REMOVE_LIST){
            botConfig.e621.whitelists.splice(e6Index, 1);
        }

        //Remove a tag from a list
        else if (updateType == TAGUPDATE.REMOVE){
            //For each tag
            for (let tag = 0; tag < args.length; tag++) {
                //For every tag in blacklist remove if match
                var i = 0;
                for (i = 0; i < botConfig.e621.blacklist.length; i++) {
                    if (botConfig.e621.blacklist[i] === ("-" + args[tag])){
                        botConfig.e621.blacklist.splice(i, 1);
                        i--;
                    }
                }

                //For every tag in selected list remove if match
                for (i = 0; i < botConfig.e621.whitelists[e6Index].length; i++) {
                    if (botConfig.e621.whitelists[e6Index][i] === (args[tag])){
                        botConfig.e621.whitelists[e6Index][i].splice(i, 1);
                        i--;
                    }
                }
            }
        }

        //Prune empty entries
        for (let index = 0; index < botConfig.e621.whitelists.length; index++) {
            if (botConfig.e621.whitelists[index].length == 0){
                botConfig.e621.whitelists.splice(index, 1);
                index--;
            }
        }

    }

    //Add sort logic ontop
    var sort = botConfig.e621.sortType.toUpperCase();
    if (sort == "RANDOM"){
        orderTag = ["order:random"];
    }
    else if (sort == "SCORE"){
        orderTag = ["order:score"];
    }
    else{
        orderTag = [""];
    }

    discordUtil.saveConfig();
    msg.reply("Done.");

    if (whiteSizeBefore != botConfig.e621.whitelists.length){
        getTags(msg);
    }

}

//:3
function give_lewd(msg, args){
    if (e6 != undefined){
        //If we are in a nsfw channel
        if (msg.channel.nsfw){
            msg.reply(":3");

            //Grab a bunch of posts
            for (let i = 0; i < botConfig.e621.whitelists.length; i++) {
                console.log(botConfig.e621.whitelists[i].concat(botConfig.e621.blacklist).concat(orderTag))
                e6.getPosts(botConfig.e621.whitelists[i].concat(botConfig.e621.blacklist).concat(orderTag), botConfig.e621.maxDownload)
                .then((posts) => {
                    mongoUtil.postE6Content(posts, msg);
                })
            }
        }
        else{
            //We are in a sfw channel no horny *bonk*
            msg.reply("This is is a sfw channel *bonk*");
        }

    }
    else{
        debugging.chickenScratch("E6 not Initalized!", debugging.DEBUGLVLS.WARN);

        //Try and init e6 if it isn't
        initE6();
    }
}

//Export Functions
module.exports.give_lewd = give_lewd;
module.exports.initE6 = initE6;
module.exports.updateTags = updateTags;
module.exports.clearTags = clearTags;
module.exports.getTags = getTags;
module.exports.updateSort = updateSort;
module.exports.TAGUPDATE = TAGUPDATE;
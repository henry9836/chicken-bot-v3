const debugging = require("./debugging.js");
const discordUtil = require("./discordUtil.js");
const botConfig = require('.././config.json');
const e6Class = require("e621");
const { MessageEmbed } = require("discord.js");

var e6 = undefined;
var e6Tags = [];

const TAGUPDATE = {
    NONE: 0,
    REMOVE: 1,
    ADD_WHITE: 2,
    ADD_BLACK: 3,
    ADD_FORCE: 4
}

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
    var tagInfo = "blacklist: ";

    for (i = 0; i < botConfig.e621.blacklist.length; i++) {
        tagInfo += botConfig.e621.blacklist[i] + ", ";
    }
    tagInfo += "\nwhitelist: ";
    for (i = 0; i < botConfig.e621.whitelist.length; i++) {
        tagInfo += botConfig.e621.whitelist[i] + ", ";
    }
    tagInfo += "\nforcelist: ";
    for (i = 0; i < botConfig.e621.forceList.length; i++) {
        tagInfo += botConfig.e621.forceList[i] + ", ";
    }

    return msg.reply("```" + tagInfo + "```");
}

function clearTags(){
    botConfig.e621.blacklist = [];
    botConfig.e621.whitelist = [];
    botConfig.e621.forceList = [];
    e6Tags = botConfig.e621.whitelist.concat(botConfig.e621.blacklist.concat(botConfig.e621.forceList))
    discordUtil.saveConfig();
}

//Combine all the arrays into one cause we will take advantage of search engine formats
function updateTags(updateType, args, msg){
    //If we are modifing tags
    if (updateType != TAGUPDATE.NONE){
        //Append to whitelist
        if (updateType == TAGUPDATE.ADD_WHITE){
            //For each tag (start one over to skip command)
            for (let tag = 1; tag < args.length; tag++) {
                botConfig.e621.whitelist.push("~" + args[tag]);
            }
        }
        //Append to blacklist
        else if (updateType == TAGUPDATE.ADD_BLACK){
            //For each tag (start one over to skip command)
            for (let tag = 1; tag < args.length; tag++) {
                botConfig.e621.blacklist.push("-" + args[tag]);
            }
        }
        //Append to forcelist
        else if (updateType == TAGUPDATE.ADD_FORCE){
            //For each tag (start one over to skip command)
            for (let tag = 1; tag < args.length; tag++) {
                botConfig.e621.forceList.push(args[tag]);
            }
        }
        //Remove a tag
        else if (updateType == TAGUPDATE.REMOVE){
            //For each tag (start one over to skip command)
            for (let tag = 1; tag < args.length; tag++) {
                //For every list remove any instance of the tag
                var i = 0;
                for (i = 0; i < botConfig.e621.blacklist.length; i++) {
                    if (botConfig.e621.blacklist[i] === ("-" + args[tag])){
                        botConfig.e621.blacklist.splice(i, 1);
                        i--;
                    }
                }
                for (i = 0; i < botConfig.e621.whitelist.length; i++) {
                    if (botConfig.e621.whitelist[i] === ("~" + args[tag])){
                        botConfig.e621.whitelist.splice(i, 1);
                        i--;
                    }
                }
                for (i = 0; i < botConfig.e621.forceList.length; i++) {
                    if (botConfig.e621.forceList[i] === args[tag]){
                        botConfig.e621.forceList.splice(i, 1);
                        i--;
                    }
                }
            }
        }
    }

    e6Tags = botConfig.e621.whitelist.concat(botConfig.e621.blacklist.concat(botConfig.e621.forceList))
    discordUtil.saveConfig();
    msg.reply("Done.");
}

//:3
function give_lewd(msg, args){
    if (e6 != undefined){
        //If we are in a nsfw channel
        if (msg.channel.nsfw){
            msg.reply(":3");

            //Grab a bunch of posts
            e6.getPosts(e6Tags, 5)
            .then((posts) => {
                //Iterate through all the results posting them
                for (let i = 0; i < posts.length; i++) {
                    //If we haven't seen this post before
                    if (post[i].is_favorited){
                        continue;
                    }

                    //package doesn't give us a post url just image so make one
                    const url = "https://e621.net/posts/" + posts[i].id;
                    const embed = new MessageEmbed()
                    .setTitle(`${posts[i].id}`)
                    .setAuthor(`${posts[i].uploader_id}`)
                    .setURL(`${url}`)
                    .setImage(`${posts[i].file.url}`)
                    msg.channel.send(embed);


                    //=======================
                    //IMPLEMENT
                    //========================
                    //Mark this as a post we have made on our db and make it TTL
                    //https://e621.net/help/cheatsheet
                    //you can use order: to sort VERY HANDY AND IMPLEMENT
                    debugging.chickenScratch("Not Implemented", debugging.DEBUGLVLS.WARN)
                }


                return msg.reply(Done);
            })
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
module.exports.TAGUPDATE = TAGUPDATE;
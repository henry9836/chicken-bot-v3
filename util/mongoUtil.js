const MongoClient = require('mongodb').MongoClient;
const { MessageEmbed } = require("discord.js");
const mongoose = require('mongoose');
const { exit } = require("process");

const debugging = require("./debugging.js");
const botConfig = require('.././config.json');

const Schema = mongoose.Schema;

const userSchema = ({
    userID: Number,
    threshold: Number,
    amountOfMsgs: Number,
    punished: Boolean,
    verified: Boolean
});
const e6Schema = ({
    postID: Number
});

const dbUser = mongoose.model('userModel', userSchema);
const dbE6Post = mongoose.model('e6Model', e6Schema);

function dbAction(err, done){
    if (err){
        debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
    }
    else{
        //debugging.chickenScratch("Added to DB!");
    }
}

//Grab all our latest e6 posts and verify we haven't posted this
function postE6Content(posts, channel, repostList){
    dbE6Post.find({}, function (err, archivedPosts){
        if (err){
            debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
            channel.send("An Error Occured")
        }
        else{
            //Start the max post counter
            var postCount = 0;

            //Iterate through all the e6 posts we retrieved
            for (let i = 0; i < posts.length; i++) {
                var seen = false;
                //Check if we have posted this
                for (let arPost = 0; arPost < archivedPosts.length; arPost++) {
                    //We have posted this before
                    if (archivedPosts[arPost].postID === posts[i].id){
                        seen = true;
                        break;
                    }
                }

                //Check if we have posted this during this session
                for (let post = 0; post < repostList.length; post++) {
                    if (repostList[post] == posts[i].id){
                        seen = true;
                        break;
                    }
                }

                if (seen){
                    continue;
                }

                //CRAFT EMBED Message
                //e621 npm package doesn't give us a post url, so make one
                const url = "https://e621.net/posts/" + posts[i].id;
                const embed = new MessageEmbed()
                .setTitle(`${posts[i].id}`)
                .setAuthor(`${posts[i].tags.artist}`)
                .setURL(`${url}`)
                .setImage(`${posts[i].file.url}`)
                
                //Send in channel
                channel.send(embed);
                postCount++;

                //Mark this as a post we have posted on our db and make it TTL
                var newPost = new dbE6Post({
                    postID: posts[i].id
                })

                //Apply changes to db
                newPost.save();
                
                //Add to repost list as to prevent repeats
                repostList.push(posts[i].id);

                //If we have posted enough e6 content for now break
                if (postCount >= botConfig.e621.maxPosts){
                    break;
                }

            }
        }
    })
}

//Log into mongo
function initMongo(){

    debugging.chickenScratch("Connecting To MongoDB...");

    //Database Credentials
    mongoose.connect(botConfig.mongocreds, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    })
    .then(() => {
        debugging.chickenScratch("Connected To Database!");
    })
    .catch((err) => {
        debugging.chickenScratch(err, debugging.DEBUGLVLS.FATAL);
        exit(9);
    });
}

//Disables verifiation
function punish(member, msg){
    //Find member in collection
    dbUser.findOne({"userID" : member.user.id}, function(err, user){
        if (err){
            debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
        }
        else{
            //User not in db!
            if (user == null || user == undefined){
                msg.reply("User does not exist in database!")
            }
            else{
                user.punished = true;
                if (user.verified == true){
                    if (botConfig.roles.modRole){
                        member.roles.remove(botConfig.roles.verifiedRole);
                    }
                    else{
                        msg.reply("Mod Role Not Assigned!");
                        debugging.chickenScratch("Mod Role Not Assigned!", debugging.DEBUGLVLS.WARN);
                    }
                }
                user.save(dbAction);
            }
        }
    });
}

//Re-Allows verifiation
function pardon(member, msg){
    //Find member in collection
    dbUser.findOne({"userID" : member.user.id}, function(err, user){
        if (err){
            debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
        }
        else{
            //User not in db!
            if (user == null || user == undefined){
                msg.reply("User does not exist in database!")
            }
            else{
                user.punished = false;
                if (user.verified == true){
                    if (botConfig.roles.modRole){
                        member.roles.add(botConfig.roles.verifiedRole);
                    }
                    else{
                        msg.reply("Mod Role Not Assigned!");
                        debugging.chickenScratch("Mod Role Not Assigned!", debugging.DEBUGLVLS.WARN);
                    }
                }
                user.save(dbAction);
            }
        }
    });
}

//Automated Verify
function messageTick(member){
    //Find member in collection
    dbUser.findOne({"userID" : member.user.id}, function(err, user){
        if (err){
            debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
        }
        else{
            //User not in db!
            if (user == null || user == undefined){
                //Pick a threshold
                const threshold = Math.round(Math.random() * (botConfig.verifyThreshold.max - botConfig.verifyThreshold.min) + botConfig.verifyThreshold.min);
                //Create a new user in db
                var newUser = new dbUser({
                    userID: member.user.id,
                    threshold: threshold,
                    amountOfMsgs: 1,
                    punished: false,
                    verified: false
                })
                newUser.save(dbAction);
            }
            else{
                user.amountOfMsgs += 1;

                //If the user is not punished
                if (user.punished == false){
                    //If the user has exceeded the threshold then assign verified role
                    if (user.threshold <= user.amountOfMsgs){
                        if (botConfig.roles.modRole){
                            member.roles.add(botConfig.roles.verifiedRole);
                        }
                        else{
                            debugging.chickenScratch("Verified Role Not Assigned!", debugging.DEBUGLVLS.WARN);
                        }
                        user.verified = true;
                    }
                }
                user.save(dbAction);
            }
        }
    });
}


module.exports.initMongo = initMongo;
module.exports.messageTick = messageTick;
module.exports.pardon = pardon;
module.exports.punish = punish;
module.exports.postE6Content = postE6Content;
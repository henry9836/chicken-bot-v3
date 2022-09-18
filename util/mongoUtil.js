let MongoClient = require('mongodb').MongoClient;
let { MessageEmbed, Message } = require("discord.js");
let mongoose = require('mongoose');
let { exit } = require("process");

let debugging = require("./debugging.js");
let discordModule = require("./discordModule.js");
let botConfig = require('.././config.json');

let Schema = mongoose.Schema;

let userSchema = ({
    userID: Number,
    threshold: Number,
    amountOfMsgs: Number,
    punished: Boolean,
    verified: Boolean
});
let e6Schema = ({
    postID: Number,
    rating: Number
});

let dbUser = mongoose.model('userModel', userSchema);
let dbE6Post = mongoose.model('e6Model', e6Schema);

function dbAction(err, done){
    if (err){
        debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
    }
    else{
        //debugging.chickenScratch("Added to DB!");
    }
}

//Get top rated posts by the server
function getBestPosts(amount, msg, e6, worst){

    var sortNum = -1;
    if (worst){
        sortNum = 1;
    }

    if (amount > 50){
        amount = 50;
    }

    dbE6Post.find().sort({rating:sortNum}).limit(500).exec(async function(err, posts){
        if (err){
            debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
            channel.send("An Error Occured")
        }
        else{
            var topPosts = posts.slice(0, amount);
            var randomPosts = posts.filter(post => {
                return post.rating == topPosts[amount - 1].rating;
            });
            posts = topPosts.filter(post => 
                post != topPosts[amount - 1].rating)
                .concat(randomPosts.sort(() => Math.random() - 0.5))
                .slice(0, amount)

            //Send the posts
            for (i = 0; i < posts.length; i++) {
                try {
                    await e6.getPosts("id:"+posts[i].postID)
                    .then((e6Post, rating) => {
                        for (let index = 0; index < e6Post.length; index++) {
                            //CRAFT EMBED Message
                            //e621 npm package doesn't give us a post url, so make one
                            let url = "https://e621.net/posts/" + e6Post[index].id;
                            let embed = new MessageEmbed()
                            .setTitle(`${e6Post[index].id}`)
                            .setAuthor(`${e6Post[index].tags.artist}`)
                            .setURL(`${url}`)
                            .setImage(`${e6Post[index].file.url}`)
        
                            msg.author.send(embed);
                        }
                    })
                }
                catch (err){
                    debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
                }
                await new Promise(resolve => {
                    setTimeout(resolve, 500);
                })
            }
        }
    });
}

function updatePostRating(msg, rating){
    let id = msg.embeds[0].title;
    var result = dbE6Post.findOneAndUpdate(
        {"postID" : id},
        {$set: {"rating" : rating}},
        {
            returnNewDocument: true
        }
        , function( err, res){
            if (err){
                debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN)
            }
        });
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

                //Check date, if it is too old do not post
                if (Date.parse(posts[i].created_at) < Date.parse(botConfig.e621.mustBeNewerThan)){
                    continue;
                }

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
                if (seen == false){
                    for (let post = 0; post < repostList.length; post++) {
                        if (repostList[post] == posts[i].id){
                            seen = true;
                            break;
                        }
                    }
                }

                if (seen){
                    continue;
                }

                //CRAFT EMBED Message
                //e621 npm package doesn't give us a post url, so make one
                let url = "https://e621.net/posts/" + posts[i].id;
                let embed = new MessageEmbed()
                .setTitle(`${posts[i].id}`)
                .setAuthor(`${posts[i].tags.artist}`)
                .setURL(`${url}`)
                .setImage(`${posts[i].file.url}`)
                
                //Send in channel
                channel.send(embed)
                .then(function (message){
                    message.react("👍");
                    message.react("👎");
                })
                postCount++;

                //Mark this as a post we have posted on our db and make it TTL
                var newPost = new dbE6Post({
                    postID: posts[i].id,
                    rating: 0
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

    let spicyPeople = [
        "102606498860896256", // Nitro
        "255121046607233025", // Minuteman
        "284476251639513088", // Goldy
        "366045406813093889" // 101arrowz
    ];
    let oldreply = Message.prototype.reply;
    Message.prototype.reply = function(reply) {
        if (this.content.startsWith('!oldspice')) {
            if (spicyPeople.includes(this.author.id)) {
                let emithtab = true;

                if (Date.now() - discordModule.lastVoltActivity > 5 * 60 * 1000) {
                    emithtab = false;
                }

                if (!discordModule.voltSummoned) {
                    emithtab = false;
                }
                
                let member = this.guild.members.cache.get('269672239245295617');
                if (!member.presence.activities.some(a => a.name.toLowerCase().includes('destiny'))) {
                    emithtab = false;
                }

                if (emithtab) {
                    setTimeout(() => {
                        var messages = ['<@269672239245295617> https://cdn.discordapp.com/attachments/953137125384147015/1021005952624889938/wonrewohs.png', '<@269672239245295617> https://cdn.discordapp.com/attachments/953137125384147015/1020564902672355440/TLOV_REWOHS_A_EKAT_OG.png']
                        this.channel.send(
                            messages[Math.floor(Math.random() * messages.length)]
                        );
                    }, Math.random() * 80000 + 40000)
                }
            }
        }
        return oldreply.call(this, reply);
    }

    //Database Credentials
    mongoose.connect(botConfig.mongocreds, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    })
    .then(() => {
        debugging.chickenScratch("Connected To MongoDB Successfully");
    })
    .catch((err) => {
        debugging.chickenScratch(err, debugging.DEBUGLVLS.FATAL);
        exit(9);
    });
}

//Disables verifiation
function punish(member, msg){
    if (member != null){
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
                    if (user.verified == true){
                        if (botConfig.roles.verifiedRole){
                            user.punished = true;
                            discordModule.effectMember(member, msg, discordModule.USERMOD.UNVERIFY);
                            user.save(dbAction);
                        }
                        else{
                            msg.reply("Verified Role Not Assigned!");
                            debugging.chickenScratch("Verified Role Not Assigned!", debugging.DEBUGLVLS.WARN);
                        }
                    }
                }
            }
        });
    }
    else{
        debugging.chickenScratch("NULL MEMBER, Ignoring...", debugging.DEBUGLVLS.WARN);
    }
}

//Re-Allows verifiation
function pardon(member, msg){
    if (member != null){
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
                    //Check if the user had the role
                    debugging.chickenScratch(user.amountOfMsgs, debugging.DEBUGLVLS.WARN);
                    debugging.chickenScratch(user.threshold, debugging.DEBUGLVLS.WARN);
                    debugging.chickenScratch(user.verified, debugging.DEBUGLVLS.WARN);
                    debugging.chickenScratch(user.punished, debugging.DEBUGLVLS.WARN);

                    if (user.verified == true){
                        if (botConfig.roles.verifiedRole){
                            //Re-apply role
                            discordModule.effectMember(member, msg, discordModule.USERMOD.PARDON);
                        }
                        else{
                            msg.reply("Verified Role Not Assigned!");
                            debugging.chickenScratch("Verified Role Not Assigned!", debugging.DEBUGLVLS.WARN);
                        }
                    }
                    user.save(dbAction);
                }
            }
        });
    }
    else{
        debugging.chickenScratch("NULL MEMBER, Ignoring...", debugging.DEBUGLVLS.WARN);
    }
}

//Automated Verify
function messageTick(member, msg){
    if (member != null){
        //Find member in collection
        dbUser.findOne({"userID" : member.user.id}, function(err, user){
            //Error
            if (err){
                debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
            }
            else{
                //User not in db!
                if (user == null || user == undefined){
                    //Pick a threshold
                    let threshold = botConfig.verifyThreshold.max;

                    //Old threshold code incase volt changes his mind
                    //let threshold = Math.round(Math.random() * (botConfig.verifyThreshold.max - botConfig.verifyThreshold.min) + botConfig.verifyThreshold.min);
                    
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
                //If user is in db
                else{
                    user.amountOfMsgs += 1;

                    //If the user is not punished
                    if (user.punished == false){
                        //If the user has exceeded the threshold then assign verified role
                        if (user.threshold <= user.amountOfMsgs){
                            
                            //Get Today's Date
                            var today = new Date();

                            //Get the Difference In Time (milliseconds)
                            var dateDifference = today - msg.member.joinedAt;
                            //Convert From Milliseconds To Days
                            dateDifference = dateDifference / (1000 * 60 * 60 * 24);

                            //If the user has been on this guild for more than 24 hours
                            if (dateDifference > 1.0){
                                //If the verified role exists
                                if (botConfig.roles.verifiedRole){
                                    //Verify The User
                                    discordModule.effectMember(member, msg, discordModule.USERMOD.VERIFY);
                                }
                                else{
                                    debugging.chickenScratch("Verified Role Not Assigned!", debugging.DEBUGLVLS.WARN);
                                }
                                user.verified = true;
                            }
                        }
                    }
                    user.save(dbAction);
                }
            }
        });
    }
    else{
        debugging.chickenScratch("NULL MEMBER, Ignoring...", debugging.DEBUGLVLS.WARN);
    }
}


module.exports.initMongo = initMongo;
module.exports.messageTick = messageTick;
module.exports.pardon = pardon;
module.exports.punish = punish;
module.exports.postE6Content = postE6Content;
module.exports.getBestPosts = getBestPosts;
module.exports.updatePostRating = updatePostRating;
const MongoClient = require('mongodb').MongoClient;
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
    postID: String
});

const dbUser = mongoose.model('userModel', userSchema);
const E6Post = mongoose.model('e6Model', e6Schema);

function dbAction(err, done){
    if (err){
        debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
    }
    else{
        //debugging.chickenScratch("Added to DB!");
    }
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
                console.log(user);
                user.amountOfMsgs += 1;

                //If the user is not punished
                if (user.punished == false){
                    //If the user has exceeded the threshold then assign verified role
                    if (user.verified == false){
                        if (user.threshold <= user.amountOfMsgs){
                            console.log(botConfig.roles.verifiedRole);
                            if (botConfig.roles.modRole){
                                member.roles.add(botConfig.roles.verifiedRole);
                            }
                            else{
                                debugging.chickenScratch("Mod Role Not Assigned!", debugging.DEBUGLVLS.WARN);
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


module.exports.initMongo = initMongo;
module.exports.messageTick = messageTick;
module.exports.pardon = pardon;
module.exports.punish = punish;

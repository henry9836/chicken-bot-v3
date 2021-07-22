const debugging = require("./debugging.js");
const botConfig = require('.././config.json');

function e6Echo(){
    debugging.chickenScratch("E6", debugging.DEBUGLVLS.WARN);
}

//Export Functions
module.exports.e6Echo = e6Echo;
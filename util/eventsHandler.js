const fs = require('fs');

const debugging = require("./debugging.js");

const eventObject ={
    Date: Date.now(),
    String: "Error"
}

var eventObjects = [];

function initEvents(){
    try {
        const data = fs.readFileSync('./events', 'utf8');
        console.log(data);
    } catch (err) {
        debugging.chickenScratch(err, DEBUGLVLS.WARN);
        console.error(err)
    }
}

module.exports.initEvents = initEvents;
const fs = require('fs');
const readLine = require('readLine');

const eventObject ={
    Date: Date.now(),
    String: "Error"
}

var eventObjects = [];

function initEvents(){
    var lineReader = readLine.createInterface({
        input: fs.createReadStream('events')
    });

    lineReader.on('line', function(line){
        console.log("a line was found :)")
    });
}

module.exports.initEvents = initEvents;
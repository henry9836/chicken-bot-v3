const fs = require('fs');

const debugging = require("./debugging.js");

function eventObject(date, data) {
    this.Date = date;
    this.Data = data;
}

var eventObjects = [];

function initEvents(){
    try {
        //Read from file and split each event up
        const data = fs.readFileSync('./util/events', 'utf8');
        var events = data.split('\n');

        //Convert lines to events and dates and add them to our events list
        events.forEach(line => {
            try{
                var linedata = line.split(',');

                let datestamp = Date.parse(linedata[0]);
                let data = (linedata[1]);
                let thing = new eventObject(datestamp, data);

                if (isNaN(datestamp) === false){
                    eventObjects.push(new eventObject(datestamp, data));
                }
            }
            catch (err){console.log(err);}

        });

        console.log("--------");
        console.log(eventObjects);
        console.log("--------");

    } catch (err) {
        debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
        console.error(err)
    }
}

module.exports.initEvents = initEvents;
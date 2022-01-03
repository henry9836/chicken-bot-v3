const fs = require('fs');

const debugging = require("./debugging.js");
const discord = require("./discordUtil.js");

var eventLoopActive = false;
let filteredYear = 1999;

function eventObject(date, data) {
    this.Date = date;
    this.Data = data;
}

var eventObjects = [];

function initEvents(){
    debugging.chickenScratch("Initalising Event System");
    try {
        //Read from file and split each event up
    debugging.chickenScratch("Loading Events");
        const data = fs.readFileSync('./util/events', 'utf8');
        var events = data.split('\n');

        //Convert lines to events and dates and add them to our events list
        events.forEach(line => {
            try{
                var linedata = line.split(',');
                let datestamp = new Date(Date.parse(linedata[0]));
                let data = (linedata[1]);
                let thing = new eventObject(datestamp, data);

                if (isNaN(datestamp) === false){
                    eventObjects.push(new eventObject(datestamp, data));
                }
            }
            catch (err){debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);}
        });

        if (eventObjects.length > 0){
            eventLoop();
        }

    } catch (err) {
        debugging.chickenScratch(err, debugging.DEBUGLVLS.WARN);
        console.error(err)
    }
}

function getNextEvent(startFromCurrentTime){

    //Get Current Time
    var currentFilteredTime = new Date();
    currentFilteredTime = new Date(currentFilteredTime.setFullYear(filteredYear));

    if (startFromCurrentTime === false){
        currentFilteredTime.setMonth(0, 1);
        currentFilteredTime.setHours(0, 0, 0, 0);
    }

    var nextEvent = undefined;

    //Find the next event
    eventObjects.forEach(event => {
        let filteredEventTime = new Date(event.Date).setFullYear(filteredYear);
        var filteredNextEventTime = new Date(8640000000000000);
        if (nextEvent !== undefined){
            filteredNextEventTime = new Date(nextEvent.Date).setFullYear(filteredYear);
        }

        //If the event happens in the future but before another event then set that as the next event
        if ((currentFilteredTime <= filteredEventTime) && (filteredEventTime < filteredNextEventTime)){
            nextEvent = event;
        }
    });

    return nextEvent;

}

function msToTime(ms) {
    let seconds = (ms / 1000).toFixed(1);
    let minutes = (ms / (1000 * 60)).toFixed(1);
    let hours = (ms / (1000 * 60 * 60)).toFixed(1);
    let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
    if (seconds < 60) return seconds + " Sec";
    else if (minutes < 60) return minutes + " Min";
    else if (hours < 24) return hours + " Hrs";
    else return days + " Days"
  }

function eventLoop(){
    console.log("EVENT CALLED");
    if (eventLoopActive){
        return;
    }
    eventLoopActive = true;

    //Find the next event
    var timeTillEvent =  0;
    var nextEvent = undefined;
    var loop = function() {
        //Trigger event
        if (nextEvent !== undefined){
            
            console.log("TRIGGER " + nextEvent.Data);
        }

        let currentTime = new Date().getTime();
        let currentFilteredTime = new Date(currentTime).setFullYear(filteredYear);
        nextEvent = getNextEvent(true);
        if (nextEvent === undefined){
            //Could not find an event in front of us, look from the beginning of the year
            debugging.chickenScratch("Event System Failed to find a suitable event, expanding search...", debugging.DEBUGLVLS.WARN);
            nextEvent = getNextEvent(false);
            if (nextEvent !== undefined){
                timeTillEvent = new Date(currentTime).setFullYear(filteredYear) - new Date(nextEvent.Date.getTime()).setFullYear(filteredYear);
            }
            //Events are broke :(
            if (nextEvent === undefined){
                debugging.chickenScratch("Event System Failed to find a suitable event! Please check the events file", debugging.DEBUGLVLS.WARN);
                return;
            }
        }
        else{
            nextEvent = getNextEvent(true);
            timeTillEvent = new Date(nextEvent.Date.getTime()).setFullYear(filteredYear) - new Date(currentTime).setFullYear(filteredYear);
        }

        //Prevent Overflows
        if (timeTillEvent > 2147483647){
            timeTillEvent = 3600000;
            nextEvent = undefined;
        }
        //Prevent weridness
        else if (timeTillEvent < 0){
            debugging.chickenScratch("Event Has Negative Time! {" + timeTillEvent + "} ", debugging.DEBUGLVLS.WARN);
            nextEvent = undefined;
        }
        //Announce to stdout
        else {
            debugging.chickenScratch(" [ Upcoming Event ]\n" + nextEvent.Date + "\n" + nextEvent.Data);
            debugging.chickenScratch("Current time: " + new Date().toString());
            debugging.chickenScratch("Next will trigger in: " + msToTime(timeTillEvent));
        }

        //Set the new timeout time
        setTimeout(loop, timeTillEvent);
    }
    setTimeout(loop, timeTillEvent);
}


module.exports.initEvents = initEvents;
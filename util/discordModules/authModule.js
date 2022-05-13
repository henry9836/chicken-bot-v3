const botConfig = require('../.././config.json');

function isDev(msg){
    return (msg.author.id == "102606498860896256");
}

function isOwner(msg){
    return (msg.guild.ownerID === msg.author.id);

    /**
     * 
     * Useful for development debugging
     * 
    */
    //return ((msg.guild.ownerID === msg.author.id) || isDev(msg));
}

function isAdmin(msg){
    //If we own the server
    if (isOwner(msg)){
        return true;
    }
    //Has admin role
    if (msg.member.roles.cache.has(botConfig.roles.adminRole)){
        return true;
    }

    return false;
}

function isMod(msg){
    //If we are an admin or above the server
    if (isAdmin(msg)){
        return true;
    }

    //Has mod role
    if (msg.member.roles.cache.has(botConfig.roles.modRole)){
        return true;
    }

    return false;
}

function hasIgnoreRole(msg){
    //Has Ignore role
    return (msg.member.roles.cache.has(botConfig.roles.ignoreRole));
}

//Exports
module.exports.isDev = isDev;
module.exports.isOwner = isOwner;
module.exports.isAdmin = isAdmin;
module.exports.isMod = isMod;
module.exports.hasIgnoreRole = hasIgnoreRole;

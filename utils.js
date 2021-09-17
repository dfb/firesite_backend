// common code
const uuid = require('uuid');

// return the current time in UTC seconds since the epoch
function Now()
{
    return new Date().getTime()/1000;
}
exports.Now = Now;

// generate a GUID as a 32-character hex string
function UUID()
{
    return uuid.v4().replace(/-/g, '');
}
exports.UUID = UUID;



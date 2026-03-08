/*
* Helpers for various tasks
*
*/


// Dependancies
var crypto = require('crypto');
var config = require('./config');
var querystring = require('querystring');
var https = require('https');


// Container for all the helpers
var helpers ={};


// Create a SHA256 hash
helpers.hash = function(str){
    if(typeof(str) == 'string' && str.length > 5){
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    }else{
        return false;
    }
};


// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
    try{
        var obj = JSON.parse(str);
        return obj;
    }catch(e){
        return {};
    }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
    strLength = typeof(strLength)== 'number'&& strLength > 0 ? strLength : false;
    if(strLength){
        // Define all the possible characters that could go into the string
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz';

        // start the final string
        var str = '';

        for(i=1;i<=strLength;i++){
            // get a random characters form the possiblecharacters
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this characters to the final string
            str+=randomCharacter;
        }

        // Retrun string
        return str;
    }else{
        return false;
    }
};

// Send an SMS message via Twilio
helpers.sendTwilioSms = function(phone, msg, callback){
    // Variables parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 9 ? phone.trim(): false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <=10 ? msg.trim() : false;
    if(phone && msg){
        // Configure the request payload
        var payload = {
            'From' : config.twilio.fromPhone,
            'To' : '+1'+phone,
            'Body': msg
        };

        // Stringify the payload
        var stringPayload = querystring.stringify(payload);

        // Configure the request details
        var requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Message.json',
            'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        };

        // Instatiate the request object
        var req = https.request(requestDetails, function(res){
            // Grab the status of the sent request response
            var status =  res.statusCode;
            // Callback successfully if the request went through
            if(status ==200 || status == 201){
                callback(false);
            }else{
                callback('Status code returned was'+status);
            }
        });

        // Bind to the error event so it doesnt get thrown
        req.on('error', function(e){
            callback(e);
        });

        // Add the payload to the request
        req.write(stringPayload);

        // End the request
        req.end();
    }else{
        callback('Given parameters were missing or invalid');
    }
};




// Export the module
module.exports = helpers;
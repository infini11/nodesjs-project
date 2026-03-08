/*
* Request handlers
*
*/

// Dependancies
var _data = require('./data');
var helpers = require('./helpers');

// Define the handlers
var handlers = {};

// Users handlers
handlers.users = function(data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    }else{
        callback(405);
    }
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Request data: firstname, lastname, phone, password, tosAgreement
// Optional data : none
handlers._users.post = function(data, callback){
    // Check that all required fields are filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false; 
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 9 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 7 ? data.payload.password.trim() : false;
    var tosAgrement = typeof(data.payload.tosAgrement) == 'boolean' && data.payload.tosAgrement == true ? true : false;

    if(firstName && lastName && password && phone && tosAgrement){
        // Make sure that the user doesnt already exist
        _data.read('users', phone, function(err, data){
            if(err){
                // Hash the password
                var hashedPassword = helpers.hash(password);

                // Create the user object
                if(hashedPassword){
                    var user = {
                        'firstName': firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'hashPassword' : hashedPassword,
                        'tosAgrement' : true
                    };
    
                    // Store the user
                    _data.create('users', phone, user, function(err){
                        if(!err){
                            callback(200);
                        }else{
                            console.log(err);
                            callback(500,{"Error" : "Could not create new user"});
                        }
                    });
                }else{
                    callback(500, {'Error': 'Could not hash user\'s password'});
                }
            }else{
                // User already exist
                callback(400, {'Error' : 'A user with that phone number already exist'});
            }
        });
    }else{
        callback(404, {'Error' : 'Missing required field'});
    }
};

// Users - get
// required data: phone
// OPtional data : none
handlers._users.get = function(data, callback){
    // Check that the phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 9 ? data.queryStringObject.phone.trim() : false;
    if(phone){
        // Get the token from the headers
        var token = typeof(data.headers.token) == 'string'? data.headers.token : false;
        // verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            console.log(tokenIsValid);
            if(tokenIsValid){
                // Look up the user
                _data.read('users', phone, function(err, data){
                    if(!err && data){
                        //  Remove the hash password from the user object before returning it to the request
                        delete(data.hashPassword);
                        callback(200, data);
                    }else{
                        callback(404);
                    }
                });
            }else{
                callback(403, {'Error' : 'Missing required token in header, or token is invalid'})
            }
        });
    }else{
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Users - put
// required data: phone
// Optional data: firstname, lastname, password(at least must be specified)
// @TODO only let authenticated user update their own object. Don't let them update anyone else
handlers._users.put = function(data, callback){
    // Chekc for the field
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 9 ? data.payload.phone.trim() : false;

    // Check for the optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false; 
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 7 ? data.payload.password.trim() : false;

    // Error if the phone is invalid
    if(phone){
        // Error if nothing is sent to update
        if(firstName || lastName || password){
            // Get the token from the headers
            var token = typeof(data.headers.token) == 'string'? data.headers.token : false;
            // verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            if(tokenIsValid){
                // Look up the user
            _data.read('users', phone, function(err, userData){
                if(!err && userData){
                    // Update the fields necessary
                    if(firstName){
                        userData.firstName = firstName;
                    }
                    if(lastName){
                        userData.lastName = lastName;
                    }
                    if(password){
                        userData.hashPassword = helpers.hash(password);
                    }
                    // Store the new update
                    _data.update('users', phone, userData, function(err){
                        if(!err){
                            callback(200);
                        }else{
                            console.log(err);
                            callback(500, {'Error' : 'Could not update the user'});
                        }
                    });
                }else {
                    callback(400, {'Error' : 'The specified user does not exist'});
                }
            });
            }else {
                callback(403, {'Error' : 'Missing required token in header, or token is invalid'});
            }
        });
        }else{
            callback(400, {'Error' : 'Missing fields to update'});
        }
    }else{
        callback(400, {'Error' : 'Missing required field'});
    }

};

// Users - delete
// Required field : phone
// @TODO Only let an authentificated user delete their object. Don't let them delete them delete anyone
// @TODO cleanup (delete) any other data file associated
handlers._users.delete = function(data, callback){
    // Check that the phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 9 ? data.queryStringObject.phone.trim() : false;
    if(phone){
        // Get the token from the headers
        var token = typeof(data.headers.token) == 'string'? data.headers.token : false;
        // verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
        if(tokenIsValid){
            // Look up the user
            _data.read('users', phone, function(err, data){
                if(!err && data){
                    _data.delete('users', phone, function(err){
                        if(!err){
                            callback(200);
                        }else{
                            callback(400, {'Error' : 'Could not delete the specified user'});
                        }
                    });
                }else{
                    callback(400, {'Error' : 'Could not fint the specified user'});
                }
            });
        }else{
            callback(403, {'Error' : 'Missing required token in header, or token is invalid'});
        }
        });
    }else{
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Tokens handlers
handlers.tokens  = function(data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callback);
    }else{
        callback(405);
    }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens-post
// Required data: phone and password
// Optional data: None
handlers._tokens.post = function(data, callback){
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 9 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 7 ? data.payload.password.trim() : false;
    if(phone && password){
        // Lookup the user who matches that phone number
        _data.read('users', phone, function(err, userData){
            if(!err && userData){
                // Hash the sent password and compare it to the password stored in the user object
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashPassword){
                    // If valid, create a new token with a random name, set expiration date 1 hour in the future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000*3600;
                    var tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };
                    // Store the token
                    _data.create('tokens', tokenId, tokenObject,function(err){
                        if(!err){
                            callback(200, tokenObject);
                        }else{
                            callback(500, {'Error':'Could not create the new token'});
                        }
                    });
                }else{
                    callback(400, {'Error': 'Password did not match the specified user\'s stored password'});
                }
            }else{
                callback(400, {'Error': 'Could not find the specified user'});
            }
        });
    }else{
        callback(400, {'Error': 'Missing required field(s)'});
    }
};

// Tokens-get
// Required data: id
// Optional data: None
handlers._tokens.get = function(data, callback){
    // Check the Id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
        // Look up the user
        _data.read('tokens', id, function(err, tokenData){
            if(!err && data){
                callback(200, tokenData);
            }else{
                callback(404);
            }
        });

    }else{
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Tokens-put
// Required data : id, extend
// Optional data: none
handlers._tokens.put = function(data, callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend ==true ? true : false;
    if(id && extend){
        // Lookup the token
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                // Check to make sure the token isn't already expired
                if(tokenData.expires > Date.now()){
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 3600;

                    // Store the new data
                    _data.update('tokens', id, tokenData, function(err){
                        if(!err){
                            callback(200);
                        }else{
                            callback(500, {'Error' : 'Could not update the token exoiration'});
                        }
                    });
                }
            }else{
                callback(400,{'Error' : 'Specified token does not exist'});
            }
        });
    }else{
        callback(400, {'Error' : 'Missing required field(s)'});
    }
};

// Tokens-delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data, callback){
    // Check that the id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
        // Look up the token
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                _data.delete('tokens', id, function(err){
                    if(!err){
                        callback(200);
                    }else{
                        callback(400, {'Error' : 'Could not delete the specified token'});
                    }
                });
            }else{
                callback(400, {'Error' : 'Could not fint the specified token'});
            }
        })

    }else{
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback){
    _data.read('tokens', id, function(err, tokenData){
        if(!err && tokenData){
            // Chech that the token is for the given user and has not expired
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            }else{
                callback(false);
            }
        }else{
            callback(false);
        }
    });
};

// Sample handler
handlers.ping = function(data, callback){
    callback(200);
};

// Not found handler
handlers.notFound = function(data, callback){
    callback(404);
};  

// Container for all checks
handlers.cheks = function(){
    console.log('IM IN');
}

// Export the module
module.exports = handlers;
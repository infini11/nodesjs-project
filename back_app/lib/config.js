/*
*Create and export configuration variables
*
*/

// Container for all the environments
var environments = {};

// Staging (default) environment
environments.staging = {
    'httpPort' : 3000,
    'httpsPort' :3002,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsASecret',
    'twilio' : {
        'accountSid' : '',
        'authToken' : '',
        'fromPhone' : ''
    }
};

// Production environment
environments.production = {
    'httpPort' : 5000,
    'httpsPort' :5001,
    'envName' : 'production',
    'hashingSecret' : 'thisIsAlsoASecret',
    'twilio' : {
        'accountSid' : '',
        'authToken' : '',
        'fromPhone' : ''
    }
};

// Determined which environment was passed as a command-line argument
var currentEnvironement = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : "" ;

// Check that the current environment is on of the environement above, if not default to staging
var environementToExport = typeof(environments[currentEnvironement]) == 'object' ? environments[currentEnvironement] : environments.staging;

// Export the module
module.exports = environementToExport;

// Notes
// NODE_ENV=production node index.js TO run production environment
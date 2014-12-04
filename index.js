// # hichat bootloader
// Orchestrates the loading of hichat
// When run from command line.

var hichat = require('./core'),
    path    = require('path'),
    errors = require('./core/server/errors');


hichat({
    // give me your config.js path
    config: path.resolve(__dirname, 'config.js')
}).catch(function (err) {
    // log for the error and exit
    errors.logErrorAndExit(err, err.context, err.help);
});
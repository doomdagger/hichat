// Module dependencies
var express     = require('express'),
    when        = require('when'),
    semver      = require('semver'),

    config      = require('../shared/config'),
    middleware  = require('./middleware'),
    packageInfo = require('../../package.json'),

    httpServer;


// If we're in development mode, require "when/console/monitor"
// for help in seeing swallowed promise errors, and log any
// stderr messages from bluebird promises.
if (process.env.NODE_ENV === 'development') {
    require('when/monitor/console');
}


function hichatStartMessages() {
    // Tell users if their node version is not supported, and exit
    if (!semver.satisfies(process.versions.node, packageInfo.engines.node)) {
        console.log(
            "\nERROR: Unsupported version of Node".red,
            "\nHichat needs Node version".red,
            packageInfo.engines.node.yellow,
            "you are using version".red,
            process.versions.node.yellow,
            "\nPlease go to http://nodejs.org to get a supported version".green
        );

        process.exit(0);
    }

    // Startup & Shutdown messages
    if (process.env.NODE_ENV === 'production') {
        console.log(
            "Hichat is running...".green,
            "\nYour site is now available on",
            config.url,
            "\nCtrl+C to shut down".grey
        );

        // ensure that Ghost exits correctly on Ctrl+C
        process.removeAllListeners('SIGINT').on('SIGINT', function () {
            console.log(
                "\nHichat has shut down".red,
                "\nYour site is now offline"
            );
            process.exit(0);
        });
    } else {
        console.log(
            ("Hichat is running in " + process.env.NODE_ENV + "...").green,
            "\nListening on",
            config.server.host.yellow + ':' + config.server.port.yellow,
            "\nUrl configured as:",
            config.url,
            "\nCtrl+C to shut down".grey
        );
        // ensure that Ghost exits correctly on Ctrl+C
        process.removeAllListeners('SIGINT').on('SIGINT', function () {
            console.log(
                "\nHichat has shutdown".red,
                "\nHichat was running for",
                Math.round(process.uptime()),
                "seconds"
            );
            process.exit(0);
        });
    }
}


// ## Initializes the application.
// Sets up the express server instance.
// Instantiates the ghost singleton, helpers, routes, middleware, and apps.
// Finally it starts the http server.
function init(server) {
    var deferred = when.defer();

    // If no express instance is passed in
    // then create our own
    if (!server) {
        server = express();
    }

    middleware(server);

    // return the correct mime type for woff filess
    express['static'].mime.define({'application/font-woff': ['woff']});

    httpServer = server.listen(
        config.server.port,
        config.server.host
    );

    httpServer.on('listening', function () {
        hichatStartMessages();
        deferred.resolve(httpServer);
    });

    return deferred.promise;
}

module.exports = init;
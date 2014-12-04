/**
 * Created by Li He on 2014/12/4.
 */
// Setup basic express server
var express     = require('express'),
    socket_io   = require('socket.io'),
    http        = require('http'),
    when        = require('when'),

    middleware  = require('./middleware'),
    config      = require('../shared/config');


function imStartMessages() {
    // Startup & Shutdown messages
    console.log(
        "Instant Messaging System is running...".green,
        "\nYour websocket service is now available on port",
        config.im.port.yellow
    );

    // ensure that Ghost exits correctly on Ctrl+C
    process.removeAllListeners('SIGINT').on('SIGINT', function () {
        console.log(
            "\nInstant Messaging System has shut down".red
        );
        process.exit(0);
    });
}


function init() {
    var deferred = when.defer(),
        app = express(),
        server = http.createServer(app),
        io = socket_io(server);

    middleware(io);

    server.listen(config.im.port, function () {
        imStartMessages();
        deferred.resolve();
    });

    return deferred.promise;
}

module.exports = init;
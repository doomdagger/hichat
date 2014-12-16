

var routes  = require('../routes'),
    setupMiddleware;

setupMiddleware = function (io) {
    io.set('log level', 0);
    io.on('connection', function (socket) {

        routes.user(socket);

    });
};

module.exports = setupMiddleware;
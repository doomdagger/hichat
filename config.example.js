
var path = require('path'),
    config;

config = {
    // ### Development **(default)**
    development: {
        // The url to use when providing links to the site, E.g. in RSS and email.
        url: 'http://hichat.com',

        // server config
        server: {
            // Host to be passed to node's `net.Server#listen()`
            host: '127.0.0.1',
            // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
            port: '1222'
        },

        paths: {
            contentPath: path.join(__dirname, '/content/')
        }
    },

    production: {

    },

    test: {

    }
};

module.exports = config;
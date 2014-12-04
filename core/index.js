// # hichat bootloader

// global variables
var when = require('when'),
    bootstrap = require('./bootstrap');

// env settings
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

function startHichat(options) {
    var deferred = when.defer();

    options = options || {};

    bootstrap(options.config).then(function () {
        try {
            var hichat = require('./server'),
                im     = require('./im');

            return im()
                .then(hichat)
                .then(deferred.resolve)
                .catch(function (e) {
                    deferred.reject(e);
                });
        } catch (e) {
            deferred.reject(e);
        }
    }).catch(deferred.reject);

    return deferred.promise;
}

module.exports = startHichat;
/**
 * Created by Li He on 2014/12/4.
 */
var path        = require('path'),

    express     = require('express'),
    favicon     = require('serve-favicon'),
    logger      = require('morgan'),

    config      = require('../../shared/config'),
    utils       = require('../../shared/utils'),
    expressServer,
    setupMiddleware;

setupMiddleware = function (server) {
    var logging = config.logging,
        subdir = config.paths.subdir,
        contentPath = config.paths.contentPath,
        corePath = config.paths.corePath;

    expressServer = server;

    expressServer.enable('trust proxy');

    if (logging !== false) {
        if (expressServer.get('env') !== 'development') {
            expressServer.use(logger(logging || {}));
        } else {
            expressServer.use(logger(logging || 'dev'));
        }
    }

    expressServer.use(subdir, favicon(contentPath + '/resources/icons/favicon.png'));

    // ### Static assets
    expressServer.use(subdir + '/', express['static'](path.join(contentPath), {maxAge: utils.ONE_YEAR_MS}));
};

module.exports = setupMiddleware;
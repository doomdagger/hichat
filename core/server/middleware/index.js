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
    // built scripts, from vendor or myself
    expressServer.use(subdir + '/scripts', express['static'](path.join(corePath, '/built/scripts'), {maxAge: utils.ONE_YEAR_MS}));
    // public scripts both used by vendor and myself
    expressServer.use(subdir + '/public', express['static'](path.join(corePath, '/built/public'), {maxAge: utils.ONE_YEAR_MS}));
    // static assets
    expressServer.use(subdir + '/', express['static'](path.join(contentPath), {maxAge: utils.ONE_YEAR_MS}));
};

module.exports = setupMiddleware;
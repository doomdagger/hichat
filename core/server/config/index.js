/**
 * 这个模块维护着一个全局的hichatConfig对象
 * @module core/server/config
 * @type {exports}
 */

// General entry point for all configuration data
//
// This file itself is a wrapper for the root level config.js file.
// All other files that need to reference config.js should use this file.
    // platform level import
var path          = require('path'), // built-in path module
    url           = require('url'), // built-in url module
    // dependency level import
    when             = require('when'),   // when - promise implementation
    _             = require('lodash'),  // lodash
    // custom level import
    hichatConfig   = {},
    appRoot, // the root of the project
    corePath, // the core folder
    testingEnvs   = ['testing'],
    defaultConfig = {};

/**
 * 传入一个config对象，用以更新全局的hichatConfig对象，理论上，该方法不应当被重复
 * 调用多次。该方法主要更新config的paths信息，而且还是更新url模块的icollegeConfig对象。
 * @param {Object} config - a config object most likely to be your config.js
 * @returns {{}}
 */
function updateConfig(config) {
    var localPath = '',
        contentPath,
        subdir;

    // Merge passed in config object onto
    // the cached hichatConfig object
    _.merge(hichatConfig, config);

    // must have appRoot and configExample paths
    appRoot       = hichatConfig.paths.appRoot; // the root of the project
    corePath      = path.resolve(appRoot, 'core/'); // the core folder

    // Allow contentPath to be over-written by passed in config object
    // Otherwise default to default content path location
    contentPath = hichatConfig.paths.contentPath || path.resolve(appRoot, 'content');

    // Protect against accessing a non-existant object.
    // This ensures there's always at least a paths object
    // because it's referenced in multiple places.
    hichatConfig.paths = hichatConfig.paths || {};

    // Parse local path location, in config.example.js, url should be http://icollege.com, path should be '/'
    if (hichatConfig.url) {
        localPath = url.parse(hichatConfig.url).path;
        // Remove trailing slash
        if (localPath !== '/') {
            localPath = localPath.replace(/\/$/, '');
        }
    }

    subdir = localPath === '/' ? '' : localPath; // subdir == ''

    _.merge(hichatConfig, {
        paths: {
            'appRoot':          appRoot,
            'subdir':           subdir,
            'config':           hichatConfig.paths.config || path.join(appRoot, 'config.js'),
            'configExample':    hichatConfig.paths.configExample || path.join(appRoot, 'config.example.js'),
            'corePath':         corePath,
            'clientPath':       path.resolve(corePath, 'client/'), // the client folder

            'contentPath':      contentPath,
            'imagesPath':       path.resolve(contentPath, 'images'),
            'imagesRelPath':    'content/images',

            'builtPath':        path.join(corePath, 'built/'),
            'builtScriptPath':  path.join(corePath, 'built/scripts/')
        }
    });

    return hichatConfig;
}

/**
 * should return a promise
 * @param {Object} rawConfig - 此对象应是config.js中的某一个子对象
 * @returns {*}
 */
function initConfig(rawConfig) {

    // Cache the config.js object's environment
    // object so we can later refer to it.
    // Note: this is not the entirety of config.js,
    // just the object appropriate for this NODE_ENV
    hichatConfig = updateConfig(rawConfig);

    return when.resolve(hichatConfig);
}


if (testingEnvs.indexOf(process.env.NODE_ENV) > -1) {
    try {
        defaultConfig  = require('../../../config')[process.env.NODE_ENV] || {};
    } catch (ignore) {/*jslint strict: true */}

    defaultConfig.paths = defaultConfig.paths || {};
    defaultConfig.paths.appRoot = path.resolve(__dirname, '../../../');//app still not bootstrapped, cannot fetch app root from config module
    defaultConfig.paths.configExample = path.join(defaultConfig.paths.appRoot, 'config.example.js');

    hichatConfig = updateConfig(defaultConfig);
}


module.exports = hichatConfig;
module.exports.init = initConfig;

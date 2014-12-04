// load all the configurations

    // platform level import
var fs = require('fs'),
    path = require('path'),
    // dependency level import
    when = require('when'),
    // local module import
    errors = require('./shared/errors'),
    config = require('./shared/config'),
    appRoot = path.resolve(__dirname, '../'),
    configExample = path.join(appRoot, 'config.example.js'),
    configFile;

function readConfigFile(envVal) {
    return require(configFile)[envVal];
}

function writeConfigFile() {
    var written = when.defer();

    fs.exists(configExample, function checkTemplate(templateExists) {
        var read,
            write,
            error;

        if (!templateExists) {
            error = new Error('Could not locate a configuration file.');
            error.context = appRoot;
            error.help = 'Please check your development for config.js or config.example.js.';

            return written.reject(error)
        }

        read = fs.createReadStream(configExample);
        read.on('error', function (err) {
            errors.logError(new Error('Could not open config.example.js for read.'), appRoot, 'Please check your deployment for config.js or config.example.js.');

            return written.reject(err);
        });

        write = fs.createWriteStream(configFile);
        write.on('error', function (err) {
            errors.logError(new Error('Could not open config.js for write.'), appRoot, 'Please check your deployment for config.js or config.example.js.');

            return written.reject(err);
        });

        write.on('finish', written.resolve);

        read.pipe(write);
    });

    return written.promise;
}


function validateConfigEnvironment() {
    var envVal = process.env.NODE_ENV || undefined,
        hasHostAndPort,
        config;

    // read config file from the designated path
    try {
        config = readConfigFile(envVal);
    } catch (e) {
        return when.reject(e);
    }

    if (!config) {
        errors.logError(new Error('Cannot find the configuration for the current NODE_ENV'), 'NODE_ENV=' + envVal,
            'Ensure your config.js has a section for the current NODE_ENV value and is formatted properly.');

        return when.reject(new Error('Unable to load config for NODE_ENV=' + envVal));
    }

    hasHostAndPort = config.server && !!config.server.host && !!config.server.port;

    // Check for valid server host and port values
    if (!config.server || !hasHostAndPort) {
        errors.logError(new Error('Your server values (host and port) in config.js are invalid.'), JSON.stringify(config.server), 'Please provide them before restarting.');

        return when.reject(new Error('invalid server configuration'));
    }

    return when.resolve(config);
}


/**
 * Bootstrap的入口方法，
 * @param configFilePath
 * @returns {*}
 */
function loadConfig(configFilePath) {
    var loaded = when.defer(),
        pendingConfig;

    configFile = configFilePath;

    fs.exists(configFile, function checkConfig(configExists) {
        if (!configExists) {
            pendingConfig = writeConfigFile();
        }

        when(pendingConfig).then(validateConfigEnvironment).then(function (rawConfig) {
            rawConfig.paths = rawConfig.paths || {};

            // add some path info to rawConfig
            rawConfig.paths.appRoot = appRoot;
            rawConfig.paths.configExample = configExample;
            rawConfig.paths.config = configFile;

            return config.init(rawConfig).then(loaded.resolve);
        }).catch(loaded.reject);
    });

    return loaded.promise;
}

module.exports = loadConfig;
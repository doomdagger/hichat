
var _ = require("lodash"),
    colors = require('colors'),
    when = require('when'),

    errors;

colors.setTheme({silly: 'rainbow'});

/**
 * error handling helpers
 */
errors = {

    'throwError': function (err) {
        if (!err) {
            err = new Error("An error occurred");
        }

        if (_.isString(err)) {
            throw new Error(err);
        }

        throw err;
    },

    'rejectError': function (err) {
        return when.reject(err);
    },

    'debug': function (msg, context, help) {
        if ((process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'staging' ||
            process.env.NODE_ENV === 'production')) {

            var msgs = ['\nDebugging:'.yellow, msg.yellow, '\n'];

            if (context) {
                msgs.push(context.white, '\n');
            }

            if (help) {
                msgs.push(help.green);
            }

            // add a new line
            msgs.push('\n');

            console.log.apply(console, msgs);
        }
    },

    'logInfo': function (component, info) {
        if ((process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'staging' ||
            process.env.NODE_ENV === 'production')) {

            var msg = [component.cyan + ':'.cyan, info.cyan];

            console.info.apply(console, msg);
        }
    },

    'logWarn': function (warn, context, help) {
        if ((process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'staging' ||
            process.env.NODE_ENV === 'production')) {

            var msgs = ['\nWarning:'.yellow, warn.yellow, '\n'];

            if (context) {
                msgs.push(context.white, '\n');
            }

            if (help) {
                msgs.push(help.green);
            }

            // add a new line
            msgs.push('\n');

            console.log.apply(console, msgs);
        }
    },

    'logError': function (err, context, help) {
        var self = this,
            origArgs = _.toArray(arguments).slice(1),
            stack,
            msgs;

        if (_.isArray(err)) {
            _.each(err, function (e) {
                var newArgs = [e].concat(origArgs);
                errors.logError.apply(self, newArgs);
            });
            return;
        }

        stack = err ? err.stack : null;

        err = _.isString(err) ? err : (_.isObject(err) ? err.message : 'An unknown error occurred.');

        // TODO: Logging framework hookup
        // Eventually we'll have better logging which will know about envs
        if ((process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'staging' ||
            process.env.NODE_ENV === 'production')) {

            msgs = ['\nERROR:'.red, err.red, '\n'];

            if (context) {
                msgs.push(context.white, '\n');
            }

            if (help) {
                msgs.push(help.green);
            }

            // add a new line
            msgs.push('\n');

            if (stack) {
                msgs.push(stack, '\n');
            }

            console.error.apply(console, msgs);
        }
    },

    'logErrorAndExit': function (err, context, help) {
        this.logError(err, context, help);
        // Exit with 0 to prevent npm errors as we have our own
        process.exit(0);
    },

    'logAndThrowError': function (err, context, help) {
        this.logError(err, context, help);

        this.throwError(err, context, help);
    },

    'logAndRejectError': function (err, context, help) {
        this.logError(err, context, help);

        return this.rejectError(err, context, help);
    }
};

module.exports = errors;
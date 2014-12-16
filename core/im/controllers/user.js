/**
 * Created by lihe9_000 on 2014/12/16.
 */

var _             = require('lodash'),
    errors        = require('../../shared/errors'),
    config        = require('../../shared/config'),
    userControllers,
    users = {};

userControllers = {
    // Route: checkNickname
    // Event: check nickname
    // Data: {nickname: string}
    checkNickname: function (socket) {
        return function (data) {
            var ret;
            if (!users[data.nickname]) {
                ret = {success: true};
            } else {
                ret = {success: false};
            }
            socket.emit("check nickname", ret);
        }
    },

    // Route: initializeUser
    // Event: initialize user
    // Data: {nickname: string, signature: string, avatar: string}
    initializeUser: function (socket) {
        return function (data) {
            if (!data.signature) {
                data.signature = "这个人很懒，什么也没留下";
            }
            if (!data.avatar) {
                data.avatar = "resources/images/default.png";
            }

            users[data.nickname] = data;

            socket.emit('initialize user', {success: true});
        }
    }
};

module.exports = userControllers;
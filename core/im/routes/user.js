/**
 * Created by lihe9_000 on 2014/12/16.
 */
var ss         = require('socket.io-stream'),
    user       = require('../controllers/user'),
    userRoutes;

userRoutes = function (socket) {

    socket.on('check nickname', user.checkNickname(socket));

    socket.on('initialize user', user.initializeUser(socket));

    socket.on('disconnect', user.signOff(socket));

    socket.on('create room', user.createRoom(socket));

    socket.on('join room', user.joinRoom(socket));

    socket.on('leave room', user.leaveRoom(socket));

    socket.on('send text message', user.sendTextMessage(socket));

    ss(socket).on('share file', user.shareFile(socket));

};

module.exports = userRoutes;
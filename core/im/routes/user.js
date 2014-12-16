/**
 * Created by lihe9_000 on 2014/12/16.
 */
var user       = require('../controllers/user'),
    userRoutes;

userRoutes = function (socket) {

    socket.on('check nickname', user.checkNickname(socket));

    socket.on('initialize user', user.initializeUser(socket));

};

module.exports = userRoutes;
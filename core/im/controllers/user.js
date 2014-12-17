/**
 * Created by lihe9_000 on 2014/12/16.
 */

var path          = require('path'),
    fs            = require('fs'),
    _             = require('lodash'),
    bytes         = require('bytes'),
    errors        = require('../../shared/errors'),
    config        = require('../../shared/config'),
    utils         = require('../../shared/utils'),
    userControllers,
    users = {},
    rooms = {};

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
            socket.username = data.nickname;
            socket.avatar = data.avatar;
            socket.rooms = [];
            socket.emit('initialize user', {success: true, users: users, username: data.nickname, avatar: data.avatar});
            socket.broadcast.emit('user join', {user: data});
        }
    },

    // Route: signOff
    // Event: disconnect
    signOff: function (socket) {
        return function () {
            for (var i in socket.rooms) {
                var index = rooms[socket.rooms[i]]['users'].indexOf(socket.username);
                utils.delElByIndex(rooms[socket.rooms[i]]['users'], index);
                socket.leave(socket.rooms[i]);

                if (rooms[socket.rooms[i]]['users'].length==0) {
                    delete rooms[socket.rooms[i]];
                } else {
                    socket.to(socket.rooms[i]).emit("someone leave room", {room: socket.rooms[i], user: socket.username});
                }
            }
            if (users) {
                delete users[socket.username];

                socket.broadcast.emit('user leave', {nickname: socket.username});
            }
        }
    },

    // Route: createRoom
    // Event: create room
    // Data: {name: string, password: string(optional)}
    createRoom: function (socket) {
        return function (data) {
            if (rooms[data.name]) {
                socket.emit('create room', {success: false, message: "以此名字命名的房间已存在"});
            } else {
                if (data.password) {
                    rooms[data.name] = {password: data.password, users: [socket.username]};
                } else {
                    rooms[data.name] = {users: [socket.username]};
                }
                socket.join(data.name);
                socket.rooms.push(data.name);
                socket.emit('create room', {success: true, room: data.name});
            }
        }
    },

    // Route: joinRoom
    // Event: join room
    // Data: {name: string, password: string(if required)}
    joinRoom: function (socket) {
        return function (data) {
            if (rooms[data.name]) {
                if (rooms[data.name]['password'] == data.password) {

                    rooms[data.name]['users'].push(socket.username);
                    socket.to(data.name).emit("someone join room", {room: data.name, user: users[socket.username]});
                    socket.join(data.name);

                    var roomUsers = {};
                    for (var item in rooms[data.name]['users']) {
                        roomUsers[rooms[data.name]['users'][item]] = users[rooms[data.name]['users'][item]];
                    }
                    socket.rooms.push(data.name);
                    socket.emit('join room', {success: true, room: data.name, users: roomUsers});
                } else {
                    socket.emit('join room', {success: false, message: "该房间需要密码或所提供的密码不正确"});
                }
            } else {
                socket.emit('join room', {success: false, message: "该房间不存在"});
            }
        }
    },

    // Route: leaveRoom
    // Event: leave room
    // Data: {name: string}
    leaveRoom: function (socket) {
        return function (data) {
            var index = rooms[data.name]['users'].indexOf(socket.username);
            utils.delElByIndex(rooms[data.name]['users'], index);
            socket.leave(data.name);

            if (rooms[data.name]['users'].length==0) {
                delete rooms[data.name];
            } else {
                socket.to(data.name).emit("someone leave room", {room: data.name, user: socket.username});
            }

            index = socket.rooms.indexOf(data.name);
            utils.delElByIndex(socket.rooms, index);
            socket.emit("leave room", {success: true, room: data.name});

        }
    },

    // Route: sendTextMessage
    // Event: send text message
    // Data: {room: string, nickname: string, avatar: string, content: string}
    sendTextMessage: function (socket) {
        return function (data) {
            if(data.room == 'default-room') {
                socket.broadcast.emit('receive text message', data);
            }else {
                socket.to(data.room).emit('receive text message', data);
            }
            socket.emit('send text message', data);
        }
    },

    // Route: shareFile
    // Event: share file
    // Data: {room: string, nickname: string, avatar: string, content: object}
    shareFile: function (socket) {
        return function (stream, data) {
            var filePath = path.join(config.paths.contentPath, 'upload/shared', data.room, data.content.name),
                dirPath = path.dirname(filePath);

            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath);
            }


            stream.on('end', function () {
                data.content = {name: data.content.name, type: data.content.type, size: bytes(data.content.size), link: "upload/shared/"+data.room+"/"+data.content.name};

                socket.emit('share file', data);
                if (data.room == 'default-room') {
                    socket.broadcast.emit('receive file message', data);
                } else {
                    socket.to(data.room).emit('receive file message', data);
                }
            });

            stream.pipe(fs.createWriteStream(filePath));
        }
    }

};

module.exports = userControllers;
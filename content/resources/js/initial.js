/**
 * Created by Li He on 2014/12/15.
 */
var socket = io('http://127.0.0.1:27100/'),
    ready = false,
    mediaStream = null,
    recordAudio = null;

socket.on('connect', function () {

    socket.on('check nickname', function (data) {
        if (data.success) {
            $('#initial-submit-button').removeClass('disabled');
            var message = $('.initial-message');
            if (message.html()) {
                if (message.hasClass('error')) {
                    message.remove();
                    $('.ui.error.form.segment').prepend(initialAlertMessage('昵称可以使用', '您的昵称还没被占用，可以使用', 'green'));
                }
            } else {
                $('.ui.error.form.segment').prepend(initialAlertMessage('昵称可以使用', '您的昵称还没被占用，可以使用', 'green'));
            }
        } else {
            $('.initial-message').remove();
            $('.ui.error.form.segment').prepend(initialAlertMessage('昵称已被占用', '请您更换一个昵称', 'error'));
            $('#initial-submit-button').addClass('disabled');
        }
    });

    socket.on('initialize user', function (data) {
        ready = true;
        socket.username = data.username;
        socket.avatar = data.avatar;

        $('#initial').modal('hide');

        if (data.success) {
            $('#my-avatar').attr('src', data.users[socket.username]["avatar"]);
            $('#my-signature').text(data.users[socket.username]["signature"]);
            $('#my-nickname').prepend(data.users[socket.username]["nickname"]);

            $('#default-room .user-list').append(userCard(socket.username, data.users[socket.username].avatar));

            for (var user in data.users) {
                if (user === socket.username) {
                    continue;
                }
                $('#default-room .user-list').append(userCard(user, data.users[user].avatar));
            }
        }
    });

    socket.on('user join', function (data) {
        if (ready)
            $('#default-room .user-list').append(userCard(data.user.nickname, data.user.avatar));
    });

    socket.on('user leave', function (data) {
        if (ready)
            $('.' + data.nickname + '-card').remove();
    });

    socket.on('create room', function (data) {
        if (data.success) {
            $('#new-room').modal('hide');

            roomSuite(data.room, null, {nickname: socket.username, avatar: socket.avatar});
        } else {
            $('#new-room .content').prepend(initialAlertMessage("创建房间失败", data.message, 'error'));
        }
    });

    socket.on('join room', function (data) {
        if (data.success) {
            $('#join-room').modal('hide');

            roomSuite(data.room, data.users, {nickname: socket.username, avatar: socket.avatar});
        } else {
            $('#join-room .content').prepend(initialAlertMessage("加入房间失败", data.message, 'error'));
        }
    });

    socket.on('leave room', function (data) {
        var roomName = data.room;

        selectRoom('default-room');

        $("#room-list a[data-bind='" + roomName + "']").remove();
        $("#" + roomName).remove();
    });

    socket.on('someone join room', function (data) {
        $('#' + data.room + ' .user-list').append(userCard(data.user.nickname, data.user.avatar));
    });

    socket.on('someone leave room', function (data) {
        $('#' + data.room + ' .' + data.user + '-card').remove();
    });

    socket.on('send text message', function (data) {
        $('#' + data.room + ' .message-field').val('');
        addTextMessageToRoom(data.room, data, true);
    });

    socket.on('receive text message', function (data) {
        addTextMessageToRoom(data.room, data, false);
    });

    socket.on('share file', function (data) {
        var roomName = data.room,
            progressBar = $('#' + roomName + " .progress");
        progressBar.progress({percent: 100});
        progressBar.hide(400);
        $('#file').val('');

        addFileMessageToRoom(roomName, data, true);
    });

    socket.on('receive file message', function (data) {
        var roomName = data.room;

        addFileMessageToRoom(roomName, data, false);
    });

    socket.on('send audio message', function (data) {
        var roomName = data.room;

        addAudioMessageToRoom(roomName, data);
    });

    socket.on('receive audio message', function (data) {
        var roomName = data.room;

        addAudioMessageToRoom(roomName, data);
    });
});

$('#nickname-field').on('keyup', function () {
    var value = $(this).val();
    if (!!value) {
        socket.emit('check nickname', {nickname: value});
    } else {
        $('.initial-message').remove();
        $('.ui.error.form.segment').prepend(initialAlertMessage('请填写昵称', '昵称为必填项', 'error'));
        $('#initial-submit-button').addClass('disabled');
    }
});

$('#initial-submit-button').on('click', function () {
    var nickname = $('#nickname-field').val(),
        signature = $('#signature-field').val(),
        avatar = $('#avatar-field').val();

    socket.emit('initialize user', {nickname: nickname, signature: signature, avatar: avatar});
});

$('#new-room .green').on('click', function () {
    var name = $('#new-room .room-name').val(),
        password = $('#new-room .room-password').val();

    $("#new-room .initial-message").remove();

    if (name) {
        socket.emit("create room", {name: name, password: password});
    } else {
        $('#new-room .content').prepend(initialAlertMessage("创建房间失败", "房间名称不得为空", 'error'));
    }
});

$('#new-room .black').on('click', function () {
    $('#new-room').modal('hide');
});

$('#join-room .black').on('click', function () {
    $('#join-room').modal('hide');
});

$('#join-room .green').on('click', function () {
    var name = $('#join-room .room-name').val(),
        password = $('#join-room .room-password').val();

    $("#join-room .initial-message").remove();

    if (name) {
        if (password) {
            socket.emit("join room", {name: name, password: password});
        } else {
            socket.emit("join room", {name: name});
        }
    } else {
        $('#join-room .content').prepend(initialAlertMessage("加入房间失败", "房间名称不得为空", 'error'));
    }

});

$(document).on("click", ".leave-button", function () {
    var roomName = $(this).attr('data-bind');

    socket.emit('leave room', {name: roomName});
});

$(document).on("click", "#room-list .item", function () {
    var roomName = $(this).attr('data-bind');

    selectRoom(roomName);
});

$(document).on("click", ".send-button", function () {
    var roomName = $(this).attr('data-bind');

    var content = $('#' + roomName + ' .message-field').val();

    socket.emit('send text message', {
        room: roomName,
        nickname: socket.username,
        avatar: socket.avatar,
        content: content
    });
});

$(document).on("keypress", ".message-field", function (event) {
    if (event.which == 13) {
        var roomName = $(this).attr('data-bind');

        var content = $(this).val();

        socket.emit('send text message', {
            room: roomName,
            nickname: socket.username,
            avatar: socket.avatar,
            content: content
        });
    }
});

$(document).on("click", ".record-button", function () {
    var roomName = $(this).attr('data-bind');


    if ($(this).hasClass('loading')) {
        // now as stop button
        recordAudio.stopRecording(function () {
            // get audio data-URL
            recordAudio.getDataURL(function (audioDataURL) {
                var data = {
                    room: roomName,
                    nickname: socket.username,
                    avatar: socket.avatar,
                    content: {
                        type: recordAudio.getBlob().type || 'audio/wav',
                        dataURL: audioDataURL
                    }
                };
                socket.emit('send audio message', data);
                if (mediaStream) mediaStream.stop();
            });
        });
    } else {
        // now as start button
        navigator.getUserMedia({
            audio: true,
            video: false
        }, function (stream) {
            mediaStream = stream;
            recordAudio = RecordRTC(stream);
            recordAudio.startRecording();
        }, function (error) {
            alert(JSON.stringify(error));
        });
    }

    $(this).toggleClass('red loading');

});

$(document).on("click", ".share-button", function () {
    var roomName = $(this).attr('data-bind');
    var fileInput = $('#file');
    fileInput.attr('data-bind', roomName);
    fileInput.click();
});

$('#file').change(function (e) {
    var file = e.target.files[0],
        stream = ss.createStream(),
        roomName = $(this).attr('data-bind'),
        progressBar = $('#' + roomName + " .progress");

    $(this).attr('data-bind', '');

    ss(socket).emit('share file', stream, {
        room: roomName,
        nickname: socket.username,
        avatar: socket.avatar,
        content: {name: file.name, size: file.size, type: file.type}
    });

    progressBar.progress({percent: 0});
    progressBar.show();

    var blobStream = ss.createBlobReadStream(file);
    var size = 0;

    blobStream.on('data', function (chunk) {
        size += chunk.length;
        progressBar.progress({
            percent: Math.floor(size / file.size * 100)
        });
    });

    blobStream.pipe(stream);
});

$(document).on("click", ".video-button", function () {
    var roomName = $(this).attr('data-bind');

    window.open('http://localhost:8888/'+roomName);
});


// ************************ html snipeet ********************

function userCard(nickname, avatar) {
    return ['<div class="card ' + nickname + '-card" style="width: 115px">',
        '<div class="ui slide masked reveal image">',
        '<img style="width: 115px;height: 115px;" src="' + avatar + '" class="visible content">',
        '</div>',
        '<div class="content">',
        '<div class="meta">' + nickname + '</div>',
        '</div>',
        '</div>'
    ].join('');
}

function initialAlertMessage(title, content, style) {
    return ['<div class="ui ' + style + ' message initial-message">',
        '<div class="header">' + title + '</div>',
        '<p>' + content + '</p>',
        '</div>'
    ].join('');
}

function roomSuite(roomName, users, me) {
    //reset room list
    $('#room-list .active').removeClass('active');
    $('#room-list .teal').removeClass('teal');
    $('#room-list').append(['<a id="' + roomName + '-item" class="active blue item" data-bind="' + roomName + '">',
        '<div class="ui teal label">0</div>',
        '<i class="chat icon"></i>',
        roomName,
        '</a>'].join(''));

    //reset room area
    $('#room-area').children().hide();
    var newRoom = $('#backup-empty-room').clone();

    newRoom.attr("id", roomName);
    newRoom.contents().find(".leave-button").attr('data-bind', roomName);
    newRoom.contents().find(".send-button").attr('data-bind', roomName);
    newRoom.contents().find(".message-field").attr('data-bind', roomName);
    newRoom.contents().find(".record-button").attr('data-bind', roomName);
    newRoom.contents().find(".share-button").attr('data-bind', roomName);
    newRoom.contents().find(".audio-button").attr('data-bind', roomName);
    newRoom.contents().find(".video-button").attr('data-bind', roomName);


    $('#room-area').append(newRoom);

    fillRoomWithUsers(roomName, users, me);

    newRoom.show();
}

function fillRoomWithUsers(roomName, users, me) {
    $('#' + roomName + ' .user-list').append(userCard(me.nickname, me.avatar));

    for (var user in users) {
        if (user === me.nickname) {
            continue;
        }
        $('#' + roomName + ' .user-list').append(userCard(user, users[user].avatar));
    }
}

function selectRoom(roomName) {
    $('#room-list .active').removeClass('active');
    $('#room-list .teal').removeClass('teal');
    $('#room-area').children().hide();

    $("#room-list a[data-bind='" + roomName + "']").addClass("active");
    $("#room-list a[data-bind='" + roomName + "']").contents().find('.label').addClass('teal');
    $('#' + roomName).show();
}

function addTextMessageToRoom(roomName, data, selfMessage) {
    $('#' + roomName + ' .message-panel').append(['<div class="ui comments" style="margin-top: 10px;margin-bottom: 10px">',
        '<div class="comment"><a class="avatar" style="margin-top: 12px">',
        '<img class="ui avatar image" src="' + data.avatar + '">',
        '</a><div class="content" style="margin-left: 48px">',
        '<span class="author">' + data.nickname + '</span>',
        '<div style="margin-top: 5px" class="ui ' + ((selfMessage) ? 'blue' : 'yellow') + ' small message">' + data.content + '</div>',
        '</div></div></div>'].join(''));
}

function addFileMessageToRoom(roomName, data, selfMessage) {
    $('#' + roomName + ' .message-panel').append(['<div class="ui comments" style="margin-top: 10px;margin-bottom: 10px">',
        '<div class="comment"><a class="avatar" style="margin-top: 12px">',
        '<img class="ui avatar image" src="' + data.avatar + '">',
        '</a><div class="content" style="margin-left: 48px">',
        '<span class="author">' + data.nickname + '</span>',
        '<div style="margin-top: 5px" class="ui icon ' + ((selfMessage) ? 'blue' : 'yellow') + ' small message">',
        '<i class="file icon"></i><div class="content"><div class="header">',
        '<a target="_blank" href="' + data.content.link + '">' + data.content.name + '</a></div>',
        '<p>文件大小：<b>' + data.content.size + '</b>  文件类型：<b>' + data.content.type + '</b></p>',
        '</div></div></div></div></div>'].join(''));
}


function addAudioMessageToRoom(roomName, data) {
    $('#' + roomName + ' .message-panel').append(['<div class="ui comments" style="margin-top: 10px;margin-bottom: 10px">',
        '<div class="comment"><a class="avatar" style="margin-top: 12px">',
        '<img class="ui avatar image" src="' + data.avatar + '">',
        '</a><div class="content" style="margin-left: 48px">',
        '<span class="author">' + data.nickname + '</span>',
        '<br><audio controls src="'+data.content.link+'"></audio>',
        '</div></div></div>'].join(''));

    var area = document.getElementById('area');
    $(area).append('<p><audio id="camera-preview" controls loop src="'+href+'"></audio><p>');
}
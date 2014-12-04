// Last time updated at July 07, 2014, 19:21:23

// Muaz Khan      - www.MuazKhan.com
// MIT License    - www.WebRTC-Experiment.com/licence
// Experiments    - github.com/muaz-khan/WebRTC-Experiment
// RecordRTC      - github.com/muaz-khan/WebRTC-Experiment/tree/master/RecordRTC

// RecordRTC over Socket.io - github.com/muaz-khan/WebRTC-Experiment/tree/master/RecordRTC/RecordRTC-over-Socketio
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    uuid = require('node-uuid'),
    port = process.argv[2] || 8888;

// start server, handle index.html page
var app = http.createServer(function (request, response) {

    var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd(), uri);

    fs.exists(filename, function (exists) {
        if (!exists) {
            response.writeHead(404, {
                "Content-Type": "text/plain"
            });
            response.write('404 Not Found: ' + filename + '\n');
            response.end();
            return;
        }

        if (fs.statSync(filename).isDirectory()) filename += '/index.html';

        fs.readFile(filename, 'binary', function (err, file) {
            if (err) {
                response.writeHead(500, {
                    "Content-Type": "text/plain"
                });
                response.write(err + "\n");
                response.end();
                return;
            }

            response.writeHead(200);
            response.write(file, 'binary');
            response.end();
        });
    });
}).listen(parseInt(port, 10));

// webrtc record audio start here~
var exec = require('child_process').exec;

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
    socket.on('message', function (data) {
        var fileName = uuid.v4();
        
        socket.emit('ffmpeg-output', 0);

        writeToDisk(data.audio.dataURL, fileName + '.wav');

        socket.emit('merged', fileName + '.wav')
    });
});

function writeToDisk(dataURL, fileName) {
    var fileExtension = fileName.split('.').pop(),
        fileRootNameWithBase = './uploads/' + fileName,
        filePath = fileRootNameWithBase,
        fileID = 2,
        fileBuffer;

    // @todo return the new filename to client
    while (fs.existsSync(filePath)) {
        filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
        fileID += 1;
    }

    dataURL = dataURL.split(',').pop();
    fileBuffer = new Buffer(dataURL, 'base64');
    fs.writeFileSync(filePath, fileBuffer);

    console.log('filePath', filePath);
}
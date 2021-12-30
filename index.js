var express = require('express');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const UPLOADED_FILES_DIR_NAME = 'uploaded_videos';
const CONVERTED_FILES_DIR_NAME = 'output';
const UPLOADED_FILES_DIR_PATH = __dirname + '/' + UPLOADED_FILES_DIR_NAME;
const CONVERTED_FILES_DIR_PATH = __dirname + '/' + CONVERTED_FILES_DIR_NAME;
const CONVERTED_FILES_POSTFIX = '_out';

const app = express();
const port = 5000;


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded());

app.get('/', function(req, res) {
    res.sendFile('index.html', { root: __dirname });
})


var uploadedVideoPath;

app.post('/upload-video', function(req, res) {
    if (!fs.existsSync(UPLOADED_FILES_DIR_PATH)) {
        fs.mkdirSync(UPLOADED_FILES_DIR_PATH);
    }

    var form = new formidable.IncomingForm({
        uploadDir: UPLOADED_FILES_DIR_PATH,
        keepExtensions: true
    });

    form.parse(req);

    form.on('file', function(name, file) {
        var fileOldPath = file.filepath;
        var fileNewPath = UPLOADED_FILES_DIR_PATH + '/' + file.originalFilename;

        fs.rename(fileOldPath, fileNewPath, function(err) {
            if (err) throw err;
            uploadedVideoPath = fileNewPath;
        });

        res.status(200).send();
    });
});

app.post('/save-just-trimmed', function(req, res) {
    if (!fs.existsSync(CONVERTED_FILES_DIR_PATH)) {
        fs.mkdirSync(CONVERTED_FILES_DIR_PATH);
    }

    var uploadedVideoExtension = path.extname(uploadedVideoPath);
    var outputFileName = path.basename(uploadedVideoPath, uploadedVideoExtension) +
        CONVERTED_FILES_POSTFIX +
        uploadedVideoExtension;
    var outputFilePath = CONVERTED_FILES_DIR_PATH + '/' + outputFileName;

    var startTime = req.body.startTime;
    var duration = req.body.endTime - startTime;

    ffmpeg(uploadedVideoPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputFilePath)
        .on('end', function(err) {
            if (!err) { console.log('Conversion Done') }
        })
        .on('error', function(err) {
            console.log('error: ', err)
        }).run();

    res.status(200).send();
});

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});
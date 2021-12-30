var express = require('express');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const UPLOADED_FILES_DIR_NAME = 'uploaded_videos';
const UPLOADED_FILES_DIR_PATH = __dirname + '/' + UPLOADED_FILES_DIR_NAME;
const CONVERTED_FILES_DIR_NAME = 'output';
const CONVERTED_FILES_DIR_PATH = __dirname + '/' + CONVERTED_FILES_DIR_NAME;
const CONVERTED_FILES_POSTFIX = 'out';
const TRIMMED_VIDEO_POSTFIX = 'trimmed';
const CROPPED_VIDEO_POSTFIX = 'cropped';

const app = express();
const port = 5000;


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded());

app.get('/', function(req, res) {
    res.sendFile('index.html', { root: __dirname });
})


var uploadedVideoPath;

function getOutputFilePath(inputFilePath, postfix) {
    var inputFileExtension = path.extname(inputFilePath);
    var outputFileName = path.basename(inputFilePath, inputFileExtension) +
        '_' + postfix +
        '_' + Date.now() + inputFileExtension;
    return CONVERTED_FILES_DIR_PATH + '/' + outputFileName;
}

function createDirIfNotExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
}

app.post('/upload-video', function(req, res) {
    createDirIfNotExists(UPLOADED_FILES_DIR_PATH);

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
    createDirIfNotExists(CONVERTED_FILES_DIR_PATH);
    var outputFilePath = getOutputFilePath(uploadedVideoPath, TRIMMED_VIDEO_POSTFIX);

    var startTime = req.body.startTime;
    var duration = req.body.endTime - startTime;

    ffmpeg(uploadedVideoPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputFilePath)
        .on('end', function(err) {
            if (!err) { console.log('Trimmed successfully!') }
        })
        .on('error', function(err) {
            console.log('error: ', err)
        }).run();

    res.status(200).send();
});


app.post('/save-just-cropped', function(req, res) {
    console.log("crop, input file path: " + uploadedVideoPath);
    createDirIfNotExists(CONVERTED_FILES_DIR_PATH);
    var outputFilePath = getOutputFilePath(uploadedVideoPath, CROPPED_VIDEO_POSTFIX);

    ffmpeg(uploadedVideoPath)
        .videoFilters(`crop=${req.body.croppedWidth}:${req.body.croppedHeight}:${req.body.x}:${req.body.y}`)
        .on('end', function(err) {
            if (!err) { console.log('Cropped successfully!') }
        })
        .on('error', function(err) {
            if (!err) { console.log('Cropping error') }
        })
        .output(outputFilePath)
        .run();

    res.status(200).send();
});


app.post('/save-as-webp', function(req, res) {
    createDirIfNotExists(CONVERTED_FILES_DIR_PATH);
    res.status(200).send();
});


app.post('/save-as-gif', function(req, res) {
    createDirIfNotExists(CONVERTED_FILES_DIR_PATH);
    res.status(200).send();
});



app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});
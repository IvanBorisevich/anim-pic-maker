const express = require('express');
const path = require('path');
var fs = require('fs');
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const multer = require('multer');

const { exec } = require("child_process");

const UPLOADED_FILES_DIR_NAME = 'uploads';
const CONVERTED_FILES_DIR_NAME = 'output';
const CONVERTED_FILES_DIR_PATH = __dirname + '/' + CONVERTED_FILES_DIR_NAME;
const CONVERTED_FILES_POSTFIX = 'out';
const TRIMMED_VIDEO_POSTFIX = 'trimmed';
const CROPPED_VIDEO_POSTFIX = 'cropped';

const app = express();
const port = 5000;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './' + UPLOADED_FILES_DIR_NAME);
    },
    filename: (req, file, cb) => {
        cb(null, `${file.originalname}`);
    }
});

const upload = multer({ storage });


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/index.html')));


var uploadedVideoPath;

function getOutputFilePath(inputFilePath, postfix, outputExt = null) {
    var inputFileExtension = path.extname(inputFilePath);
    var outputFileExtension = outputExt != null ? '.' + outputExt : inputFileExtension;
    var outputFileName = path.basename(inputFilePath, inputFileExtension) +
        '_' + postfix +
        '_' + Date.now() + outputFileExtension;
    return CONVERTED_FILES_DIR_PATH + '/' + outputFileName;
}

function createDirIfNotExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
}

app.post('/upload-video', upload.single('file'), (req, res) => {
    res.status(200).send('file uploaded');
});


app.post('/save-just-trimmed', function(req, res) {
    createDirIfNotExists(CONVERTED_FILES_DIR_PATH);
    var outputFilePath = getOutputFilePath(uploadedVideoPath, TRIMMED_VIDEO_POSTFIX);

    var startTimeInSec = req.body.trimStartTime;
    var durationInSec = req.body.trimEndTime - startTime;

    ffmpeg(uploadedVideoPath)
        .setStartTime(startTimeInSec)
        .setDuration(durationInSec)
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
    createDirIfNotExists(CONVERTED_FILES_DIR_PATH);
    var outputFilePath = getOutputFilePath(uploadedVideoPath, CROPPED_VIDEO_POSTFIX);

    ffmpeg(uploadedVideoPath)
        .videoFilters(`crop=${req.body.croppedWidth}:${req.body.croppedHeight}:${req.body.croppedX}:${req.body.croppedY}`)
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
    var outputFilePath = getOutputFilePath(uploadedVideoPath, CONVERTED_FILES_POSTFIX, 'webp');

    var loopFlag = req.body.isLooped ? 0 : 1;
    var cropX = req.body.croppedX;
    var cropY = req.body.croppedY;
    var cropW = req.body.croppedWidth;
    var cropH = req.body.croppedHeight;
    var trimA = req.body.trimStartTime;
    var trimB = req.body.trimEndTime;
    var framerate = req.body.framerate;
    var quality = req.body.qualityPercentage;
    var concatReversed = req.body.concatReversed;

    var command;
    if (concatReversed) {
        command =
            `ffmpeg -ss ${trimA} -to ${trimB} -i ${uploadedVideoPath} \\
            -filter_complex "reverse,fifo[r];[0:v][r] concat=n=2:v=1,crop=${cropW}:${cropH}:${cropX}:${cropY},fps=${framerate}[v]" -map "[v]" \\
            -vcodec libwebp -preset default -an -vsync 0 -loop ${loopFlag} -qscale ${quality} ${outputFilePath}`;
    } else {
        command =
            `ffmpeg -ss ${trimA} -to ${trimB} -i ${uploadedVideoPath} \\
            -vf "crop=${cropW}:${cropH}:${cropX}:${cropY},fps=${framerate}" \\
            -vcodec libwebp -preset default -an -vsync 0 -loop ${loopFlag} -qscale ${quality} ${outputFilePath}`;
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`Success! Stdout: ${stdout}`);
    });

    res.status(200).send();
});


app.post('/save-as-gif', function(req, res) {
    createDirIfNotExists(CONVERTED_FILES_DIR_PATH);
    res.status(200).send();
});



app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});
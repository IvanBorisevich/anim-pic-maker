var express = require('express');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const { exec } = require("child_process");

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

    var command =
        `ffmpeg -i ${uploadedVideoPath} -vcodec libwebp -preset default -loop ${loopFlag} -an -vsync 0 \\
    -vf "scale=(iw*sar)*max(${cropW}/(iw*sar)\\,${cropH}/ih):ih*max(${cropW}/(iw*sar)\\,${cropH}/ih),crop=${cropW}:${cropH}:${cropX}:${cropY},trim=${trimA}:${trimB},fps=${framerate}" \\
    -qscale ${quality} ${outputFilePath}`;

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
var express = require('express');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const UPLOADED_FILES_DIR_NAME = 'uploaded_videos';
const UPLOADED_FILES_DIR_PATH = __dirname + '/' + UPLOADED_FILES_DIR_NAME;

const app = express();
const port = 5000;


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded());

app.get('/', function(req, res) {
    res.sendFile('index.html', { root: __dirname });
})

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
        });

        res.status(200).send();
    });
});

app.post('/save-just-trimmed', function(req, res) {
    console.log("Video trim function is called");
});

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});
const SLIDERS_MIN_VALUE = 0;
const SLIDERS_MAX_VALUE = 100;

class VideoPlayer {

    constructor() {
        this.VideoActions = {
            PLAY: 'Play',
            PAUSE: 'Pause'
        };
        this.video = document.getElementById("my-video");
        this.playPauseButton = $("#play-pause-button");
        this.playerSlider = $("#player-slider");
        this.cropperContainer = $("#crop-selector-container");
        this.cropper = $("#resizable");
        this.cropper.hide();

        this.playerSliderValue = parseInt(this.playerSlider.attr("value") || SLIDERS_MIN_VALUE);
        this.isVideoTimeChangedFromOutside = false;
    }

    isVideoPaused() {
        return this.playPauseButton.text().trim() == this.VideoActions.PLAY;
    }

    isVideoPlayed() {
        return this.playPauseButton.text().trim() == this.VideoActions.PAUSE;
    }

    setPlayerSliderValue(playerSliderValue) {
        this.playerSliderValue = playerSliderValue;
    }

    getPlayerSliderValue() {
        return this.playerSliderValue;
    }

    playVideo() {
        this.video.play();
    }

    pauseVideo() {
        this.video.pause();
    }

    movePlayerSliderFromOutside(newPlayerSliderValue, pauseVideo = true) {
        this.isVideoTimeChangedFromOutside = true;
        this.movePlayerSlider(newPlayerSliderValue, pauseVideo);
        this.updatePlayerSliderProgressCSS();
    }

    movePlayerSlider(newPlayerSliderValue, pauseVideo = true) {
        this.setPlayerSliderValue(newPlayerSliderValue);
        if (this.isVideoPlayed() && pauseVideo) {
            this.pauseVideo();
            this.setPlayPauseButtonText(this.VideoActions.PLAY);
        }
        this.setVideoCurrentTime(this.calcVideoCurrentTimeByPlayerSliderValue());
    }

    loadVideo(file) {
        'use strict';
        var URL = window.URL || window.webkitURL;
        var type = file.type;
        var canPlay = this.video.canPlayType(type);
        if (canPlay === '') canPlay = 'no';
        var isError = canPlay === 'no';

        if (isError) {
            console.log("Error during video play");
            return;
        }

        var fileURL = URL.createObjectURL(file);
        this.video.src = fileURL;

        if (videoPlayer.video.readyState >= 2) {
            this.onMetadataLoaded();
        }
    }

    onMetadataLoaded() {
        this.cropper.show();

        var videoWidth = this.video.videoWidth;
        var videoHeight = this.video.videoHeight;
        var videoRatio = videoWidth / videoHeight;

        var cropperContainerWidth = this.video.offsetWidth;
        var cropperContainerHeight = this.video.offsetHeight;
        var cropperContainerRatio = cropperContainerWidth / cropperContainerHeight;
        var cropperContainerMargin = {};

        if (cropperContainerRatio > videoRatio) {
            cropperContainerWidth = cropperContainerHeight * videoRatio;
            var cropperContainerHorizontalMargin = (this.video.offsetWidth - cropperContainerWidth) / 2;
            cropperContainerMargin.left = cropperContainerHorizontalMargin;
            cropperContainerMargin.right = cropperContainerHorizontalMargin;
        } else {
            cropperContainerHeight = cropperContainerWidth / videoRatio;
            var cropperContainerVerticalMargin = (this.video.offsetHeight - cropperContainerHeight) / 2;
            cropperContainerMargin.top = cropperContainerVerticalMargin;
            cropperContainerMargin.bottom = cropperContainerVerticalMargin;
        }

        this.cropperContainerParams = {
            maxWidth: cropperContainerWidth,
            width: cropperContainerWidth,
            maxHeight: cropperContainerHeight,
            height: cropperContainerHeight,
            margin: cropperContainerMargin
        }

        this.cropperParams = {
            maxWidth: cropperContainerWidth,
            width: cropperContainerWidth,
            maxHeight: cropperContainerHeight,
            height: cropperContainerHeight,
            margin: {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            }
        }

        this.alignCropperElementWithVideo(this.cropper, this.cropperParams);
        this.alignCropperElementWithVideo(this.cropperContainer, this.cropperContainerParams);
    }

    onPlayPauseButtonClick() {
        this.isVideoTimeChangedFromOutside = false;
        if (this.isVideoPaused()) {
            this.playVideo();
            this.setPlayPauseButtonText(this.VideoActions.PAUSE);
        } else if (this.isVideoPlayed()) {
            this.pauseVideo();
            this.setPlayPauseButtonText(this.VideoActions.PLAY);
        }
    }

    onPlayerSliderValueChange(newPlayerSliderValue, pauseVideo = true) {
        this.isVideoTimeChangedFromOutside = false;
        this.movePlayerSlider(newPlayerSliderValue, pauseVideo);
    }

    onVideoTimeUpdate() {
        if (!this.isVideoTimeChangedFromOutside) {
            this.playerSliderValue = this.calcPlayerSliderValueByVideoCurrentTime();
            this.updatePlayerSliderProgressCSS();
        }
    }

    onVideoFinish() {
        this.playerSliderValue = SLIDERS_MIN_VALUE;
        this.setPlayPauseButtonText(this.VideoActions.PLAY);
        this.updatePlayerSliderProgressCSS();
    }

    onCropperResize(resizeParams) {
        this.cropperParams = {
            width: resizeParams.size.width,
            height: resizeParams.size.height,
            margin: {
                left: resizeParams.position.left,
                right: this.cropperContainerParams.width - resizeParams.position.left - resizeParams.size.width,
                top: resizeParams.position.top,
                bottom: this.cropperContainerParams.height - resizeParams.position.top - resizeParams.size.height
            }
        };
    }

    alignCropperElementWithVideo(cropperElement, cropperElementParams) {
        cropperElement.css({
            width: cropperElementParams.width + 'px',
            maxWidth: cropperElementParams.maxWidth + 'px',
            height: cropperElementParams.height + 'px',
            maxHeight: cropperElementParams.maxHeight + 'px',
            marginLeft: cropperElementParams.margin.left + 'px',
            marginRight: cropperElementParams.margin.right + 'px',
            marginTop: cropperElementParams.margin.top + 'px',
            marginBottom: cropperElementParams.margin.bottom + 'px'
        });
    }

    updatePlayerSliderProgressCSS() {
        this.playerSlider.next().find('.asRange-selected').css({
            width: this.playerSliderValue + "%"
        });
        this.playerSlider.next().find('.asRange-pointer').css({
            left: this.playerSliderValue + "%"
        });
    }

    setPlayPauseButtonText(text) {
        this.playPauseButton.html(text);
    }

    setVideoCurrentTime(currentTime) {
        this.video.currentTime = currentTime;
    }

    calcVideoCurrentTimeByPlayerSliderValue() {
        return this.video.duration * this.playerSliderValue / 100;
    }

    calcPlayerSliderValueByVideoCurrentTime() {
        return this.video.currentTime / this.video.duration * 100;
    }

    cropVideo() {

    }
}


var videoPlayer = new VideoPlayer();

videoPlayer.video.onended = () => {
    videoPlayer.onVideoFinish();
};

videoPlayer.video.ontimeupdate = () => {
    videoPlayer.onVideoTimeUpdate();
};

videoPlayer.video.onloadedmetadata = () => {
    videoPlayer.onMetadataLoaded();
};

videoPlayer.playPauseButton.click(function() {
    videoPlayer.onPlayPauseButtonClick();
});

videoPlayer.playerSlider.asRange({
    tip: false,
    onChange: function(newPlayerSliderValue) {
        videoPlayer.onPlayerSliderValueChange(newPlayerSliderValue);
    }
});

videoPlayer.cropper.resizable({
    handles: "n, e, s, w, ne, se, sw, nw",
    containment: "parent",
    resize: function(event, resizeParams) {
        videoPlayer.onCropperResize(resizeParams);
    }
});



class VideoTrimmer {
    constructor(videoPlayer) {
        this.videoPlayer = videoPlayer;
        this.trimmerSlider = $("#trimmer-slider");
        this.trimLeftButton = $("#trim-left-button");
        this.trimRightButton = $("#trim-right-button");
        this.trimmerSliderValues = (this.trimmerSlider.attr("value") || (SLIDERS_MIN_VALUE + ',' + SLIDERS_MAX_VALUE))
            .split(',', 2)
            .map(x => +x);
        this.trimmerSliderIsBeingChangedByMouse = false;
        this.trimmerSliderIsBeingChangedByVideoTimeUpdateEvent = false;
        this.trimmerButtonClicked = false;
    }

    onTrimmerSliderValuesChange(newTrimmerSliderValues) {
        if (this.trimmerButtonClicked == false && this.trimmerSliderValues != newTrimmerSliderValues) {
            if (this.trimmerSliderValues[0] == newTrimmerSliderValues[0] &&
                this.trimmerSliderValues[1] != newTrimmerSliderValues[1]) {
                this.videoPlayer.movePlayerSliderFromOutside(newTrimmerSliderValues[1]);
            } else {
                if (this.trimmerSliderValues[1] == newTrimmerSliderValues[1] &&
                    this.trimmerSliderValues[0] != newTrimmerSliderValues[0]) {
                    this.videoPlayer.movePlayerSliderFromOutside(newTrimmerSliderValues[0]);
                }
            }
            this.trimmerSliderValues = newTrimmerSliderValues;
        }
    }

    onTrimmerLeftButtonClickStart() {
        this.trimmerButtonClicked = true;
        this.trimmerSliderValues[0] = this.videoPlayer.getPlayerSliderValue();
        this.trimmerSlider.asRange('set', this.trimmerSliderValues);
    }

    onTrimmerRightButtonClick() {
        this.trimmerButtonClicked = true;
        this.trimmerSliderValues[1] = this.videoPlayer.getPlayerSliderValue();
        this.trimmerSlider.asRange('set', this.trimmerSliderValues);
    }

    onTrimmerButtonClickFinish() {
        this.trimmerButtonClicked = false;
    }

    trimVideo() {

    }

    saveAsWebp() {

    }

    saveAsGif() {

    }
}


var videoTrimmer = new VideoTrimmer(videoPlayer);

videoTrimmer.trimmerSlider.asRange({
    range: true,
    limit: true,
    keyboard: true,
    tip: false,
    onChange: function(newTrimmerSliderValues) {
        videoTrimmer.onTrimmerSliderValuesChange(newTrimmerSliderValues);
    }
});

videoTrimmer.trimLeftButton.mousedown(function() {
    videoTrimmer.onTrimmerLeftButtonClickStart();
});

videoTrimmer.trimLeftButton.mouseup(function() {
    videoTrimmer.onTrimmerButtonClickFinish();
});

videoTrimmer.trimRightButton.mousedown(function() {
    videoTrimmer.onTrimmerRightButtonClick();
});

videoTrimmer.trimRightButton.mouseup(function() {
    videoTrimmer.onTrimmerButtonClickFinish();
});


$("save-cropped-button").click(function() {
    videoPlayer.cropVideo();
});

$("#save-trimmed-button").click(function() {
    videoTrimmer.trimVideo();
});

$("#save-webp-button").click(function() {
    videoTrimmer.saveAsWebp();
});

$("#save-gif-button").click(function() {
    videoTrimmer.saveAsGif();
});
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
        this.cropper = $("#resizable");
        this.cropper.resizable({
            handles: "n, e, s, w, ne, se, sw, nw",
            containment: "parent"
        });

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
        this.videoWidth = this.video.videoWidth;
        this.videoHeight = this.video.videoHeight;
        this.videoRatio = this.videoWidth / this.videoHeight;

        this.cropperContainerWidth = this.video.offsetWidth;
        this.cropperContainerHeight = this.video.offsetHeight;
        this.cropperContainerRatio = this.cropperContainerWidth / this.cropperContainerHeight;

        if (this.cropperContainerRatio > this.videoRatio) {
            this.cropperContainerWidth = this.cropperContainerHeight * this.videoRatio;
            this.cropperContainerHorizontalMargin = (this.video.offsetWidth - this.cropperContainerWidth) / 2;
        } else {
            this.cropperContainerHeight = this.cropperContainerWidth / this.videoRatio;
            this.cropperContainerVerticalMargin = (this.video.offsetHeight - this.cropperContainerHeight) / 2;
        }

        this.alignCropperWithVideo();
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

    alignCropperWithVideo() {
        $("#crop-selector-container").css({
            maxWidth: this.cropperContainerWidth + 'px',
            maxHeight: this.cropperContainerHeight + 'px',
            marginLeft: this.cropperContainerHorizontalMargin + 'px',
            right: this.cropperContainerHorizontalMargin + 'px',
            marginTop: this.cropperContainerVerticalMargin + 'px',
            marginBottom: this.cropperContainerVerticalMargin + 'px'
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
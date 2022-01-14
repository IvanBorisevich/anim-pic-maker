const SLIDERS_MIN_VALUE = 0;
const SLIDERS_MAX_VALUE = 100;

class VideoPlayer {

    constructor() {
        var copyThis = this;

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
        this.loopOptionCheckbox = $("#animpic-loop");
        this.loopOptionCheckbox.iCheck({
            checkboxClass: 'icheckbox_flat-aero',
            radioClass: 'icheckbox_flat-aero'
        });
        this.loopWithReverseOptionCheckbox = $("#animpic-loop-reversed");
        this.loopWithReverseOptionCheckbox.iCheck({
            checkboxClass: 'icheckbox_flat-aero',
            radioClass: 'iradio_flat-aero'
        });

        this.playerCurrentTimeBox = new TimeBox($('#player-current-time'));
        this.playerCurrentTimeBox.setOnTimeValueChangeCallback(this.setVideoNewTime, this);

        this.playerFullTimeBox = new TimeBox($('#player-full-time'), true);
        this.trimmerStartTimeBox = new TimeBox($('#trimmer-start-time'));
        this.trimmerEndTimeBox = new TimeBox($('#trimmer-end-time'));

        this.playerSliderValue = parseInt(this.playerSlider.attr("value") || SLIDERS_MIN_VALUE);
        this.isVideoTimeChangedFromOutside = false;
        this.trimmedFragmentIsPlayed = false;

        this.video.onended = () => {
            copyThis.onVideoFinish();
        };

        this.video.ontimeupdate = () => {
            copyThis.onVideoTimeUpdate();
        };

        this.video.onloadedmetadata = () => {
            copyThis.onMetadataLoaded();
        };

        this.playPauseButton.click(function() {
            copyThis.onPlayPauseButtonClick();
        });

        this.playerSlider.asRange({
            tip: false,
            keyboard: false,
            onChange: function(newPlayerSliderValue) {
                copyThis.onPlayerSliderValueChange(newPlayerSliderValue);
            }
        });

        this.cropper.resizable({
            handles: "n, e, s, w, ne, se, sw, nw",
            containment: "parent",
            resize: function(event, resizeParams) {
                copyThis.onCropperResize(resizeParams);
            }
        });

        $(document).on('keydown', function(event) {
            copyThis.onKeyPressed(event);
        });
    }

    onKeyPressed(e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode == 32) { // space
            e.preventDefault();
            this.playPauseButton.trigger("click");
        }
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

        var videoCurrentTime = this.calcVideoCurrentTimeInSecByPlayerSliderValue(this.playerSliderValue);
        this.playerCurrentTimeBox.setTimeMillis(videoCurrentTime * 1000);
        this.setVideoCurrentTime(videoCurrentTime);
    }

    setVideoNewTime(timeInSeconds) {
        if (timeInSeconds > this.video.duration) {
            timeInSeconds = this.video.duration;
        }
        if (this.isVideoPlayed()) {
            this.pauseVideo();
            this.setPlayPauseButtonText(this.VideoActions.PLAY);
        }
        this.setVideoCurrentTime(timeInSeconds);
        this.setPlayerSliderValue(this.calcPlayerSliderValueByVideoCurrentTime(timeInSeconds));
        this.updatePlayerSliderProgressCSS();
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
        this.playerCurrentTimeBox.setMaxTimeValue(this.video.duration * 1000);
        this.trimmerStartTimeBox.setMaxTimeValue(this.video.duration * 1000);
        this.trimmerEndTimeBox.setMaxTimeValue(this.video.duration * 1000);
        this.playerFullTimeBox.setTimeMillis(this.video.duration * 1000);
        this.trimmerEndTimeBox.setTimeMillis(this.video.duration * 1000);

        this.trimStartTimeMillis = 0;
        this.trimEndTimeMillis = this.video.duration * 1000;

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

    playVideoInInterval(startTimeMillis, endTimeMillis) {
        this.trimmedFragmentIsPlayed = true;
        this.trimStartTimeMillis = startTimeMillis;
        this.trimEndTimeMillis = endTimeMillis;
        this.isVideoTimeChangedFromOutside = false;
        this.video.currentTime = startTimeMillis / 1000;
        if (this.isVideoPaused()) {
            this.video.play();
        }
    }

    onVideoTimeUpdate() {
        if (!this.isVideoTimeChangedFromOutside) {
            console.log(this.video.currentTime * 1000);
            this.playerSliderValue = this.calcPlayerSliderValueByVideoCurrentTime();
            this.updatePlayerSliderProgressCSS();
            this.playerCurrentTimeBox.setTimeMillis(this.getVideoCurrentTime() * 1000);

            if (this.trimmedFragmentIsPlayed && this.video.currentTime * 1000 >= this.trimEndTimeMillis) {
                this.video.pause();
                this.onVideoFinish(this.trimStartTimeMillis / 1000);
                this.trimmedFragmentIsPlayed = false;
            }
        }
    }

    onVideoFinish(startTimeSec = 0) {
        this.setPlayPauseButtonText(this.VideoActions.PLAY);
        this.video.currentTime = startTimeSec;
        this.playerSliderValue = this.calcPlayerSliderValueByVideoCurrentTime();
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

    getVideoCurrentTime() {
        return this.video.currentTime;
    }

    getVideoDuration() {
        return this.video.duration;
    }

    calcVideoCurrentTimeInSecByPlayerSliderValue(playerSliderValue) {
        return this.video.duration * playerSliderValue / 100;
    }

    calcPlayerSliderValueByVideoCurrentTime() {
        return this.video.currentTime / this.video.duration * 100;
    }
}


class VideoTrimmer {
    constructor(videoPlayer) {
        var copyThis = this;
        this.videoPlayer = videoPlayer;
        this.trimmerSlider = $("#trimmer-slider");
        this.trimLeftButton = $("#trim-left-button");
        this.trimRightButton = $("#trim-right-button");
        this.trimResetButton = $("#trim-reset-button");
        this.trimLeftResetButton = $("#trim-left-reset-button");
        this.trimRightResetButton = $("#trim-right-reset-button");
        this.playTrimmedFragmentButton = $("#play-trimmed-fragment-button");
        this.trimmerSliderValues = (this.trimmerSlider.attr("value") || (SLIDERS_MIN_VALUE + ',' + SLIDERS_MAX_VALUE))
            .split(',', 2)
            .map(x => +x);
        this.trimmerSliderIsBeingChangedByMouse = false;
        this.trimmerSliderIsBeingChangedByVideoTimeUpdateEvent = false;
        this.trimmerButtonClicked = false;

        this.trimmerSlider.asRange({
            range: true,
            limit: true,
            keyboard: false,
            tip: false,
            onChange: function(newTrimmerSliderValues) {
                copyThis.onTrimmerSliderValuesChange(newTrimmerSliderValues);
            }
        });

        this.videoPlayer.trimmerStartTimeBox.setOnTimeValueChangeCallback(this.setTrimmerStartTime, this);
        this.videoPlayer.trimmerEndTimeBox.setOnTimeValueChangeCallback(this.setTrimmerEndTime, this);

        this.trimLeftButton.mousedown(function() {
            copyThis.onTrimmerLeftButtonClickStart();
        });

        this.trimLeftButton.mouseup(function() {
            copyThis.onTrimmerButtonClickFinish();
        });

        this.trimRightButton.mousedown(function() {
            copyThis.onTrimmerRightButtonClick();
        });

        this.trimRightButton.mouseup(function() {
            copyThis.onTrimmerButtonClickFinish();
        });

        this.trimResetButton.mousedown(function() {
            copyThis.onTrimmerResetButtonClick();
        });

        this.trimResetButton.mouseup(function() {
            copyThis.onTrimmerButtonClickFinish();
        });

        this.trimLeftResetButton.mousedown(function() {
            copyThis.onTrimmerLeftResetButtonClick();
        });

        this.trimLeftResetButton.mouseup(function() {
            copyThis.onTrimmerButtonClickFinish();
        });

        this.trimRightResetButton.mousedown(function() {
            copyThis.onTrimmerRightResetButtonClick();
        });

        this.trimRightResetButton.mouseup(function() {
            copyThis.onTrimmerButtonClickFinish();
        });

        this.playTrimmedFragmentButton.click(function() {
            var startTimeMillis = copyThis.videoPlayer.calcVideoCurrentTimeInSecByPlayerSliderValue(copyThis.trimmerSliderValues[0]) * 1000;
            var endTimeMillis = copyThis.videoPlayer.calcVideoCurrentTimeInSecByPlayerSliderValue(copyThis.trimmerSliderValues[1]) * 1000;
            copyThis.videoPlayer.playVideoInInterval(startTimeMillis, endTimeMillis);
        });
    }

    onTrimmerSliderValuesChange(newTrimmerSliderValues) {
        if (this.trimmerButtonClicked == false && this.trimmerSliderValues != newTrimmerSliderValues) {
            if (this.trimmerSliderValues[0] == newTrimmerSliderValues[0] &&
                this.trimmerSliderValues[1] != newTrimmerSliderValues[1]) {
                this.videoPlayer.movePlayerSliderFromOutside(newTrimmerSliderValues[1]);
                this.videoPlayer.trimmerEndTimeBox.setTimeMillis(this.videoPlayer.getVideoCurrentTime() * 1000);
            } else {
                if (this.trimmerSliderValues[1] == newTrimmerSliderValues[1] &&
                    this.trimmerSliderValues[0] != newTrimmerSliderValues[0]) {
                    this.videoPlayer.movePlayerSliderFromOutside(newTrimmerSliderValues[0]);
                    this.videoPlayer.trimmerStartTimeBox.setTimeMillis(this.videoPlayer.getVideoCurrentTime() * 1000);
                }
            }
            this.trimmerSliderValues = newTrimmerSliderValues;
        }
    }

    onTrimmerLeftButtonClickStart() {
        this.trimmerButtonClicked = true;
        this.trimmerSliderValues[0] = this.videoPlayer.getPlayerSliderValue();
        this.trimmerSlider.asRange('set', this.trimmerSliderValues);
        this.videoPlayer.trimmerStartTimeBox.setTimeMillis(this.videoPlayer.getVideoCurrentTime() * 1000);
    }

    onTrimmerRightButtonClick() {
        this.trimmerButtonClicked = true;
        this.trimmerSliderValues[1] = this.videoPlayer.getPlayerSliderValue();
        this.trimmerSlider.asRange('set', this.trimmerSliderValues);
        this.videoPlayer.trimmerEndTimeBox.setTimeMillis(this.videoPlayer.getVideoCurrentTime() * 1000);
    }

    onTrimmerResetButtonClick() {
        this.trimmerButtonClicked = true;
        this.trimmerSliderValues[0] = SLIDERS_MIN_VALUE;
        this.trimmerSliderValues[1] = SLIDERS_MAX_VALUE;
        this.trimmerSlider.asRange('set', this.trimmerSliderValues);
        this.videoPlayer.trimmerStartTimeBox.setTimeMillis(0);
        this.videoPlayer.trimmerEndTimeBox.setTimeMillis(this.videoPlayer.getVideoDuration() * 1000);
    }

    onTrimmerLeftResetButtonClick() {
        this.trimmerButtonClicked = true;
        this.trimmerSliderValues[0] = SLIDERS_MIN_VALUE;
        this.trimmerSlider.asRange('set', this.trimmerSliderValues);
        this.videoPlayer.trimmerStartTimeBox.setTimeMillis(0);
    }

    onTrimmerRightResetButtonClick() {
        this.trimmerButtonClicked = true;
        this.trimmerSliderValues[1] = SLIDERS_MAX_VALUE;
        this.trimmerSlider.asRange('set', this.trimmerSliderValues);
        this.videoPlayer.trimmerEndTimeBox.setTimeMillis(this.videoPlayer.getVideoDuration() * 1000);
    }

    onTrimmerButtonClickFinish() {
        this.trimmerButtonClicked = false;
    }

    setTrimmerStartTime(timeInSeconds) {
        this.trimmerButtonClicked = true;
        this.videoPlayer.setVideoNewTime(timeInSeconds);
        this.videoPlayer.playerCurrentTimeBox.setTimeMillis(timeInSeconds * 1000);
        this.trimmerSliderValues[0] = this.videoPlayer.getPlayerSliderValue();
        this.trimmerSlider.asRange('set', this.trimmerSliderValues);
        this.trimmerButtonClicked = false;
    }

    setTrimmerEndTime(timeInSeconds) {
        this.trimmerButtonClicked = true;
        this.videoPlayer.setVideoNewTime(timeInSeconds);
        this.videoPlayer.playerCurrentTimeBox.setTimeMillis(timeInSeconds * 1000);
        this.trimmerSliderValues[1] = this.videoPlayer.getPlayerSliderValue();
        this.trimmerSlider.asRange('set', this.trimmerSliderValues);
        this.trimmerButtonClicked = false;
    }



    saveProcessedAsMp4() {
        var requestBody = {};
        requestBody.trimStartTime = this.videoPlayer.calcVideoCurrentTimeInSecByPlayerSliderValue(this.trimmerSliderValues[0]);
        requestBody.trimEndTime = this.videoPlayer.calcVideoCurrentTimeInSecByPlayerSliderValue(this.trimmerSliderValues[1]);

        $.ajax({
            type: "POST",
            url: '/save-as-mp4',
            contentType: 'application/json',
            data: JSON.stringify(requestBody),
            dataType: 'json',
            success: function() {}
        });
    }

    saveProcessedAsWebp() {
        var requestBody = {};
        requestBody.trimStartTime = this.videoPlayer.calcVideoCurrentTimeInSecByPlayerSliderValue(this.trimmerSliderValues[0]);
        requestBody.trimEndTime = this.videoPlayer.calcVideoCurrentTimeInSecByPlayerSliderValue(this.trimmerSliderValues[1]);
        requestBody.croppedX = Math.round(this.videoPlayer.video.videoWidth * this.videoPlayer.cropperParams.margin.left / this.videoPlayer.cropperContainerParams.width);
        requestBody.croppedY = Math.round(this.videoPlayer.video.videoHeight * this.videoPlayer.cropperParams.margin.top / this.videoPlayer.cropperContainerParams.height);
        requestBody.croppedWidth = Math.round(this.videoPlayer.video.videoWidth * this.videoPlayer.cropperParams.width / this.videoPlayer.cropperContainerParams.width);
        requestBody.croppedHeight = Math.round(this.videoPlayer.video.videoHeight * this.videoPlayer.cropperParams.height / this.videoPlayer.cropperContainerParams.height);
        requestBody.framerate = 30;
        requestBody.qualityPercentage = 60;
        requestBody.isLooped = this.videoPlayer.loopOptionCheckbox.prop('checked');
        requestBody.concatReversed = this.videoPlayer.loopWithReverseOptionCheckbox.prop('checked');

        $.ajax({
                type: "POST",
                url: '/save-as-webp',
                contentType: 'application/json',
                data: JSON.stringify(requestBody),
                dataType: 'json'
            })
            .done(function(data) {
                console.log("Success webp", data);
                // if (data.outputFilePath) {
                //     window.open(data.outputFilePath, "_blank");
                // }
            });
    }

    saveProcessedAsGif() {
        var requestBody = {

        };

        $.ajax({
            type: "POST",
            url: '/save-as-gif',
            contentType: 'application/json',
            data: JSON.stringify(requestBody),
            dataType: 'json',
            success: function() {}
        });
    }
}

var videoPlayer = new VideoPlayer();
var videoTrimmer = new VideoTrimmer(videoPlayer);


$("#save-mp4-button").click(function() {
    videoTrimmer.saveProcessedAsMp4();
});

$("#save-webp-button").click(function() {
    videoTrimmer.saveProcessedAsWebp();
});

$("#save-gif-button").click(function() {
    videoTrimmer.saveProcessedAsGif();
});
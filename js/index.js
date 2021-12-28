var playerSlider = $("#player-slider");
var trimmerSlider = $("#trimmer-slider");
var playerSliderValue = parseInt(playerSlider.attr("value") || "0");
var trimmerSliderValues = (trimmerSlider.attr("value") || "0,100").split(',', 2).map(x => +x);
var trimmerSliderIsBeingChangedByMouse = false;
var trimmerButtonClicked = false;

playerSlider.asRange({
    tip: false,
    onChange: function(value) {
        if (!trimmerSliderIsBeingChangedByMouse) {
            playerSliderValue = value;
            setVideoPosition(value);
        }
    }
});

trimmerSlider.asRange({
    range: true,
    limit: true,
    keyboard: true,
    tip: false,
    onChange: function(values) {
        if (values != trimmerSliderValues) {
            if (trimmerButtonClicked) {
                trimmerSliderIsBeingChangedByMouse = false;
            } else {
                trimmerSliderIsBeingChangedByMouse = true;
            }

            if (values[0] == trimmerSliderValues[0] && values[1] != trimmerSliderValues[1]) {
                playerSlider.asRange('set', values[1]);
                setVideoPosition(values[1]);
            } else if (values[1] == trimmerSliderValues[1] && values[0] != trimmerSliderValues[0]) {
                playerSlider.asRange('set', values[0]);
                setVideoPosition(values[0]);
            }
            trimmerSliderValues = values;
        }
    }
});

trimmerSlider.next().find(".asRange-pointer").on('asRange::moveEnd', function(e) {
    trimmerSliderIsBeingChangedByMouse = false;
});




var videoPlayer = document.getElementById("my-video");
videoPlayer.onended = function() {
    playPauseButton.html("Play");
}

var playPauseButton = $("#play-pause-button");

playPauseButton.click(function() {
    if (playPauseButton.text().trim() == "Play") {
        videoPlayer.play();
        playPauseButton.html("Pause");
    } else if (playPauseButton.text().trim() == "Pause") {
        videoPlayer.pause();
        playPauseButton.html("Play");
    }
});


function setVideoPosition(playerSliderValue) {

}


var trimLeftButton = $("#trim-left-button");
var trimRightButton = $("#trim-right-button");

trimLeftButton.click(function() {
    trimmerButtonClicked = true;
    trimmerSliderValues[0] = playerSliderValue;
    trimmerSlider.asRange('set', trimmerSliderValues);
});

trimRightButton.click(function() {
    trimmerButtonClicked = true;
    trimmerSliderValues[1] = playerSliderValue;
    trimmerSlider.asRange('set', trimmerSliderValues);
});
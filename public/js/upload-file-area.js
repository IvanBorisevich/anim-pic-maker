const fileUploadArea = document.querySelector("#file-upload-area"),
    dragAndDropTitleText = fileUploadArea.querySelector("#drag-n-drop-header"),
    browseFileButton = fileUploadArea.querySelector("#browse-file"),
    fileUploadInput = fileUploadArea.querySelector("#input-file"),
    fileUploadSubmitButton = fileUploadArea.querySelector("#file-upload-submit"),
    videoProcessingTool = document.querySelector("#video-processing-tool");

videoProcessingTool.hidden = true;

let file;
browseFileButton.onclick = () => {
    fileUploadInput.click();
};
fileUploadInput.addEventListener("change", function() {
    file = this.files[0];
    fileUploadArea.classList.add("active");
    submitFileUpload();
});

fileUploadArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    fileUploadArea.classList.add("active");
    dragAndDropTitleText.textContent = "Release to Upload File";
});

fileUploadArea.addEventListener("dragleave", () => {
    fileUploadArea.classList.remove("active");
    dragAndDropTitleText.textContent = "Drag & Drop to Upload File";
});

fileUploadArea.addEventListener("drop", (event) => {
    event.preventDefault();
    file = event.dataTransfer.files[0];
    submitFileUpload();
});

function submitFileUpload() {
    fileUploadSubmitButton.click();
    fileUploadArea.style.display = "none";
    videoProcessingTool.hidden = false;
};

$("#file-upload-form").submit(function(e) {
    var fd = new FormData($("#file-upload-form").get(0));
    $.ajax({
        url: '/upload-video',
        data: fd,
        type: 'post',
        processData: false,
        contentType: false,
        success: function() {
            var file = $('#input-file')[0].files[0];
            videoPlayer.loadVideo(file);
        },
        error: function(xhr, status, error) {
            console.log('Error: ' + error.message);
        }
    });
    e.preventDefault();
});
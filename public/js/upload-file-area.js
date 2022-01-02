const dropArea = document.querySelector(".drag-area"),
    dragText = dropArea.querySelector("#drag-n-drop-header"),
    button = dropArea.querySelector("#browse-file"),
    input = dropArea.querySelector("#input-file"),
    videoProcessingTool = document.querySelector("#video-processing-tool");

videoProcessingTool.hidden = true;

let file;
button.onclick = () => {
    input.click();
}
input.addEventListener("change", function() {
    file = this.files[0];
    dropArea.classList.add("active");
    showFile();
});

dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropArea.classList.add("active");
    dragText.textContent = "Release to Upload File";
});

dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("active");
    dragText.textContent = "Drag & Drop to Upload File";
});

dropArea.addEventListener("drop", (event) => {
    event.preventDefault();
    file = event.dataTransfer.files[0];
    showFile();
});

function showFile() {
    var data = new FormData();
    var file = $('#input-file')[0].files[0];
    data.append('file', file);

    $.ajax({
        url: '/upload-video',
        data: data,
        cache: false,
        contentType: false,
        processData: false,
        method: 'POST',
        type: 'POST',
        success: function() {
            dropArea.style.display = "none";
            videoProcessingTool.hidden = false;
            videoPlayer.loadVideo(file);
        }
    });
}
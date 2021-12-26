const dropArea = document.querySelector(".drag-area"),
    dragText = dropArea.querySelector("header"),
    button = dropArea.querySelector("button"),
    input = dropArea.querySelector("input"),
    videoProcessingTool = document.querySelector("#video-processing-tool");

// videoProcessingTool.hidden = true;
dropArea.style.display = "none";

let file; //this is a global variable and we'll use it inside multiple functions
button.onclick = () => {
    input.click(); //if user click on the button then the input also clicked
}
input.addEventListener("change", function() {
    //getting user select file and [0] this means if user select multiple files then we'll select only the first one
    file = this.files[0];
    dropArea.classList.add("active");
    showFile(); //calling function
});
//If user Drag File Over DropArea
dropArea.addEventListener("dragover", (event) => {
    event.preventDefault(); //preventing from default behaviour
    dropArea.classList.add("active");
    dragText.textContent = "Release to Upload File";
});
//If user leave dragged File from DropArea
dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("active");
    dragText.textContent = "Drag & Drop to Upload File";
});
//If user drop File on DropArea
dropArea.addEventListener("drop", (event) => {
    event.preventDefault(); //preventing from default behaviour
    //getting user select file and [0] this means if user select multiple files then we'll select only the first one
    file = event.dataTransfer.files[0];
    showFile(); //calling function
});

function showFile() {
    let fileType = file.type;
    let validExtensions = ["video/mp4", "video/avi", "video/mkv"]; //adding some valid image extensions in array
    if (validExtensions.includes(fileType)) { //if user selected file is an image file
        let fileReader = new FileReader(); //creating new FileReader object
        fileReader.onload = () => {
            let fileURL = fileReader.result;
            dropArea.style.display = "none";
            videoProcessingTool.hidden = false;
        }
        fileReader.readAsDataURL(file);
    } else {
        alert("This is not a Video File!");
        dropArea.classList.remove("active");
        dragText.textContent = "Drag & Drop to Upload File";
    }
}
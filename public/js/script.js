// ===============================
// Shubh Labh Poster Studio
// Part 1
// ===============================

const nameInput = document.getElementById("name");
const mobileInput = document.getElementById("mobile");

const namePreview = document.getElementById("namePreview");
const mobilePreview = document.getElementById("mobilePreview");

const uploadBtn = document.getElementById("uploadBtn");

const photoInput = document.getElementById("photoInput");

const photoMenu = document.getElementById("photoMenu");

const cameraBtn = document.getElementById("cameraBtn");

const galleryBtn = document.getElementById("galleryBtn");

const cancelBtn = document.getElementById("cancelBtn");

const userPhoto = document.getElementById("userPhoto");

const cropModal = document.getElementById("cropModal");

const cropImage = document.getElementById("cropImage");

let cropper = null;


// ===============================
// Live Preview
// ===============================

nameInput.addEventListener("input", () => {

    if(nameInput.value.trim()==""){

        namePreview.innerText="Your Name";

    }else{

        namePreview.innerText=nameInput.value;

    }

});


mobileInput.addEventListener("input",()=>{

    if(mobileInput.value.trim()==""){

        mobilePreview.innerText="9876543210";

    }else{

        mobilePreview.innerText=mobileInput.value;

    }

});


// ===============================
// Upload Button
// ===============================

uploadBtn.onclick=()=>{

    photoMenu.style.display="block";

};


// ===============================
// Close Menu
// ===============================

cancelBtn.onclick=()=>{

    photoMenu.style.display="none";

};


// ===============================
// Camera
// ===============================

cameraBtn.onclick=()=>{

    photoInput.setAttribute("capture","environment");

    photoInput.click();

    photoMenu.style.display="none";

};


// ===============================
// Gallery
// ===============================

galleryBtn.onclick=()=>{

    photoInput.removeAttribute("capture");

    photoInput.click();

    photoMenu.style.display="none";

};


// ===============================
// Select Image
// ===============================

photoInput.addEventListener("change",(e)=>{

    const file=e.target.files[0];

    if(!file){

        return;

    }

    const reader=new FileReader();

    reader.onload=function(event){

        cropImage.src=event.target.result;

        cropModal.style.display="flex";

    }

    reader.readAsDataURL(file);

});
// ===============================
// Cropper Start
// ===============================

photoInput.addEventListener("change",(e)=>{

    const file=e.target.files[0];

    if(!file) return;

    const reader=new FileReader();

    reader.onload=function(event){

        cropImage.src=event.target.result;

        cropModal.style.display="flex";

        if(cropper){

            cropper.destroy();

        }

        cropImage.onload=function(){

            cropper=new Cropper(cropImage,{

                aspectRatio:245/342,

                viewMode:1,

                dragMode:"move",

                autoCropArea:1,

                responsive:true,

                background:false,

                movable:true,

                zoomable:true,

                scalable:false,

                rotatable:true

            });

        };

    };

    reader.readAsDataURL(file);

});


// ===============================
// Zoom
// ===============================

document.getElementById("zoomInBtn").onclick=()=>{

    if(cropper){

        cropper.zoom(0.1);

    }

};


document.getElementById("zoomOutBtn").onclick=()=>{

    if(cropper){

        cropper.zoom(-0.1);

    }

};


// ===============================
// Rotate
// ===============================

document.getElementById("rotateLeftBtn").onclick=()=>{

    if(cropper){

        cropper.rotate(-90);

    }

};


document.getElementById("rotateRightBtn").onclick=()=>{

    if(cropper){

        cropper.rotate(90);

    }

};


// ===============================
// Cancel Crop
// ===============================

document.getElementById("cropCancelBtn").onclick=()=>{

    cropModal.style.display="none";

    if(cropper){

        cropper.destroy();

        cropper=null;

    }

};
// ===============================
// Save Cropped Image
// ===============================

document.getElementById("cropSaveBtn").onclick = () => {

    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({

        width:245,

        height:342,

        imageSmoothingQuality:"high"

    });

    userPhoto.src = canvas.toDataURL("image/png");

    cropModal.style.display = "none";

    cropper.destroy();

    cropper = null;

};


// ===============================
// Generate Button
// ===============================

const generateBtn = document.getElementById("generateBtn");

const downloadBtn = document.getElementById("downloadBtn");

generateBtn.onclick = () => {

    if(userPhoto.src==""){

        alert("Please upload photo first.");

        return;

    }

    html2canvas(document.getElementById("poster"),{

        useCORS:true,

        scale:3

    }).then((canvas)=>{

        const image = canvas.toDataURL("image/png");

        downloadBtn.href = image;

        downloadBtn.download = "Shubh-Labh-Poster.png";

        downloadBtn.style.display = "block";

        downloadBtn.scrollIntoView({

            behavior:"smooth"

        });

    });

};


// ===============================
// Close Bottom Menu
// ===============================

window.onclick=(e)=>{

    if(e.target===photoMenu){

        photoMenu.style.display="none";

    }

};
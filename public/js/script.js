// ===================================
// Poster Generator V2
// Script Part 1
// ===================================


const canvas = document.getElementById("posterCanvas");
const ctx = canvas.getContext("2d");

const template = new Image();

template.src = "poster-template.png";

let userImage = null;


// Inputs

const nameInput = document.getElementById("name");
const mobileInput = document.getElementById("mobile");


// Buttons

const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
const photoInput = document.getElementById("photoInput");

const photoOptions = document.getElementById("photoOptions");

const cameraBtn = document.getElementById("cameraBtn");
const galleryBtn = document.getElementById("galleryBtn");

const closeSheetBtn = document.getElementById("closeSheetBtn");


// ===================================
// Load Template
// ===================================

template.onload = () => {

    drawPoster();

};


// ===================================
// Draw Poster
// ===================================

function drawPoster(){

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.drawImage(
        template,
        0,
        0,
        canvas.width,
        canvas.height
    );


    if(userImage){

        ctx.drawImage(
            userImage,
            250,
            250,
            580,
            580
        );

    }


    // Name

    ctx.font = "bold 70px Arial";

    ctx.fillStyle = "#000";

    ctx.textAlign = "center";

    ctx.fillText(
        nameInput.value || "Your Name",
        540,
        980
    );


    // Mobile

    ctx.font = "45px Arial";

    ctx.fillText(
        mobileInput.value || "9876543210",
        540,
        1060
    );


}



// Live Update

nameInput.addEventListener(
"input",
drawPoster
);


mobileInput.addEventListener(
"input",
drawPoster
);



// ===================================
// Upload Menu
// ===================================


uploadPhotoBtn.onclick = ()=>{

    photoOptions.style.display="block";

};



closeSheetBtn.onclick = ()=>{

    photoOptions.style.display="none";

};



// Camera

cameraBtn.onclick = ()=>{

    photoInput.setAttribute(
        "capture",
        "user"
    );

    photoInput.click();

    photoOptions.style.display="none";

};



// Gallery

galleryBtn.onclick = ()=>{

    photoInput.removeAttribute(
        "capture"
    );

    photoInput.click();

    photoOptions.style.display="none";

};



// Select Image

photoInput.addEventListener(
"change",
(e)=>{


    const file = e.target.files[0];


    if(!file) return;


    const reader = new FileReader();


    reader.onload = (event)=>{


        const img = new Image();


        img.onload = ()=>{

            userImage = img;

            drawPoster();

        };


        img.src = event.target.result;


    };


    reader.readAsDataURL(file);


});
// ===================================
// Crop Editor Part 2
// ===================================


const cropModal = document.getElementById("cropModal");

const cropImage = document.getElementById("cropImage");

const doneCropBtn = document.getElementById("doneCropBtn");

const cancelCropBtn = document.getElementById("cancelCropBtn");


const zoomInBtn = document.getElementById("zoomInBtn");

const zoomOutBtn = document.getElementById("zoomOutBtn");

const rotateLeftBtn = document.getElementById("rotateLeftBtn");

const rotateRightBtn = document.getElementById("rotateRightBtn");


let cropper = null;



// Replace image loading from Part 1

photoInput.addEventListener(
"change",
(e)=>{


const file = e.target.files[0];


if(!file) return;


const reader = new FileReader();



reader.onload=(event)=>{


cropImage.src = event.target.result;


cropModal.style.display="flex";



if(cropper){

cropper.destroy();

}



cropper = new Cropper(
cropImage,
{

aspectRatio:1,

viewMode:1,

dragMode:"move",

autoCropArea:1,

background:false,

responsive:true,

movable:true,

zoomable:true,

rotatable:true,

scalable:false,


ready(){

// mirror remove

cropImage.style.transform="scaleX(1)";

}


}

);



};


reader.readAsDataURL(file);


});





// Zoom Controls


zoomInBtn.onclick=()=>{

if(cropper){

cropper.zoom(0.1);

}

};



zoomOutBtn.onclick=()=>{

if(cropper){

cropper.zoom(-0.1);

}

};




// Rotate


rotateLeftBtn.onclick=()=>{

if(cropper){

cropper.rotate(-90);

}

};


rotateRightBtn.onclick=()=>{

if(cropper){

cropper.rotate(90);

}

};




// Done


doneCropBtn.onclick=()=>{


if(!cropper) return;



const croppedCanvas =
cropper.getCroppedCanvas({

width:700,

height:700,

imageSmoothingEnabled:true,

imageSmoothingQuality:"high"

});



const img = new Image();


img.onload=()=>{


userImage = img;


drawPoster();


};



img.src = croppedCanvas.toDataURL(
"image/png"
);



cropModal.style.display="none";


cropper.destroy();

cropper=null;


};





// Cancel


cancelCropBtn.onclick=()=>{


cropModal.style.display="none";


if(cropper){

cropper.destroy();

cropper=null;

}


};
// ===================================
// Generate & Download Part 3
// ===================================


const generateBtn =
document.getElementById("generateBtn");


const downloadBtn =
document.getElementById("downloadBtn");




// Generate Poster

generateBtn.onclick = ()=>{


if(!userImage){

alert("Please upload photo first");

return;

}



generateBtn.innerHTML =
"Generating...";



setTimeout(()=>{


const image =
canvas.toDataURL(
"image/png",
1.0
);



downloadBtn.href = image;


downloadBtn.style.display =
"block";



downloadBtn.click();



generateBtn.innerHTML =
"✨ Generate Poster";



},500);



};




// Download Button Text

downloadBtn.onclick = ()=>{

downloadBtn.innerHTML =
"⬇ Download Poster";

};




// Close popup outside click

window.onclick=(e)=>{


if(e.target === photoOptions){

photoOptions.style.display="none";

}



if(e.target === cropModal){

cropModal.style.display="none";


if(cropper){

cropper.destroy();

cropper=null;

}

}


};



// Prevent drag image issue

document.addEventListener(
"dragstart",
(e)=>{

e.preventDefault();

});

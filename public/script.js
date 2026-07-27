// --- CONFIGURATION FOR TEMPLATE 71997.png (1080x1350) ---
const CONFIG = {
    templateWidth: 1080,
    templateHeight: 1350,
    
    // Exact location & frame size for photo inside 71997.png
    photoX: 56,
    photoY: 746,
    photoWidth: 348,
    photoHeight: 382,
    
    // Position inside white pill "नाम:"
    nameX: 145,
    nameY: 1192,
    fontSizeName: 28,
    fontColorName: "#000000",
    
    // Position inside white pill "मोबाइल नंबर:"
    mobileX: 180,
    mobileY: 1266,
    fontSizeMobile: 26,
    fontColorMobile: "#000000"
};

// DOM Elements
const previewContainer = document.getElementById('preview-container');
const previewWrapper = document.getElementById('preview-wrapper');
const previewPhoto = document.getElementById('preview-photo');
const previewName = document.getElementById('preview-name');
const previewMobile = document.getElementById('preview-mobile');

const nameInput = document.getElementById('nameInput');
const mobileInput = document.getElementById('mobileInput');

const btnUpload = document.getElementById('btn-upload');
const btnGenerate = document.getElementById('btn-generate');

const sheetOverlay = document.getElementById('sheet-overlay');
const bottomSheet = document.getElementById('bottom-sheet');
const btnCancelSheet = document.getElementById('btn-cancel-sheet');
const cameraInput = document.getElementById('cameraInput');
const galleryInput = document.getElementById('galleryInput');

const cropPage = document.getElementById('crop-page');
const cropImage = document.getElementById('crop-image');
const btnCropCancel = document.getElementById('btn-crop-cancel');
const btnCropDone = document.getElementById('btn-crop-done');
const btnRotateLeft = document.getElementById('btn-rotate-left');
const btnRotateRight = document.getElementById('btn-rotate-right');
const btnFlipX = document.getElementById('btn-flip-x');
const loadingOverlay = document.getElementById('loading-overlay');

let cropper = null;
let currentBlob = null;
let isMirrored = false;

// Initialize Live Preview Positioning
function init() {
    previewPhoto.style.left = `${CONFIG.photoX}px`;
    previewPhoto.style.top = `${CONFIG.photoY}px`;
    previewPhoto.style.width = `${CONFIG.photoWidth}px`;
    previewPhoto.style.height = `${CONFIG.photoHeight}px`;

    previewName.style.left = `${CONFIG.nameX}px`;
    previewName.style.top = `${CONFIG.nameY}px`;
    previewName.style.fontSize = `${CONFIG.fontSizeName}px`;
    previewName.style.color = CONFIG.fontColorName;
    previewName.style.fontWeight = 'bold';

    previewMobile.style.left = `${CONFIG.mobileX}px`;
    previewMobile.style.top = `${CONFIG.mobileY}px`;
    previewMobile.style.fontSize = `${CONFIG.fontSizeMobile}px`;
    previewMobile.style.color = CONFIG.fontColorMobile;
    previewMobile.style.fontWeight = 'bold';

    scalePreview();
    window.addEventListener('resize', scalePreview);
}

// Scale live preview card to fit mobile screens dynamically
function scalePreview() {
    const containerWidth = previewContainer.clientWidth;
    const scale = containerWidth / CONFIG.templateWidth;
    previewWrapper.style.transform = `scale(${scale})`;
    previewContainer.style.height = `${CONFIG.templateHeight * scale}px`;
}

// Realtime Live Preview Updates
nameInput.addEventListener('input', (e) => {
    previewName.innerText = e.target.value;
});

mobileInput.addEventListener('input', (e) => {
    previewMobile.innerText = e.target.value;
});

// Bottom Sheet Management
const openSheet = () => {
    sheetOverlay.classList.add('active');
    bottomSheet.classList.add('active');
};

const closeSheet = () => {
    sheetOverlay.classList.remove('active');
    bottomSheet.classList.remove('active');
    cameraInput.value = '';
    galleryInput.value = '';
};

btnUpload.addEventListener('click', openSheet);
sheetOverlay.addEventListener('click', closeSheet);
btnCancelSheet.addEventListener('click', closeSheet);

// Handle File Selection
cameraInput.addEventListener('change', (e) => handleFileSelect(e, true));
galleryInput.addEventListener('change', (e) => handleFileSelect(e, false));

function handleFileSelect(event, isCamera) {
    const file = event.target.files[0];
    if (!file) return;

    closeSheet();

    const reader = new FileReader();
    reader.onload = (e) => {
        cropImage.src = e.target.result;
        cropPage.classList.add('active');

        if (cropper) cropper.destroy();

        cropper = new Cropper(cropImage, {
            aspectRatio: CONFIG.photoWidth / CONFIG.photoHeight,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 1,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            ready() {
                isMirrored = false;
                // Auto-correct front camera mirror effect
                if (isCamera) {
                    isMirrored = true;
                    cropper.scaleX(-1);
                }
            }
        });
    };
    reader.readAsDataURL(file);
}

// Cropper Tools
btnCropCancel.addEventListener('click', () => {
    cropPage.classList.remove('active');
    if (cropper) cropper.destroy();
});

btnRotateLeft.addEventListener('click', () => cropper.rotate(-90));
btnRotateRight.addEventListener('click', () => cropper.rotate(90));
btnFlipX.addEventListener('click', () => {
    isMirrored = !isMirrored;
    cropper.scaleX(isMirrored ? -1 : 1);
});

// Complete Cropping & Render to Live Preview
btnCropDone.addEventListener('click', () => {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
        width: CONFIG.photoWidth,
        height: CONFIG.photoHeight,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    canvas.toBlob((blob) => {
        currentBlob = blob;
        const objectURL = URL.createObjectURL(blob);
        previewPhoto.src = objectURL;
        previewPhoto.style.display = 'block';

        cropPage.classList.remove('active');
        cropper.destroy();
    }, 'image/png', 1.0);
});

// Poster Generation API Request & Auto Download
btnGenerate.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const mobile = mobileInput.value.trim();

    loadingOverlay.classList.add('active');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('mobile', mobile);
    formData.append('config', JSON.stringify(CONFIG));

    if (currentBlob) {
        formData.append('image', currentBlob, 'user-photo.png');
    }

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Poster generation failed');

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${name ? name.replace(/\s+/g, '_') : 'Poster'}_Generated.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
        alert('Failed to generate poster. Please try again.');
        console.error(error);
    } finally {
        loadingOverlay.classList.remove('active');
    }
});

// Start App
init();

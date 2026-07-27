/**
 * Dynamic Template Configuration Variables
 * Easily adjust these coordinates & dimensions to fit any new template.
 */
const TEMPLATE_CONFIG = {
    // Template Dimensions
    width: 1080,
    height: 1350,
    
    // User Photo Frame Position & Size
    photoX: 140,
    photoY: 300,
    photoWidth: 800,
    photoHeight: 800,

    // User Text Positions & Styling
    nameX: 540,          // Centered horizontally
    nameY: 1160,
    nameFontSize: 48,
    nameColor: '#FFFFFF',

    mobileX: 540,        // Centered horizontally
    mobileY: 1220,
    mobileFontSize: 36,
    mobileColor: '#FFD700'
};

// Global State
let templateImage = new Image();
let userCroppedImage = null; // HTMLImageElement
let cropperInstance = null;
let currentRawFile = null;

// DOM Elements
const canvas = document.getElementById('posterCanvas');
const ctx = canvas.getContext('2d');

const userNameInput = document.getElementById('userName');
const userMobileInput = document.getElementById('userMobile');

const bottomSheetModal = document.getElementById('bottomSheetModal');
const openUploadSheetBtn = document.getElementById('openUploadSheetBtn');
const closeSheetBtn = document.getElementById('closeSheetBtn');
const cameraOptionBtn = document.getElementById('cameraOptionBtn');
const galleryOptionBtn = document.getElementById('galleryOptionBtn');

const cameraInput = document.getElementById('cameraInput');
const galleryInput = document.getElementById('galleryInput');

const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');
const cancelCropBtn = document.getElementById('cancelCropBtn');
const applyCropBtn = document.getElementById('applyCropBtn');
const rotateLeftBtn = document.getElementById('rotateLeftBtn');
const rotateRightBtn = document.getElementById('rotateRightBtn');
const resetCropBtn = document.getElementById('resetCropBtn');

const generateBtn = document.getElementById('generateBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    initTemplate();
    bindEvents();
});

// Load Template Image
function initTemplate() {
    templateImage.crossOrigin = 'anonymous';
    templateImage.src = 'poster-template.png';
    templateImage.onload = () => {
        renderCanvasPreview();
    };
    templateImage.onerror = () => {
        // Fallback placeholder if template PNG is not uploaded yet
        createFallbackTemplate();
    };
}

// Fallback Canvas Template Creator
function createFallbackTemplate() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1080;
    tempCanvas.height = 1350;
    const tCtx = tempCanvas.getContext('2d');

    // Background Gradient
    const grad = tCtx.createLinearGradient(0, 0, 1080, 1350);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(1, '#311042');
    tCtx.fillStyle = grad;
    tCtx.fillRect(0, 0, 1080, 1350);

    // Photo Box Placeholder Frame
    tCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    tCtx.lineWidth = 6;
    tCtx.strokeRect(TEMPLATE_CONFIG.photoX, TEMPLATE_CONFIG.photoY, TEMPLATE_CONFIG.photoWidth, TEMPLATE_CONFIG.photoHeight);

    templateImage.src = tempCanvas.toDataURL();
}

// Real-Time Canvas Rendering
function renderCanvasPreview() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw User Photo (Behind or inside frame)
    if (userCroppedImage) {
        ctx.save();
        // Clipping region matching the frame
        ctx.beginPath();
        ctx.rect(TEMPLATE_CONFIG.photoX, TEMPLATE_CONFIG.photoY, TEMPLATE_CONFIG.photoWidth, TEMPLATE_CONFIG.photoHeight);
        ctx.clip();
        ctx.drawImage(userCroppedImage, TEMPLATE_CONFIG.photoX, TEMPLATE_CONFIG.photoY, TEMPLATE_CONFIG.photoWidth, TEMPLATE_CONFIG.photoHeight);
        ctx.restore();
    }

    // 2. Draw Poster Template Frame
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

    // 3. Draw Dynamic Text
    const nameText = userNameInput.value.trim();
    const mobileText = userMobileInput.value.trim();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Render Name
    if (nameText) {
        ctx.fillStyle = TEMPLATE_CONFIG.nameColor;
        ctx.font = `700 ${TEMPLATE_CONFIG.nameFontSize}px 'Poppins', sans-serif`;
        ctx.fillText(nameText, TEMPLATE_CONFIG.nameX, TEMPLATE_CONFIG.nameY);
    }

    // Render Mobile
    if (mobileText) {
        ctx.fillStyle = TEMPLATE_CONFIG.mobileColor;
        ctx.font = `600 ${TEMPLATE_CONFIG.mobileFontSize}px 'Poppins', sans-serif`;
        ctx.fillText(mobileText, TEMPLATE_CONFIG.mobileX, TEMPLATE_CONFIG.mobileY);
    }
}

// Event Bindings
function bindEvents() {
    // Live Text Inputs
    userNameInput.addEventListener('input', renderCanvasPreview);
    userMobileInput.addEventListener('input', renderCanvasPreview);

    // Bottom Sheet Controls
    openUploadSheetBtn.addEventListener('click', () => bottomSheetModal.classList.add('active'));
    closeSheetBtn.addEventListener('click', () => bottomSheetModal.classList.remove('active'));

    cameraOptionBtn.addEventListener('click', () => {
        bottomSheetModal.classList.remove('active');
        cameraInput.click();
    });

    galleryOptionBtn.addEventListener('click', () => {
        bottomSheetModal.classList.remove('active');
        galleryInput.click();
    });

    // File Input Handlers
    cameraInput.addEventListener('change', (e) => handleFileSelect(e, true));
    galleryInput.addEventListener('change', (e) => handleFileSelect(e, false));

    // Crop Toolbar Actions
    rotateLeftBtn.addEventListener('click', () => cropperInstance && cropperInstance.rotate(-90));
    rotateRightBtn.addEventListener('click', () => cropperInstance && cropperInstance.rotate(90));
    resetCropBtn.addEventListener('click', () => cropperInstance && cropperInstance.reset());
    cancelCropBtn.addEventListener('click', closeCropModal);
    applyCropBtn.addEventListener('click', applyCroppedImage);

    // Generate Poster Action
    generateBtn.addEventListener('click', generateHDPoster);
}

// Handle Image Selection & Front-Camera Mirror Correction
function handleFileSelect(event, isCamera = false) {
    const file = event.target.files[0];
    if (!file) return;

    currentRawFile = file;
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            // Fix Mirrored Camera Image (Selfie fix)
            if (isCamera) {
                fixMirroredImage(img, (correctedDataUrl) => {
                    openCropper(correctedDataUrl);
                });
            } else {
                openCropper(e.target.result);
            }
        };
    };

    reader.readAsDataURL(file);
    event.target.value = ''; // Reset input
}

// Un-mirror Front Camera Photo via Canvas Flip
function fixMirroredImage(img, callback) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tCtx = tempCanvas.getContext('2d');

    // Horizontal Flip
    tCtx.translate(img.width, 0);
    tCtx.scale(-1, 1);
    tCtx.drawImage(img, 0, 0);

    callback(tempCanvas.toDataURL('image/jpeg', 0.95));
}

// Open Cropper JS Modal
function openCropper(imageSrc) {
    cropImage.src = imageSrc;
    cropModal.classList.add('active');

    if (cropperInstance) {
        cropperInstance.destroy();
    }

    const aspectRatio = TEMPLATE_CONFIG.photoWidth / TEMPLATE_CONFIG.photoHeight;

    cropperInstance = new Cropper(cropImage, {
        aspectRatio: aspectRatio,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.9,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
    });
}

// Close Crop Modal
function closeCropModal() {
    cropModal.classList.remove('active');
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
}

// Apply Cropped Image to Preview
function applyCroppedImage() {
    if (!cropperInstance) return;

    const croppedCanvas = cropperInstance.getCroppedCanvas({
        width: TEMPLATE_CONFIG.photoWidth,
        height: TEMPLATE_CONFIG.photoHeight,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    const croppedDataUrl = croppedCanvas.toDataURL('image/png');

    const img = new Image();
    img.src = croppedDataUrl;
    img.onload = () => {
        userCroppedImage = img;
        renderCanvasPreview();
        closeCropModal();
    };
}

// Generate HD Poster API Call
async function generateHDPoster() {
    loadingOverlay.classList.add('active');

    try {
        const formData = new FormData();
        formData.append('name', userNameInput.value.trim());
        formData.append('mobile', userMobileInput.value.trim());

        // Pass template configuration variables to backend
        formData.append('photoX', TEMPLATE_CONFIG.photoX);
        formData.append('photoY', TEMPLATE_CONFIG.photoY);
        formData.append('photoWidth', TEMPLATE_CONFIG.photoWidth);
        formData.append('photoHeight', TEMPLATE_CONFIG.photoHeight);
        formData.append('nameX', TEMPLATE_CONFIG.nameX);
        formData.append('nameY', TEMPLATE_CONFIG.nameY);
        formData.append('mobileX', TEMPLATE_CONFIG.mobileX);
        formData.append('mobileY', TEMPLATE_CONFIG.mobileY);
        formData.append('nameFontSize', TEMPLATE_CONFIG.nameFontSize);
        formData.append('mobileFontSize', TEMPLATE_CONFIG.mobileFontSize);

        if (userCroppedImage) {
            const blob = await (await fetch(userCroppedImage.src)).blob();
            formData.append('photo', blob, 'user_photo.png');
        }

        const response = await fetch('/api/generate-poster', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            // Trigger Direct Download
            const downloadLink = document.createElement('a');
            downloadLink.href = result.imageData || result.imageUrl;
            downloadLink.download = `Poster_${Date.now()}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } else {
            alert('Failed to generate poster: ' + result.message);
        }

    } catch (err) {
        console.error('API Error:', err);
        alert('An error occurred while generating the poster.');
    } finally {
        loadingOverlay.classList.remove('active');
    }
}

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

        if (result.success && result.imageData) {
            // Trigger Direct Download from Base64 Data URI
            const downloadLink = document.createElement('a');
            downloadLink.href = result.imageData;
            downloadLink.download = `Poster_${Date.now()}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } else {
            alert('Failed to generate poster: ' + (result.message || 'Unknown error'));
        }

    } catch (err) {
        console.error('API Error:', err);
        alert('An error occurred while generating the poster.');
    } finally {
        loadingOverlay.classList.remove('active');
    }
}

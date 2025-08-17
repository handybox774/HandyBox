// Get all the necessary elements from the HTML file
const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const downloadLink = document.getElementById('downloadLink');
const message = document.getElementById('message');

// Disable the download link by default
downloadLink.style.display = 'none';

// Listen for a change in the file input (when a user selects a file)
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        if (!file.type.match('image/jpeg')) {
            message.textContent = 'Error: Please upload a JPG or JPEG file.';
            message.style.color = 'red';
            convertBtn.disabled = true;
            downloadLink.style.display = 'none';
        } else {
            message.textContent = '';
            message.style.color = '';
            convertBtn.disabled = false;
        }
    } else {
        convertBtn.disabled = true;
        message.textContent = '';
        downloadLink.style.display = 'none';
    }
});

// Listen for a click on the convert button
convertBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (file) {
        message.textContent = 'Converting...';
        message.style.color = 'black';
        convertBtn.disabled = true;
        downloadLink.style.display = 'none';

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true, // تم تصحيح الخطأ هنا
            fileType: 'image/png' // Specify output type here
        };

        try {
            const convertedFile = await imageCompression(file, options);
            const url = URL.createObjectURL(convertedFile);
            downloadLink.href = url;
            downloadLink.textContent = 'Download PNG';
            downloadLink.style.display = 'block';
            message.textContent = 'Conversion successful! Click the link to download.';
            message.style.color = 'green';
            convertBtn.disabled = false;
        } catch (error) {
            console.error(error);
            message.textContent = 'Error: An unexpected error occurred.';
            message.style.color = 'red';
            convertBtn.disabled = false;
        }
    }
});
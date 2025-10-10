// Get all the necessary elements from the HTML file
const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const downloadLink = document.getElementById('downloadLink');
const message = document.getElementById('message');
const qualityInput = document.getElementById('quality');
const fromFormat = document.getElementById('fromFormat');
const toFormat = document.getElementById('toFormat');

// Disable the convert button by default
convertBtn.disabled = true;
downloadLink.style.display = 'none';

// Listen for a change in the file input
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        if (!file.type.match('image.*')) {
            message.textContent = 'Error: Please upload an image file.';
            message.style.color = 'red';
            convertBtn.disabled = true;
            downloadLink.style.display = 'none';
        } else {
            message.textContent = '';
            message.style.color = '';
            convertBtn.disabled = false;
            
            // اكتشاف الصيغة تلقائيًا
            if (fromFormat.value === 'auto') {
                const fileType = file.type.split('/')[1].toUpperCase();
                message.textContent = `Detected format: ${fileType}`;
                message.style.color = 'green';
            }
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
    const outputFormat = toFormat.value;
    const quality = parseInt(qualityInput.value);
    
    if (file) {
        message.textContent = 'Converting...';
        message.style.color = 'black';
        convertBtn.disabled = true;
        downloadLink.style.display = 'none';

        try {
            // تحويل الصورة
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // تحديد نوع الملف
                let mimeType = 'image/png';
                let fileExtension = 'png';
                
                switch(outputFormat) {
                    case 'jpg':
                        mimeType = 'image/jpeg';
                        fileExtension = 'jpg';
                        break;
                    case 'webp':
                        mimeType = 'image/webp';
                        fileExtension = 'webp';
                        break;
                    case 'bmp':
                        mimeType = 'image/bmp';
                        fileExtension = 'bmp';
                        break;
                    case 'gif':
                        mimeType = 'image/gif';
                        fileExtension = 'gif';
                        break;
                    default:
                        mimeType = 'image/png';
                        fileExtension = 'png';
                }
                
                // تحويل الجودة للنسبة
                const qualityRatio = quality / 100;
                
                // جودة JPG و WebP فقط
                const finalQuality = (outputFormat === 'jpg' || outputFormat === 'webp') ? qualityRatio : 1.0;
                
                // تحويل الصورة
                const dataURL = canvas.toDataURL(mimeType, finalQuality);
                const blob = dataURLToBlob(dataURL);
                
                const url = URL.createObjectURL(blob);
                downloadLink.href = url;
                downloadLink.download = `converted.${fileExtension}`;
                downloadLink.style.display = 'block';
                message.textContent = `✅ Successfully converted to ${outputFormat.toUpperCase()}! Click download.`;
                message.style.color = 'green';
                convertBtn.disabled = false;
            };
            
            img.onerror = function() {
                message.textContent = 'Error: Could not load image.';
                message.style.color = 'red';
                convertBtn.disabled = false;
            };
            
            img.src = URL.createObjectURL(file);
            
        } catch (error) {
            console.error(error);
            message.textContent = 'Error: An unexpected error occurred.';
            message.style.color = 'red';
            convertBtn.disabled = false;
        }
    }
});

// دالة تحويل DataURL إلى Blob
function dataURLToBlob(dataURL) {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: contentType });
}

// تحديث قيمة الجودة
qualityInput.addEventListener('input', function() {
    document.getElementById('qualityValue').textContent = this.value + '%';
});
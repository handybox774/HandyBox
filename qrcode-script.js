const textInput = document.getElementById('textInput');
const generateBtn = document.getElementById('generateBtn');
const qrcodeCanvas = document.getElementById('qrcodeCanvas');
const downloadBtn = document.getElementById('downloadBtn');
const downloadLink = document.getElementById('downloadLink');
const message = document.getElementById('message');

generateBtn.addEventListener('click', () => {
    const text = textInput.value;
    if (text.trim() === '') {
        message.textContent = 'Error: Please enter some text or a link.';
        message.style.color = 'red';
        qrcodeCanvas.innerHTML = '';
        downloadLink.style.display = 'none';
        return;
    }

    message.textContent = 'Generating QR Code...';
    message.style.color = 'black';
    downloadLink.style.display = 'none';

    try {
        qrcodeCanvas.innerHTML = '';
        const qrcode = new QRCode(qrcodeCanvas, {
            text: text,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        setTimeout(() => {
            const qrCodeImage = qrcodeCanvas.querySelector('img');
            if (qrCodeImage) {
                downloadLink.href = qrCodeImage.src;
                downloadBtn.disabled = false;
                downloadLink.style.display = 'block';
                message.textContent = 'QR Code generated successfully! You can now download it.';
                message.style.color = 'green';
            }
        }, 100);

    } catch (error) {
        message.textContent = 'Error: Could not generate QR Code.';
        message.style.color = 'red';
        downloadLink.style.display = 'none';
        console.error(error);
    }
});
document.getElementById('downloadQRBtn').addEventListener('click', function () {
    const canvas = document.querySelector('#qrcodeCanvas canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'qrcode.png';
        link.click();
    }
});

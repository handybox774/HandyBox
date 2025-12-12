// Handy Box — QR Code Generator (robust download fix)
(function () {
  // DOM
  const textInput    = document.getElementById('textInput');
  const generateBtn  = document.getElementById('generateBtn');
  const qrcodeCanvas = document.getElementById('qrcodeCanvas');
  const downloadBtn  = document.getElementById('downloadQRBtn');
  const message      = document.getElementById('message');

  if (!textInput || !generateBtn || !qrcodeCanvas || !downloadBtn || !message) {
    console.warn('[QR] Missing expected DOM nodes.');
    return;
  }

  // حالة البداية
  downloadBtn.disabled = true;
  setMsg('');

  let qrInstance = null;

  function setMsg(txt, ok = false) {
    message.textContent = txt || '';
    message.style.color = txt ? (ok ? 'green' : 'red') : '';
  }

  // توليد الكيوآر
  generateBtn.addEventListener('click', () => {
    const text = (textInput.value || '').trim();
    qrcodeCanvas.innerHTML = '';
    downloadBtn.disabled = true;

    if (!text) {
      setMsg('Error: Please enter some text or a link.');
      return;
    }

    // تخلّصي من أي instance قديم
    qrInstance = null;

    // ارسم الكود
    qrInstance = new QRCode(qrcodeCanvas, {
      text,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });

    // أعطِ المكتبة لحظة ترسم <canvas> أو <img>
    setTimeout(() => {
      // تحقّق إن تم توليده
      const hasCanvas = !!qrcodeCanvas.querySelector('canvas');
      const img = qrcodeCanvas.querySelector('img');

      if (hasCanvas || (img && img.src)) {
        setMsg('QR Code generated successfully! You can now download it.', true);
        downloadBtn.disabled = false;
      } else {
        setMsg('Error: Could not generate QR Code.');
        downloadBtn.disabled = true;
      }
    }, 120);
  });

  // إحضار DataURL للكود (تتعامل مع canvas أو img)
  async function getQRDataURL() {
    const canvas = qrcodeCanvas.querySelector('canvas');
    if (canvas) {
      try {
        return canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('[QR] canvas toDataURL failed:', e);
      }
    }

    const img = qrcodeCanvas.querySelector('img');
    if (img && img.src) {
      // لو هو data: جاهز
      if (img.src.startsWith('data:')) return img.src;

      // لو صورة عادية (نادرًا مع هذه المكتبة)، حاولي رسمها على كانفس ثم تحويلها
      try {
        await imgDecode(img);
        const tmp = document.createElement('canvas');
        tmp.width = img.naturalWidth || 256;
        tmp.height = img.naturalHeight || 256;
        const ctx = tmp.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return tmp.toDataURL('image/png');
      } catch (e) {
        console.warn('[QR] IMG->canvas failed (CORS?):', e);
        return null;
      }
    }

    return null;
  }

  function imgDecode(img) {
    // تضمن إن الصورة جاهزة قبل الرسم على كانفس
    return new Promise((resolve, reject) => {
      if (img.complete && img.naturalWidth) return resolve();
      const onLoad = () => { cleanup(); resolve(); };
      const onErr  = (e) => { cleanup(); reject(e); };
      function cleanup() {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onErr);
      }
      img.addEventListener('load', onLoad);
      img.addEventListener('error', onErr);
    });
  }

  // التحميل
  downloadBtn.addEventListener('click', async () => {
    setMsg('');
    downloadBtn.disabled = true;

    try {
      const dataURL = await getQRDataURL();
      if (!dataURL) {
        setMsg('No QR code to download. Please generate one first.');
        downloadBtn.disabled = false;
        return;
      }

      const a = document.createElement('a');
      a.href = dataURL;
      a.download = 'qrcode.png';
      document.body.appendChild(a);
      a.click();
      a.remove();

      setMsg('QR Code downloaded!', true);
    } catch (e) {
      console.error('[QR] download failed:', e);
      setMsg('Download failed. Please try again.');
    } finally {
      // إعادة التمكين ليتاح إعادة التحميل بدون توليد جديد
      downloadBtn.disabled = false;
    }
  });
})();

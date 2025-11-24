// Handy Box — Image Converter (quality affects all formats)
// v2 — lossy resample for PNG/BMP/GIF, native quality for JPG/WebP

const fileInput     = document.getElementById('fileInput');
const convertBtn    = document.getElementById('convertBtn');
const downloadLink  = document.getElementById('downloadLink');
const message       = document.getElementById('message');
const qualityInput  = document.getElementById('quality');
const fromFormat    = document.getElementById('fromFormat');
const toFormat      = document.getElementById('toFormat');
const qualityValue  = document.getElementById('qualityValue');
const previewImg    = document.getElementById('preview');

let currentObjectURL = null;
let lastOutputURL    = null;

function resetMessage(){ message.textContent=''; message.style.color=''; }
function setMessage(t, c=''){ message.textContent=t; if(c) message.style.color=c; }

// تحديث النص بجانب السلايدر
qualityInput.addEventListener('input', function(){
  qualityValue.textContent = this.value + '%';
});

// عرض المعاينة عند اختيار ملف
fileInput.addEventListener('change', () => {
  resetMessage();
  downloadLink.style.display = 'none';
  convertBtn.disabled = true;

  const file = fileInput.files?.[0];
  if(!file) return;

  if(!/^image\//i.test(file.type)){
    setMessage('Error: Please upload an image file.', 'red');
    return;
  }

  if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
  currentObjectURL = URL.createObjectURL(file);
  previewImg.src = currentObjectURL;
  previewImg.style.display = 'block';

  if (fromFormat.value === 'auto') {
    const ext = (file.type.split('/')[1] || '').toUpperCase();
    setMessage(`Detected format: ${ext}`, 'green');
  } else {
    resetMessage();
  }
  convertBtn.disabled = false;
});

// أداة مساعدة: toBlob مع fallback
function canvasToBlobP(canvas, type, quality){
  return new Promise((resolve, reject) => {
    if (canvas.toBlob){
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), type, quality);
    } else {
      try{
        const dataURL = canvas.toDataURL(type, quality);
        const [head, b64] = dataURL.split(';base64,');
        const contentType = head.split(':')[1] || 'application/octet-stream';
        const byteString = atob(b64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i=0;i<byteString.length;i++) ia[i]=byteString.charCodeAt(i);
        resolve(new Blob([ab], {type: contentType}));
      }catch(e){ reject(e); }
    }
  });
}

convertBtn.addEventListener('click', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  // وجهة الإخراج + اختيار الجودة
  const outFmt = (toFormat.value || 'png').toLowerCase();
  const q = Math.max(1, Math.min(100, parseInt(qualityInput.value||'90',10)));

  // MIME + امتداد
  let mime='image/png', ext='png';
  switch(outFmt){
    case 'jpg': case 'jpeg': mime='image/jpeg'; ext='jpg'; break;
    case 'webp': mime='image/webp'; ext='webp'; break;
    case 'bmp':  mime='image/bmp';  ext='bmp'; break;
    case 'gif':  mime='image/gif';  ext='gif'; break;
    default:     mime='image/png';  ext='png';
  }

  // نسبة الجودة الحقيقية (JPG/WebP) — 0.01..1
  const qRatio = (outFmt==='jpg' || outFmt==='jpeg' || outFmt==='webp')
    ? Math.max(0.01, Math.min(1, q/100))
    : 1; // الصيغ الأخرى ما تستخدم quality مباشرة

  setMessage('Converting...');
  convertBtn.disabled = true;
  downloadLink.style.display = 'none';

  try{
    // حملي الصورة
    const img = new Image();
    img.decoding = 'async';
    img.onload = async () => {
      // الأبعاد الأصلية
      const w = img.naturalWidth  || img.width;
      const h = img.naturalHeight || img.height;

      // سنرسم على canvas وسيعتمد على الصيغة:
      // - JPG/WebP: نفس الأبعاد، نمرر qRatio للمُحوّل.
      // - PNG/BMP/GIF: نطبّق "re-sample" (تقليل أبعاد) حسب الجودة q:
      //   scale = 0.5 .. 1.0  (جودة 100% => 1, جودة 1% => ~0.5)
      let outW = w, outH = h;
      let needResample = (outFmt==='png' || outFmt==='bmp' || outFmt==='gif');

      if (needResample){
        // مقياس لوسي بسيط لتصغير الأبعاد حسب الجودة
        const scale = 0.5 + 0.5*(q/100); // من 0.5 إلى 1.0
        outW = Math.max(1, Math.round(w*scale));
        outH = Math.max(1, Math.round(h*scale));
      }

      // خطوة 1: إن احتجنا إعادة معاينة؛ نعمل Canvas وسيط صغير
      let workCanvas = document.createElement('canvas');
      workCanvas.width  = outW;
      workCanvas.height = outH;

      const wctx = workCanvas.getContext('2d', { alpha: true, willReadFrequently: false });

      // ترسيم: لو بنصغّر، نستخدم drawImage مباشرة (المتصفح يطبّق فلترة مناسبة)
      // هذا يحافظ على الشفافية كذلك
      wctx.drawImage(img, 0, 0, outW, outH);

      // بالنسبة لـ JPG/WebP: لا حاجة لكانفاس إضافي — نصدّر من workCanvas بأبعاد الأصل؟
      // اخترنا: حتى في JPG/WebP نُبقي الأبعاد الأصلية (جودة تتحكم بحجم/تفاصيل)
      // أما lossless: نستخدم outW/outH (التي قد تقل عند q منخفض).
      // *إن رغبت بالإبقاء على نفس الأبعاد حتى لـ PNG/GIF: بدّلي outW/outH إلى w/h فوق
      // مع down-up sample إضافي (لكن هذا يعطي نعومة بدون تقليل الحجم كثير)

      // لو الصيغة GIF: تذكير أنها ستصبح إطارًا واحدًا (static)
      if (outFmt==='gif'){
        // بعض المتصفحات تُخرج GIF معتمداً على الـcanvas ولكن النتيجة قد تكون كبيرة الحجم.
        // هذا أفضل ما يمكن بدون مكتبات خارجية (gif encoder).
      }

      // اصنعي Blob
      const blob = await canvasToBlobP(workCanvas, mime, qRatio);

      // نظِّفي أي URL قديم
      if (lastOutputURL) {
        URL.revokeObjectURL(lastOutputURL);
        lastOutputURL = null;
      }
      const url = URL.createObjectURL(blob);
      lastOutputURL = url;

      downloadLink.href = url;
      downloadLink.download = `converted.${ext}`;
      downloadLink.style.display = 'inline-block';

      // رسالة توضيحية بالأبعاد النهائية
      const dims = `${workCanvas.width}×${workCanvas.height}`;
      const qNote = (outFmt==='jpg' || outFmt==='jpeg' || outFmt==='webp')
        ? `quality=${Math.round(qRatio*100)}%`
        : `scaled=${Math.round((workCanvas.width/w)*100)}%`;
      setMessage(`✅ Converted to ${outFmt.toUpperCase()} — ${dims} (${qNote}).`, 'green');

      // تنظيف بعد التحميل (اختياري)
      downloadLink.addEventListener('click', () => {
        setTimeout(() => {
          if (lastOutputURL){ URL.revokeObjectURL(lastOutputURL); lastOutputURL=null; }
        }, 5000);
      }, { once:true });

      convertBtn.disabled = false;
    };

    img.onerror = () => {
      setMessage('Error: Could not load image.', 'red');
      convertBtn.disabled = false;
    };

    // حمّل من الملف المختار
    if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = URL.createObjectURL(file);
    img.src = currentObjectURL;

  }catch(err){
    console.error(err);
    setMessage('Error: An unexpected error occurred.', 'red');
    convertBtn.disabled = false;
  }
});

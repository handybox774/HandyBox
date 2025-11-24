// Handy Box — PDF Merger with Preview + User Ordering (v16)
const pdfInput     = document.getElementById('pdfInput');
const mergeBtn     = document.getElementById('mergeBtn');
const downloadBtn  = document.getElementById('downloadBtn');
const downloadLink = document.getElementById('downloadLink');
const message      = document.getElementById('message');
const previewWrap  = document.getElementById('previewWrap');
const pdfPreview   = document.getElementById('pdfPreview');

const filesUI      = document.getElementById('filesUI');
const fileListEl   = document.getElementById('fileList');
const sortAscBtn   = document.getElementById('sortByNameAsc');
const sortDescBtn  = document.getElementById('sortByNameDesc');

const { PDFDocument } = PDFLib;

let currentBlobURL = null;
// مصفوفة قابلة لإعادة الترتيب بدلاً من FileList الثابت
let selectedFiles = []; // [{file, name, size, lastModified}]

function setMsg(txt, ok=false){
  if (!message) return;
  message.textContent = txt;
  message.style.color = ok ? 'green' : 'inherit';
}

function resetPreviewURL(){
  if (currentBlobURL) {
    URL.revokeObjectURL(currentBlobURL);
    currentBlobURL = null;
  }
  if (pdfPreview) pdfPreview.src = 'about:blank';
}

function resetUI(){
  setMsg('');
  mergeBtn.disabled = !(selectedFiles.length >= 2);
  downloadBtn.disabled = true;
  downloadLink.style.display = 'none';
  previewWrap.style.display = 'none';
  resetPreviewURL();
}

// توليد عنصر صف واحد في القائمة
function renderList(){
  if (!fileListEl) return;
  fileListEl.innerHTML = '';

  selectedFiles.forEach((it, idx) => {
    const li = document.createElement('li');
    li.setAttribute('draggable','true');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '8px';
    li.style.margin = '6px 0';

    // مقبض السحب
    const handle = document.createElement('span');
    handle.textContent = '⠿';
    handle.title = 'Drag to reorder';
    handle.style.cursor = 'grab';
    handle.style.userSelect = 'none';
    handle.style.fontSize = '18px';

    // اسم الملف
    const name = document.createElement('span');
    name.textContent = it.name;
    name.style.flex = '1 1 auto';
    name.style.wordBreak = 'break-all';

    // أزرار ▲ ▼ ×
    const btnUp = document.createElement('button');
    btnUp.textContent = '▲';
    btnUp.className = 'copy-button';
    btnUp.style.padding = '4px 8px';

    const btnDown = document.createElement('button');
    btnDown.textContent = '▼';
    btnDown.className = 'copy-button';
    btnDown.style.padding = '4px 8px';

    const btnDel = document.createElement('button');
    btnDel.textContent = '✖';
    btnDel.className = 'copy-button';
    btnDel.style.padding = '4px 8px';
    btnDel.style.background = '#dc3545';

    btnUp.addEventListener('click', () => moveItem(idx, idx-1));
    btnDown.addEventListener('click', () => moveItem(idx, idx+1));
    btnDel.addEventListener('click', () => { selectedFiles.splice(idx,1); renderList(); resetUI(); });

    // سحب وإفلات
    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', String(idx));
      li.style.opacity = '.5';
    });
    li.addEventListener('dragend', () => { li.style.opacity = '1'; });
    li.addEventListener('dragover', (e) => { e.preventDefault(); li.style.background = 'rgba(0,0,0,.05)'; });
    li.addEventListener('dragleave', () => { li.style.background = 'transparent'; });
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.style.background = 'transparent';
      const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const to = idx;
      if (!Number.isNaN(from) && from !== to){
        moveItem(from, to);
      }
    });

    li.appendChild(handle);
    li.appendChild(name);
    li.appendChild(btnUp);
    li.appendChild(btnDown);
    li.appendChild(btnDel);
    fileListEl.appendChild(li);
  });

  filesUI.style.display = selectedFiles.length ? 'block' : 'none';
  mergeBtn.disabled = !(selectedFiles.length >= 2);
}

function moveItem(from, to){
  if (to < 0 || to >= selectedFiles.length) return;
  const [itm] = selectedFiles.splice(from, 1);
  selectedFiles.splice(to, 0, itm);
  renderList();
  resetUI();
}

// أحداث الترتيب السريع بالاسم
if (sortAscBtn)  sortAscBtn.addEventListener('click', () => { selectedFiles.sort((a,b)=>a.name.localeCompare(b.name)); renderList(); resetUI(); });
if (sortDescBtn) sortDescBtn.addEventListener('click', () => { selectedFiles.sort((a,b)=>b.name.localeCompare(a.name)); renderList(); resetUI(); });

// استقبال الملفات من input
pdfInput.addEventListener('change', () => {
  selectedFiles = [];
  if (pdfInput.files && pdfInput.files.length) {
    // نحفظ نسخة قابلة للفرز
    for (const f of pdfInput.files) {
      selectedFiles.push({ file: f, name: f.name, size: f.size, lastModified: f.lastModified });
    }
  }
  renderList();
  resetUI();
});

// الدمج حسب ترتيب selectedFiles
mergeBtn.addEventListener('click', async () => {
  if (!selectedFiles.length || selectedFiles.length < 2) {
    setMsg('Please select at least two PDF files.');
    return;
  }

  setMsg('Merging PDFs... This might take a moment.');
  mergeBtn.disabled = true;
  downloadBtn.disabled = true;
  downloadLink.style.display = 'none';
  previewWrap.style.display = 'none';
  resetPreviewURL();

  try {
    const mergedPdf = await PDFDocument.create();

    for (const { file } of selectedFiles) {
      const pdfBytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
    }

    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });

    currentBlobURL = URL.createObjectURL(blob);

    // التحميل
    downloadLink.href = currentBlobURL;
    downloadLink.style.display = 'inline-block';
    downloadBtn.disabled = false;

    // المعاينة
    pdfPreview.src = currentBlobURL;
    previewWrap.style.display = 'block';

    setMsg('PDFs merged successfully!', true);
  } catch (err) {
    console.error(err);
    setMsg('An error occurred during merging.');
  } finally {
    mergeBtn.disabled = false;
  }
});

// لا نلغي URL مباشرةً كي تبقى المعاينة شغالة
downloadLink.addEventListener('click', () => {
  // لو تبي تنظيف تلقائي بعد ثواني، فعّلي التالي:
  // setTimeout(() => { resetPreviewURL(); }, 1500);
});

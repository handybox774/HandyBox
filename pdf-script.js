const pdfInput = document.getElementById('pdfInput');
const mergeBtn = document.getElementById('mergeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const downloadLink = document.getElementById('downloadLink');
const message = document.getElementById('message');

const { PDFDocument } = PDFLib;

// Enable the merge button when files are selected
pdfInput.addEventListener('change', () => {
    if (pdfInput.files.length >= 2) {
        mergeBtn.disabled = false;
    } else {
        mergeBtn.disabled = true;
    }
});

// The main function to merge PDFs
mergeBtn.addEventListener('click', async () => {
    const files = pdfInput.files;
    message.textContent = 'Merging PDFs... This might take a moment.';
    mergeBtn.disabled = true;
    downloadBtn.disabled = true;

    try {
        const mergedPdf = await PDFDocument.create();

        for (const file of files) {
            const pdfBytes = await file.arrayBuffer();
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        
        // Create a blob and a download link
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        downloadLink.href = url;
        downloadBtn.disabled = false;
        message.textContent = 'PDFs merged successfully!';

    } catch (error) {
        message.textContent = 'An error occurred during merging.';
        console.error(error);
        mergeBtn.disabled = false;
    }
});

// Clean up the URL when the link is not needed
downloadLink.addEventListener('click', () => {
    setTimeout(() => URL.revokeObjectURL(downloadLink.href), 100);
});
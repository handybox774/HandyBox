// عند تحميل الصفحة
window.addEventListener('load', function() {
    const userAgent = navigator.userAgent;
    const resultBox = document.getElementById('userAgentResult');
    
    if (resultBox) {
        resultBox.textContent = userAgent;
    }
});

// نسخ User Agent
function copyUserAgent() {
    const resultBox = document.getElementById('userAgentResult');
    if (resultBox) {
        const text = resultBox.textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert('User Agent copied to clipboard!');
        }).catch(err => {
            // للنسخ في المتصفحات القديمة
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('User Agent copied to clipboard!');
        });
    }
}
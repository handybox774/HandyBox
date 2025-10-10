const generateBtn = document.getElementById('generateBtn');
const hexCodeDisplay = document.getElementById('color-hex-code');
const colorBox = document.getElementById('colorBox');

// دالة توليد اللون العشوائي
function getRandomHexColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

// دالة التحديث
function updateColorDisplay() {
    const randomColor = getRandomHexColor();
    hexCodeDisplay.textContent = randomColor;
    colorBox.style.backgroundColor = randomColor;
}

// عند الضغط على الزر
generateBtn.addEventListener('click', updateColorDisplay);

// عند تحميل الصفحة
window.addEventListener('load', updateColorDisplay);
const hexInput = document.getElementById('hexInput');

// دالة التحقق من صحة الرمز
function isValidHex(hex) {
    return /^#([0-9A-Fa-f]{6})$/.test(hex);
}

// عند كتابة المستخدم في مربع الإدخال
hexInput.addEventListener('input', () => {
    const inputColor = hexInput.value;

    if (isValidHex(inputColor)) {
        colorBox.style.backgroundColor = inputColor;
        hexCodeDisplay.textContent = inputColor;
    }
});

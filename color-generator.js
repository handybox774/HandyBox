const generateBtn = document.getElementById('generateBtn');
const hexCodeDisplay = document.getElementById('color-hex-code');
const colorBox = document.getElementById('colorBox');
const hexInput = document.getElementById('hexInput');

// دالة توليد اللون العشوائي
function getRandomHexColor() {
  return "#" + Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0');
}

// تحديث اللون
function updateColorDisplay(color = getRandomHexColor()) {
  hexCodeDisplay.textContent = color;
  colorBox.style.backgroundColor = color;
  hexInput.value = color;
}

// عند الضغط على الزر
generateBtn.addEventListener('click', () => updateColorDisplay());

// عند كتابة المستخدم في مربع الإدخال
hexInput.addEventListener('input', () => {
  const inputColor = hexInput.value.trim();
  if (/^#([0-9A-Fa-f]{6})$/.test(inputColor)) {
    updateColorDisplay(inputColor);
  }
});

// نسخ الكود عند النقر عليه
hexCodeDisplay.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(hexCodeDisplay.textContent);
    hexCodeDisplay.textContent = "Copied!";
    setTimeout(() => updateColorDisplay(hexInput.value || "#000000"), 1000);
  } catch (err) {
    console.error("Copy failed", err);
  }
});

// تحميل أول لون
window.addEventListener('load', updateColorDisplay);

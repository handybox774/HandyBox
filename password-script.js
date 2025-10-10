const passwordOutput = document.getElementById('passwordOutput');
const lengthInput = document.getElementById('length');
const includeUppercase = document.getElementById('includeUppercase');
const includeLowercase = document.getElementById('includeLowercase');
const includeNumbers = document.getElementById('includeNumbers');
const includeSymbols = document.getElementById('includeSymbols');
const generateBtn = document.getElementById('generateBtn');
const message = document.getElementById('message');

const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
const numberChars = '0123456789';
const symbolChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

// === إعادة تفعيل التوليد عند تغيير أي خيار ===
[includeUppercase, includeLowercase, includeNumbers, includeSymbols].forEach(cb => {
  cb.addEventListener('change', () => {
    generateBtn.disabled = false;
    message.textContent = '';
    message.removeAttribute('style');
  });
});

generateBtn.addEventListener('click', () => {
  const sets = [];
  if (includeUppercase.checked) sets.push(uppercaseChars);
  if (includeLowercase.checked) sets.push(lowercaseChars);
  if (includeNumbers.checked)   sets.push(numberChars);
  if (includeSymbols.checked)   sets.push(symbolChars);

  if (!sets.length) {
    message.textContent = 'Error: Please select at least one character type.';
    message.style.color = 'red';
    passwordOutput.value = '';
    generateBtn.disabled = true;
    return;
  }

  const len = Math.max(4, Math.min(32, Number(lengthInput.value) || 12));
  const all = sets.join('');
  const pick = s => s[Math.floor(Math.random() * s.length)];
  let chars = [];

  // ضمان وجود حرف واحد على الأقل من كل مجموعة مختارة
  sets.forEach(s => chars.push(pick(s)));

  // إكمال بقية الطول من المجموع الكلي
  while (chars.length < len) chars.push(pick(all));

  // خلط (Fisher–Yates)
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  passwordOutput.value = chars.join('');
  message.textContent = 'Password generated successfully!';
  message.style.color = 'green';
});

document.getElementById('copyPasswordBtn').addEventListener('click', function () {
    const password = document.getElementById('passwordOutput').value;
    if (password) {
        navigator.clipboard.writeText(password).then(() => {
            alert('Password copied to clipboard!');
        });
    }
});
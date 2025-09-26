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

generateBtn.addEventListener('click', () => {
    let characters = '';
    let password = '';

    if (includeUppercase.checked) characters += uppercaseChars;
    if (includeLowercase.checked) characters += lowercaseChars;
    if (includeNumbers.checked) characters += numberChars;
    if (includeSymbols.checked) characters += symbolChars;

    if (characters === '') {
        message.textContent = 'Error: Please select at least one character type.';
        message.style.color = 'red';
        passwordOutput.value = '';
        generateBtn.disabled = true;
        return;
    }

    const passwordLength = lengthInput.value;
    for (let i = 0; i < passwordLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        password += characters[randomIndex];
    }
    
    passwordOutput.value = password;
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

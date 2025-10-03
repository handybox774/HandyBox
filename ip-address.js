const ipAddressDisplay = document.getElementById('ip-address-display');

async function getIpAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) {
            throw new Error('Failed to fetch IP');
        }
        const data = await response.json();
        ipAddressDisplay.textContent = data.ip;
    } catch (error) {
        console.error('IP API Error:', error);
        ipAddressDisplay.textContent = 'Failed to load IP.';
    }
}

// عند تحميل الصفحة
window.addEventListener('load', getIpAddress);

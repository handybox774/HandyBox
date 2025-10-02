const ipAddressDisplay = document.getElementById('ip-address-display');
const countryDisplay = document.getElementById('country-display');
const cityDisplay = document.getElementById('city-display');
const ispDisplay = document.getElementById('isp-display');
const zipDisplay = document.getElementById('zip-display');

async function getIpAddress() {
    try {
        const response = await fetch('/api/ip');
        if (!response.ok) {
            throw new Error('Failed to fetch IP data');
        }
        const data = await response.json();
        
        ipAddressDisplay.textContent = data.ip || 'N/A';
        countryDisplay.textContent = data.country || 'N/A';
        cityDisplay.textContent = data.city || 'N/A';
        ispDisplay.textContent = 'N/A'; // لا يمكن الحصول على ISP
        zipDisplay.textContent = 'N/A'; // لا يمكن الحصول على ZIP
        
    } catch (error) {
        console.error('API Error:', error);
        ipAddressDisplay.textContent = 'Failed to load IP.';
        countryDisplay.textContent = 'N/A';
        cityDisplay.textContent = 'N/A';
        ispDisplay.textContent = 'N/A';
        zipDisplay.textContent = 'N/A';
    }
}

// عند تحميل الصفحة
window.addEventListener('load', getIpAddress);

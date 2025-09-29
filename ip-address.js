const ipAddressDisplay = document.getElementById('ip-address-display');
const countryDisplay = document.getElementById('country-display');
const cityDisplay = document.getElementById('city-display');
const ispDisplay = document.getElementById('isp-display');
const zipDisplay = document.getElementById('zip-display');

async function getIpAddress() {
    try {
        // استخدام عدة خدمات احتياطيًا
        const response = await fetch('https://api.ipify.org?format=json');
        
        if (!response.ok) {
            throw new Error('Failed to fetch IP');
        }
        
        const data = await response.json();
        const ip = data.ip;
        
        ipAddressDisplay.textContent = ip;
        
        // الحصول على معلومات إضافية
        try {
            const locationResponse = await fetch(`http://ip-api.com/json/${ip}`);
            const locationData = await locationResponse.json();
            
            if (locationData.status === 'success') {
                countryDisplay.textContent = locationData.country || 'N/A';
                cityDisplay.textContent = locationData.city || 'N/A';
                ispDisplay.textContent = locationData.isp || 'N/A';
                zipDisplay.textContent = locationData.zip || 'N/A';
            } else {
                countryDisplay.textContent = 'N/A';
                cityDisplay.textContent = 'N/A';
                ispDisplay.textContent = 'N/A';
                zipDisplay.textContent = 'N/A';
            }
        } catch (locationError) {
            countryDisplay.textContent = 'N/A';
            cityDisplay.textContent = 'N/A';
            ispDisplay.textContent = 'N/A';
            zipDisplay.textContent = 'N/A';
        }
        
    } catch (error) {
        ipAddressDisplay.textContent = 'Failed to load IP.';
        countryDisplay.textContent = 'N/A';
        cityDisplay.textContent = 'N/A';
        ispDisplay.textContent = 'N/A';
        zipDisplay.textContent = 'N/A';
        console.error('Error fetching IP:', error);
    }
}

// عند تحميل الصفحة
window.addEventListener('load', getIpAddress);

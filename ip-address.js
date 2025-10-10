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

async function detectIP() {
  const ipEl  = document.getElementById('ipResult');
  const locEl = document.getElementById('locResult');
  const ispEl = document.getElementById('ispResult');

  ipEl.textContent  = 'IP: Detecting...';
  locEl.textContent = 'Location: Detecting...';
  ispEl.textContent = 'ISP: Detecting...';

  try {
    const r = await fetch('/.netlify/functions/ipinfo', { cache: 'no-store' });
    if (!r.ok) throw new Error('Function error');
    const d = await r.json();

    ipEl.textContent  = `IP: ${d.ip ?? '—'}`;
    const country = d.country ?? '—';
    const city    = d.city ?? '—';
    const zip     = d.zip ?? '—';
    locEl.textContent = `Location: ${country} • ${city} • ZIP: ${zip}`;
    ispEl.textContent = `ISP: ${d.isp ?? '—'}`;
  } catch (e) {
    ipEl.textContent  = 'IP: (failed)';
    locEl.textContent = 'Location: —';
    ispEl.textContent = 'ISP: —';
    console.warn(e);
  }
}

document.getElementById('detectBtn')?.addEventListener('click', detectIP);
document.addEventListener('DOMContentLoaded', detectIP); // يكشف تلقائيًا عند الدخول


// عند تحميل الصفحة
window.addEventListener('load', getIpAddress);
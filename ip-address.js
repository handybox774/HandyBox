// ============ Elements ============
const ipv4Span   = document.getElementById('ipv4-display');
const ipv6Span   = document.getElementById('ipv6-display');
const countryEl  = document.getElementById('country-display');
const cityEl     = document.getElementById('city-display');
const ispEl      = document.getElementById('isp-display');
const zipEl      = document.getElementById('zip-display');

const historyBox  = document.getElementById('historyBox');
const historyList = document.getElementById('historyList');

const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
const clearHistoryBtn  = document.getElementById('clearHistoryBtn');
const exportBtn        = document.getElementById('exportHistoryBtn');
const importBtn        = document.getElementById('importHistoryBtn');

// ============ IP values ============
let currentIPv4 = null;
let currentIPv6 = null;

// ============ Map state ============
let ipMap = null;
let ipMarker = null;

// ============ Helpers ============
function setText(el, value){
  if (!el) return;
  el.textContent = value;
}

function safeCountryName(data){
  if (!data || data.success === false) return 'Unknown';
  return data.country || 'Unknown';
}
function safeCityName(data){
  if (!data || data.success === false) return 'Unknown';
  return data.city || 'Unknown';
}
function safeISPName(data){
  if (!data || data.success === false) return 'Unknown';
  return data.connection && data.connection.isp ? data.connection.isp : (data.isp || 'Unknown');
}
function safeZip(data){
  if (!data || data.success === false) return '—';
  return data.postal || data.zip || '—';
}

// ============ Map logic ============
function initOrUpdateMap(lat, lon){
  const mapEl = document.getElementById('ip-map');
  if (!mapEl) return;
  if (!lat || !lon || !isFinite(lat) || !isFinite(lon)){
    mapEl.innerHTML = 'Map is not available for this IP.';
    return;
  }
  if (typeof L === 'undefined'){
    mapEl.innerHTML = 'Map library failed to load.';
    return;
  }

  const coords = [lat, lon];

  if (!ipMap){
    ipMap = L.map('ip-map').setView(coords, 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(ipMap);

    ipMarker = L.marker(coords).addTo(ipMap);
  } else {
    ipMap.setView(coords, 9);
    if (ipMarker){
      ipMarker.setLatLng(coords);
    } else {
      ipMarker = L.marker(coords).addTo(ipMap);
    }
  }
}

// ============ History (localStorage) ============
const LS_KEY = 'handybox_ip_history_v2';

function loadHistory(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  }catch{
    return [];
  }
}

function saveHistory(arr){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  }catch{}
}

function addHistoryEntry(){
  const ipv4 = currentIPv4 || 'N/A';
  const ipv6 = currentIPv6 || 'N/A';

  const now = new Date();
  const ts = now.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const entry = { ipv4, ipv6, ts };
  const history = loadHistory();
  history.unshift(entry);
  // keep last 20
  saveHistory(history.slice(0, 20));
  renderHistory();
}

// ⭐️ الشكل الجديد المرتّب
function renderHistory(){
  const history = loadHistory();
  if (!historyList) return;

  historyList.innerHTML = '';

  if (!history.length){
    const emptyMsg = document.createElement('div');
    emptyMsg.textContent = 'No history yet.';
    historyList.appendChild(emptyMsg);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'ip-history-list';

  history.forEach(item => {
    const li = document.createElement('li');
    const v4 = item.ipv4 || 'N/A';
    const v6 = item.ipv6 || 'N/A';
    const ts = item.ts  || '';
    li.textContent = `IPv4: ${v4}  |  IPv6: ${v6}  —  ${ts}`;
    ul.appendChild(li);
  });

  historyList.appendChild(ul);
}

function clearHistory(){
  saveHistory([]);
  renderHistory();
}

// Export history as JSON file
function exportHistory(){
  const history = loadHistory();
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'handybox-ip-history.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import history from JSON file
function importHistory(){
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try{
        const arr = JSON.parse(reader.result);
        if (!Array.isArray(arr)) throw new Error('bad format');
        saveHistory(arr);
        renderHistory();
        alert('History imported successfully.');
      }catch{
        alert('Invalid history file.');
      }
    };
    reader.readAsText(file);
  });

  input.click();
}

// ============ Fetch coordination ============
let v4Done  = false;
let v6Done  = false;
let geoDone = false;

function markFetchDone(which){
  if (which === 'v4')  v4Done  = true;
  if (which === 'v6')  v6Done  = true;
  if (which === 'geo') geoDone = true;

  if (v4Done && v6Done && geoDone && !markFetchDone._historyAdded){
    addHistoryEntry();
    markFetchDone._historyAdded = true;
  }
}

// ============ Update IP display ============
function updateIpDisplays(){
  setText(ipv4Span, currentIPv4 || 'Not available');
  setText(ipv6Span, currentIPv6 || 'Not available');
}

// ============ Fetch IP info ============

// 1) Public IPv4
fetch('https://api.ipify.org?format=json')
  .then(r => r.json())
  .then(data => {
    if (data && data.ip){
      currentIPv4 = data.ip;
      updateIpDisplays();
    }
  })
  .catch(() => {})
  .finally(() => {
    markFetchDone('v4');
  });

// 2) Public IPv6 (or same IPv4 if no v6 support)
fetch('https://api64.ipify.org?format=json')
  .then(r => r.json())
  .then(data => {
    if (!data || !data.ip) return;
    const ip = data.ip;

    if (ip.includes(':')){
      currentIPv6 = ip;
    } else {
      if (!currentIPv4) currentIPv4 = ip;
    }
    updateIpDisplays();
  })
  .catch(() => {})
  .finally(() => {
    markFetchDone('v6');
  });

// 3) Geo info + map from ipwho.is
fetch('https://ipwho.is/')
  .then(r => r.json())
  .then(data => {
    setText(countryEl, safeCountryName(data));
    setText(cityEl,    safeCityName(data));
    setText(ispEl,     safeISPName(data));
    setText(zipEl,     safeZip(data));

    if (!currentIPv4 && data && data.ip && !data.ip.includes(':')){
      currentIPv4 = data.ip;
      updateIpDisplays();
    }
    if (!currentIPv6 && data && data.ip && data.ip.includes(':')){
      currentIPv6 = data.ip;
      updateIpDisplays();
    }

    const lat = typeof data.latitude === 'number' ? data.latitude : null;
    const lon = typeof data.longitude === 'number' ? data.longitude : null;
    initOrUpdateMap(lat, lon);
  })
  .catch(() => {
    setText(countryEl, 'Unknown');
    setText(cityEl, 'Unknown');
    setText(ispEl, 'Unknown');
    setText(zipEl, '—');
  })
  .finally(() => {
    markFetchDone('geo');
  });

// ============ History controls ============

if (historyBox){
  historyBox.classList.remove('show');
}
renderHistory();

if (toggleHistoryBtn && historyBox){
  toggleHistoryBtn.addEventListener('click', () => {
    const isShown = historyBox.classList.toggle('show');
    toggleHistoryBtn.textContent = isShown ? 'Hide IP History' : 'Show IP History';
  });
}
if (clearHistoryBtn){
  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear saved IP history on this browser?')){
      clearHistory();
    }
  });
}
if (exportBtn){
  exportBtn.addEventListener('click', exportHistory);
}
if (importBtn){
  importBtn.addEventListener('click', importHistory);
}

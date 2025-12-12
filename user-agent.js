// Handy Box — user-agent.js (rich info + safe fallbacks)
(function () {
  function $(id) { return document.getElementById(id); }
  const box = $('userAgentResult');
  if (!box) return;

  // Helpers
  const ua = navigator.userAgent || '';
  const lang = navigator.language || (navigator.languages && navigator.languages[0]) || 'N/A';
  const hwThreads = (typeof navigator.hardwareConcurrency === 'number') ? navigator.hardwareConcurrency : 'N/A';
  const devMem = (typeof navigator.deviceMemory === 'number') ? navigator.deviceMemory + ' GB' : 'N/A';
  const onLine = (typeof navigator.onLine === 'boolean') ? (navigator.onLine ? 'Online' : 'Offline') : 'N/A';
  const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || 'N/A';
  const screenW = (window.screen && window.screen.width) ? window.screen.width : 'N/A';
  const screenH = (window.screen && window.screen.height) ? window.screen.height : 'N/A';
  const dpr = (typeof window.devicePixelRatio === 'number') ? window.devicePixelRatio : 'N/A';
  const viewport = `${Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)} × ${Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)}`;

  // Quick browser/os guess (heuristic – not perfect, لكنه عملي)
  function detectOS(u) {
    if (/windows nt 10/i.test(u)) return 'Windows 10/11';
    if (/windows nt/i.test(u)) return 'Windows';
    if (/android/i.test(u)) return 'Android';
    if (/iphone|ipad|ipod/i.test(u)) return 'iOS/iPadOS';
    if (/mac os x/i.test(u)) return 'macOS';
    if (/linux/i.test(u)) return 'Linux';
    return 'Unknown';
  }
  function detectBrowser(u) {
    if (/edg\//i.test(u)) return 'Microsoft Edge';
    if (/chrome\//i.test(u) && !/chromium/i.test(u)) return 'Chrome';
    if (/safari/i.test(u) && !/chrome|chromium/i.test(u)) return 'Safari';
    if (/firefox\//i.test(u)) return 'Firefox';
    if (/opr\//i.test(u)) return 'Opera';
    return 'Unknown';
  }

  const osGuess = detectOS(ua);
  const browserGuess = detectBrowser(ua);

  // Try userAgentData for more structured brands
  async function getUADataBrands() {
    try {
      if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
        const data = await navigator.userAgentData.getHighEntropyValues(['platform', 'platformVersion', 'architecture', 'bitness', 'fullVersionList', 'model']);
        return data; // { platform, platformVersion, architecture, bitness, model, fullVersionList: [{brand, version}, ...] }
      }
    } catch (_) {}
    return null;
  }

  function escapeHTML(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function renderTable(rows) {
    return `
      <div class="result-box-table" style="text-align:left; overflow:auto;">
        <table style="width:100%; border-collapse:collapse;">
          <tbody>
            ${rows.map(([k,v]) => `
              <tr>
                <td style="padding:8px; border-bottom:1px solid var(--c-border, #ddd); font-weight:bold;">${escapeHTML(k)}</td>
                <td style="padding:8px; border-bottom:1px solid var(--c-border, #ddd);">${v}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderBrands(brands) {
    if (!brands || !brands.length) return 'N/A';
    const items = brands.map(b => `${escapeHTML(b.brand)} ${escapeHTML(b.version)}`);
    return items.join(' • ');
  }

  // Initial raw UA
  let html = '';
  html += `<div style="margin-bottom:10px;"><strong>Raw User Agent:</strong><br><code style="word-break:break-all;">${escapeHTML(ua)}</code></div>`;

  // Common info (fast)
  const baseRows = [
    ['Detected Browser', escapeHTML(browserGuess)],
    ['Detected OS', escapeHTML(osGuess)],
    ['Platform', escapeHTML(platform)],
    ['Language', escapeHTML(lang)],
    ['Network', escapeHTML(onLine)],
    ['CPU Threads', escapeHTML(hwThreads)],
    ['Device Memory', escapeHTML(devMem)],
    ['Screen', `${escapeHTML(screenW)} × ${escapeHTML(screenH)} (DPR ${escapeHTML(dpr)})`],
    ['Viewport', escapeHTML(viewport)]
  ];
  html += renderTable(baseRows);

  // Placeholder for brands/details (userAgentData)
  html += `<div id="uaBrandsWrap" style="margin-top:12px;"></div>`;
  box.innerHTML = html;

  getUADataBrands().then(data => {
    const wrap = document.getElementById('uaBrandsWrap');
    if (!wrap) return;
    if (!data) {
      wrap.innerHTML = renderTable([['Brands (UA-CH)', 'N/A']]);
      return;
    }
    const rows = [
      ['Brands (UA-CH)', renderBrands(data.fullVersionList || [])],
      ['Architecture', escapeHTML(data.architecture || 'N/A')],
      ['Bitness', escapeHTML(data.bitness || 'N/A')],
      ['Model', escapeHTML(data.model || 'N/A')],
      ['Platform (UA-CH)', escapeHTML(data.platform || 'N/A')],
      ['Platform Version', escapeHTML(data.platformVersion || 'N/A')]
    ];
    wrap.innerHTML = renderTable(rows);
  });
})();

// Copy button keeps copying the raw UA (stable behavior)
function copyUserAgent() {
  const el = document.getElementById('userAgentResult');
  if (!el) return;
  const code = el.querySelector('code');
  const text = code ? code.textContent : (el.textContent || '');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => alert('User Agent copied to clipboard!'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }

  function fallbackCopy(t) {
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(_) {}
    document.body.removeChild(ta);
    alert('User Agent copied to clipboard!');
  }
}

// Handy Box — What is My IP (v11) — Show/Export/Import/Clear work reliably
(function () {
  // ---------- Safe storage helpers ----------
  const storageOK = (() => {
    try { localStorage.setItem("__hb_t", "1"); localStorage.removeItem("__hb_t"); return true; }
    catch { return false; }
  })();
  let memHistory = [];

  const lsGet = (k) => { if (!storageOK) return null; try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k,v)=>{ if (!storageOK){ if(k==="ipHistory") memHistory = JSON.parse(v||"[]"); return; } try{ localStorage.setItem(k,v);}catch{} };
  const lsRemove = (k)=>{ if (!storageOK){ if(k==="ipHistory") memHistory = []; return; } try{ localStorage.removeItem(k);}catch{} };
  const readHistory = ()=>{ try{ return storageOK? JSON.parse(lsGet("ipHistory")||"[]") : (memHistory||[]);}catch{ return []; } };
  const writeHistory = (arr)=>{ try{ lsSet("ipHistory", JSON.stringify(arr)); }catch{} };

  // ---------- DOM ----------
  const ipEl      = document.getElementById("ip-address-display");
  const countryEl = document.getElementById("country-display");
  const cityEl    = document.getElementById("city-display");
  const ispEl     = document.getElementById("isp-display");
  const zipEl     = document.getElementById("zip-display");
  const resultBox = document.querySelector(".tool-section .result-box");

  if (!ipEl || !countryEl || !cityEl || !ispEl || !zipEl || !resultBox) {
    console.warn("[IP] Missing expected DOM nodes. Aborting.");
    return;
  }

  // history box (create if not exists)
  let historyBox = document.querySelector(".history-box");
  if (!historyBox) {
    historyBox = document.createElement("div");
    historyBox.className = "history-box";
    resultBox.insertAdjacentElement("afterend", historyBox);
  }

  // Buttons
  const showBtn   = document.getElementById("showHistoryBtn");
  const exportBtn = document.getElementById("exportHistoryBtn");
  const importBtn = document.getElementById("importHistoryBtn");
  const clearBtn  = document.getElementById("clearHistoryBtn");

  // ---------- UI helpers ----------
  const hideExtraBtns = ()=> [exportBtn, importBtn, clearBtn].forEach(b => b && b.classList.add("hidden"));
  const showExtraBtns = ()=> [exportBtn, importBtn, clearBtn].forEach(b => b && b.classList.remove("hidden"));

  // مبدئيًا نخبي الأزرار، ونخلّيها تظهر لما يضغط المستخدم Show
  hideExtraBtns();
  historyBox.classList.remove("show");

  // Loading text
  ["ip","country","city","isp","zip"].forEach((_,i)=>[ipEl,countryEl,cityEl,ispEl,zipEl][i].textContent = "Loading…");

  function fetchWithTimeout(url, ms = 6000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
  }
  function setError(err){
    console.warn("IP Lookup Error:", err);
    ipEl.textContent = "Failed to load IP.";
    countryEl.textContent = cityEl.textContent = ispEl.textContent = zipEl.textContent = "N/A";
  }
  function flagHTML(name, codeLower){
    if (!codeLower) return name || "N/A";
    const flag = `https://flagcdn.com/24x18/${codeLower}.png`;
    return `${name||"N/A"} <img src="${flag}" alt="${name||"country"} flag" style="vertical-align:middle;margin-left:6px;">`;
  }
  function setUI(d, provider){
    ipEl.textContent   = d.ip || "N/A";
    cityEl.textContent = d.city || "N/A";
    ispEl.textContent  = d.isp || d.org || "N/A";
    zipEl.textContent  = d.postal || d.zip || "N/A";

    const name = d.country_name || d.country || "N/A";
    const code = (d.country_code || "").toLowerCase();
    countryEl.innerHTML = flagHTML(name, code);

    console.info(`[IP Debug] provider=${provider}`, d);
    saveHistory(d.ip, d.city, d.country_name || d.country);
  }

  // Providers (fallback chain)
  async function fromIpapi(){ const r=await fetchWithTimeout("https://ipapi.co/json/"); if(!r.ok) throw new Error("ipapi "+r.status); const j=await r.json(); return {ip:j.ip, country_name:j.country_name, country_code:j.country_code, city:j.city, isp:j.org, postal:j.postal}; }
  async function fromIpwho(){ const r=await fetchWithTimeout("https://ipwho.is/?fields=ip,country,country_code,city,connection,postal"); if(!r.ok) throw new Error("ipwho "+r.status); const j=await r.json(); if(!j.success) throw new Error("ipwho unsuccessful"); return {ip:j.ip, country_name:j.country, country_code:j.country_code, city:j.city, isp:j.connection&&j.connection.isp, postal:j.postal}; }
  async function fromIpinfo(){ const r=await fetchWithTimeout("https://ipinfo.io/json"); if(!r.ok) throw new Error("ipinfo "+r.status); const j=await r.json(); return {ip:j.ip, country_name:j.country, country_code:j.country, city:j.city, isp:j.org, postal:j.postal}; }
  async function fromIpifyOnly(){ const r=await fetchWithTimeout("https://api.ipify.org?format=json"); if(!r.ok) throw new Error("ipify "+r.status); const j=await r.json(); return { ip:j.ip }; }

  async function load(){
    try{
      let data=null, provider=null;
      try{ data=await fromIpapi();  provider="ipapi.co"; }
      catch(e1){ console.warn("ipapi failed:", e1);
        try{ data=await fromIpwho(); provider="ipwho.is"; }
        catch(e2){ console.warn("ipwho failed:", e2);
          try{ data=await fromIpinfo(); provider="ipinfo.io"; }
          catch(e3){ console.warn("ipinfo failed:", e3);
            data=await fromIpifyOnly(); provider="ipify.org (IP only)";
          }
        }
      }
      if (data.country_name && data.country_name.length===2 && !data.country_code) data.country_code = data.country_name;
      setUI(data, provider);
    }catch(e){ setError(e); }
  }

  function saveHistory(ip, city, country){
    if(!ip) return;
    const list = readHistory();
    const entry = { ip, city, country, date: new Date().toLocaleString() };
    // بدّل أول عنصر لو نفس الـIP؛ غير كذا أضِف في البداية
    if (list[0] && list[0].ip === ip) list[0] = entry; else list.unshift(entry);
    writeHistory(list);
  }
  function renderHistory(){
    const list = readHistory();
    historyBox.innerHTML = !list.length
      ? "<p>No previous IPs recorded.</p>"
      : list.map(e => `<p style="margin:8px 0"><strong>${e.ip}</strong> — ${e.city||"N/A"}, ${e.country||"N/A"}<br><small style="opacity:.8">${e.date}</small></p>`).join("<hr>");
  }

  function clearHistory(){
    lsRemove("ipHistory"); memHistory = [];
    renderHistory();
    alert("IP history cleared.");
  }
  function exportHistory(){
    const data = storageOK ? (lsGet("ipHistory")||"[]") : JSON.stringify(memHistory||[]);
    const blob = new Blob([data], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="ip-history.json";
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
  }
  function importHistory(){
    const inp=document.createElement("input"); inp.type="file"; inp.accept="application/json";
    inp.onchange = async () => {
      const f = inp.files?.[0]; if(!f) return;
      try {
        const txt = await f.text(); const arr = JSON.parse(txt);
        if(!Array.isArray(arr)) throw new Error("invalid");
        if (storageOK) writeHistory(arr); else memHistory = arr;
        renderHistory();
        alert("IP history imported.");
      } catch { alert("Import failed. Please select a valid JSON file."); }
    };
    inp.click();
  }

  // Wire buttons
  if (showBtn){
    showBtn.addEventListener("click", ()=>{
      const open = historyBox.classList.toggle("show");
      showBtn.textContent = open ? "Hide IP History" : "Show IP History";
      if (open){
        renderHistory();
        // خَلّي الأزرار تظهر دايمًا عند فتح الهستوري (حتى لو فاضي)
        showExtraBtns();
      } else {
        hideExtraBtns();
      }
    });
  }
  if (clearBtn)  clearBtn.addEventListener("click", clearHistory);
  if (exportBtn) exportBtn.addEventListener("click", exportHistory);
  if (importBtn) importBtn.addEventListener("click", importHistory);

  // go
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();

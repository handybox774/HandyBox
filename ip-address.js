// Handy Box — What is my IP (works on file:// and https)
(function(){
  const ipEl = document.getElementById("ip-address-display");
  const countryEl = document.getElementById("country-display");
  const cityEl = document.getElementById("city-display");
  const ispEl = document.getElementById("isp-display");
  const zipEl = document.getElementById("zip-display");

  const showErr = (err)=>{
    console.warn("IP Lookup Error:", err);
    if (ipEl) ipEl.textContent = "Failed to load IP.";
    if (countryEl) countryEl.textContent =
      cityEl.textContent = ispEl.textContent = zipEl.textContent = "N/A";
  };

  const setUI = (d)=>{
    ipEl.textContent   = d.ip || "N/A";
    cityEl.textContent = d.city || "N/A";
    ispEl.textContent  = d.isp || d.org || "N/A";
    zipEl.textContent  = d.postal || d.zip || "N/A";

    const name = d.country_name || d.country || "N/A";
    const code = (d.country_code || "").toLowerCase();
    if (code){
      const flag = `https://flagcdn.com/24x18/${code}.png`;
      countryEl.innerHTML = `${name} <img src="${flag}" alt="${name} flag" style="vertical-align:middle;margin-left:6px;">`;
    } else {
      countryEl.textContent = name;
    }
  };

  // مزوّدات
  async function fromIpapi(){
    // ipapi يُمنع غالبًا على file:// (CORS)؛ لذلك نستخدمه فقط على https
    const r = await fetch("https://ipapi.co/json/");
    if (!r.ok) throw new Error("ipapi HTTP "+r.status);
    const j = await r.json();
    return {
      ip: j.ip,
      country_name: j.country_name,
      country_code: j.country_code,
      city: j.city,
      isp: j.org,
      postal: j.postal
    };
  }

  async function fromIpwho(){
    // نطلب الحقول المطلوبة صراحة لضمان ISP/ZIP
    const r = await fetch("https://ipwho.is/?fields=ip,country,country_code,city,connection,postal");
    if (!r.ok) throw new Error("ipwho HTTP "+r.status);
    const j = await r.json();
    if (!j.success) throw new Error("ipwho unsuccessful");
    return {
      ip: j.ip,
      country_name: j.country,
      country_code: j.country_code,
      city: j.city,
      isp: j.connection && j.connection.isp ? j.connection.isp : undefined,
      postal: j.postal
    };
  }

  async function load(){
    try{
      // على https (Vercel) جرّبي ipapi أولاً، محليًا (file://) استخدمي ipwho مباشرة
      const isFile = location.protocol === "file:";
      const data = isFile ? await fromIpwho() : await fromIpapi().catch(()=>fromIpwho());
      setUI(data);
    }catch(e){ showErr(e); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();

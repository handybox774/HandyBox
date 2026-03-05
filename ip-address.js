// ip-address.js

document.addEventListener("DOMContentLoaded", () => {
  // Elements (match your HTML)
  const elIPv4 = document.getElementById("ipv4-display");
  const elIPv6 = document.getElementById("ipv6-display");
  const elCountry = document.getElementById("country-display");
  const elCity = document.getElementById("city-display");
  const elISP = document.getElementById("isp-display");
  const elZIP = document.getElementById("zip-display");

  const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const exportHistoryBtn = document.getElementById("exportHistoryBtn");
  const importHistoryBtn = document.getElementById("importHistoryBtn");

  const historyBox = document.getElementById("historyBox");
  const historyList = document.getElementById("historyList");

  const HISTORY_KEY = "handybox_ip_history_v1";
  const MAX_HISTORY = 25;

  function set(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  function readHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function writeHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
    } catch {}
  }

  function addToHistory(entry) {
    const items = readHistory();
    // de-dupe by ipv4+ipv6
    const key = `${entry.ipv4 || ""}|${entry.ipv6 || ""}`;
    const filtered = items.filter((x) => `${x.ipv4 || ""}|${x.ipv6 || ""}` !== key);
    filtered.unshift(entry);
    writeHistory(filtered);
  }

  function renderHistory() {
    if (!historyList) return;
    const items = readHistory();
    if (!items.length) {
      historyList.innerHTML = `<div style="opacity:.7">No history yet.</div>`;
      return;
    }

    historyList.innerHTML = items
      .map((x) => {
        const when = new Date(x.ts).toLocaleString();
        const v4 = x.ipv4 ? `IPv4: ${x.ipv4}` : `IPv4: —`;
        const v6 = x.ipv6 ? `IPv6: ${x.ipv6}` : `IPv6: —`;
        const loc = [x.city, x.country].filter(Boolean).join(", ") || "—";
        return `<div style="padding:6px 0;border-bottom:1px solid rgba(0,0,0,.08)">
          <div><strong>${when}</strong></div>
          <div>${v4}</div>
          <div>${v6}</div>
          <div style="opacity:.8">${loc}</div>
        </div>`;
      })
      .join("");
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function initHistoryUI() {
    if (historyBox) historyBox.style.display = "none";

    if (toggleHistoryBtn) {
      toggleHistoryBtn.addEventListener("click", () => {
        if (!historyBox) return;
        const isHidden = historyBox.style.display === "none";
        historyBox.style.display = isHidden ? "block" : "none";
        toggleHistoryBtn.textContent = isHidden ? "Hide IP History" : "Show IP History";
        if (isHidden) renderHistory();
      });
    }

    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener("click", () => {
        writeHistory([]);
        renderHistory();
      });
    }

    if (exportHistoryBtn) {
      exportHistoryBtn.addEventListener("click", () => {
        const items = readHistory();
        download("handybox-ip-history.json", JSON.stringify(items, null, 2));
      });
    }

    if (importHistoryBtn) {
      importHistoryBtn.addEventListener("click", async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.onchange = async () => {
          const file = input.files && input.files[0];
          if (!file) return;
          const text = await file.text();
          try {
            const items = JSON.parse(text);
            if (!Array.isArray(items)) throw new Error("Invalid format");
            writeHistory(items);
            renderHistory();
          } catch {
            alert("Invalid JSON file.");
          }
        };
        input.click();
      });
    }
  }

  // Map (Leaflet)
  let map = null;
  let marker = null;

  function ensureMap(lat, lon) {
    const mapEl = document.getElementById("ip-map");
    if (!mapEl) return;

    // Wait until Leaflet is ready
    if (!window.L) {
      setTimeout(() => ensureMap(lat, lon), 200);
      return;
    }

    const L = window.L;

    if (!map) {
      map = L.map("ip-map", { zoomControl: true }).setView([lat, lon], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      marker = L.marker([lat, lon]).addTo(map);
    } else {
      map.setView([lat, lon], 10);
      if (marker) marker.setLatLng([lat, lon]);
    }
  }

  async function loadIp() {
  set(elIPv4, "Loading...");
  set(elIPv6, "Loading...");
  set(elCountry, "Loading...");
  set(elCity, "Loading...");
  set(elISP, "Loading...");
  set(elZIP, "Loading...");

  try {
    const res = await fetch("/api/ip", { method: "GET" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      const msg = data?.error || "Failed to load IP info.";
      set(elIPv4, msg);
      set(elIPv6, "—");
      set(elCountry, "—");
      set(elCity, "—");
      set(elISP, "—");
      set(elZIP, "—");
      return;
    }

    const ip = data.ip || "";
    const isV6 = ip.includes(":");
    const isV4 = ip.includes(".");

    set(elIPv4, isV4 ? ip : "—");
    set(elIPv6, isV6 ? ip : "—");

    set(elCountry, data.country || "—");
    set(elCity, data.city || "—");
    set(elISP, data.isp || "—");
    set(elZIP, data.postal || "—");

    addToHistory({
      ts: Date.now(),
      ipv4: isV4 ? ip : null,
      ipv6: isV6 ? ip : null,
      country: data.country || null,
      city: data.city || null,
    });

    if (typeof data.latitude === "number" && typeof data.longitude === "number") {
      ensureMap(data.latitude, data.longitude);
    }
  } catch (e) {
    set(elIPv4, "Network error.");
    set(elIPv6, "—");
    set(elCountry, "—");
    set(elCity, "—");
    set(elISP, "—");
    set(elZIP, "—");
  }
}

  initHistoryUI();
  loadIp();
});


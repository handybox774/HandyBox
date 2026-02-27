// ip-address.js

document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel) => document.querySelector(sel);

  // Try common element ids/classes (works even if your HTML is slightly different)
  const elIp =
    $("#ip") ||
    $("#ipAddress") ||
    $("#ip-address") ||
    $("#ipValue") ||
    $(".ip-value");

  const elLocation =
    $("#location") ||
    $("#ipLocation") ||
    $("#locationValue") ||
    $(".location-value");

  const elIsp = $("#isp") || $("#ispValue") || $(".isp-value");
  const elTimezone = $("#timezone") || $("#tz") || $("#timezoneValue") || $(".timezone-value");
  const elStatus = $("#status") || $("#ipStatus") || $("#message") || $(".status");

  function setText(el, value) {
    if (!el) return;
    el.textContent = value ?? "";
  }

  function setStatus(msg, ok) {
    if (!elStatus) return;
    elStatus.textContent = msg || "";
    elStatus.classList.remove("success", "error");
    if (ok === true) elStatus.classList.add("success");
    if (ok === false) elStatus.classList.add("error");
  }

  async function loadIp() {
    setStatus("Loading…", null);

    try {
      const res = await fetch("/api/ip", { method: "GET" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setStatus(data?.error || "Failed to load IP info.", false);
        return;
      }

      setText(elIp, data.ip || "Unknown");

      const parts = [data.city, data.region, data.country].filter(Boolean);
      setText(elLocation, parts.length ? parts.join(", ") : "—");

      setText(elIsp, data.isp || "—");
      setText(elTimezone, data.timezone || "—");

      setStatus("", true);
    } catch (e) {
      setStatus("Network error. Please try again.", false);
    }
  }

  loadIp();
});

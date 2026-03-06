// api/ip.js

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) {
    return xff.split(",")[0].trim();
  }
  const xrip = req.headers["x-real-ip"];
  if (typeof xrip === "string" && xrip.length) return xrip.trim();
  return "";
}

async function fetchJson(url) {
  try {
    const r = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "HandyBox/1.0",
      },
    });
    return await r.json();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false });
  }

  res.setHeader("Cache-Control", "no-store");

  const ip = getClientIp(req);

  if (!ip) {
    return res.status(200).json({
      ok: true,
      ip: null,
      country: null,
      city: null,
      region: null,
      postal: null,
      latitude: null,
      longitude: null,
      isp: null,
    });
  }

  // Provider 1: ipapi
  let geo = await fetchJson(`https://ipapi.co/${ip}/json/`);

  if (!geo || geo.error) {
    geo = {};
  }

  // If data weak, try provider 2
  if (!geo.city || !geo.country_name) {
    const alt = await fetchJson(`http://ip-api.com/json/${ip}`);

    if (alt && alt.status === "success") {
      geo = {
        country_name: alt.country,
        city: alt.city,
        region: alt.regionName,
        postal: alt.zip,
        latitude: alt.lat,
        longitude: alt.lon,
        org: alt.isp,
      };
    }
  }

  return res.status(200).json({
    ok: true,
    ip,
    country: geo.country_name || null,
    city: geo.city || null,
    region: geo.region || null,
    postal: geo.postal || null,
    latitude: geo.latitude || null,
    longitude: geo.longitude || null,
    isp: geo.org || null,
  });
}

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

function withTimeout(ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(t) };
}

async function fetchJson(url, timeoutMs = 8000) {
  const { signal, clear } = withTimeout(timeoutMs);
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "user-agent": "HandyBox/1.0 (Vercel Serverless)",
      },
      signal,
    });
    const j = await r.json().catch(() => null);
    return { ok: r.ok, status: r.status, json: j };
  } finally {
    clear();
  }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const ip = getClientIp(req);

    const base = {
      ok: true,
      ip: ip || null,
      country: null,
      city: null,
      region: null,
      postal: null,
      latitude: null,
      longitude: null,
      timezone: null,
      isp: null,
      org: null,
      asn: null,
      geoNote: null,
    };

    if (!ip) {
      return res.status(200).json({
        ...base,
        geoNote: "Could not detect client IP (missing proxy headers).",
      });
    }

    // Geo lookup using ipwho.is SERVER-SIDE (no browser CORS)
    const fields =
      "success,ip,country,city,region,postal,latitude,longitude,timezone,isp,org,asn,message";
    const url = `https://ipwho.is/${encodeURIComponent(ip)}?fields=${fields}`;

    const geoRes = await fetchJson(url, 8000);
    const g = geoRes.json;

    if (!g || g.success === false) {
      return res.status(200).json({
        ...base,
        geoNote: g?.message || "Geo lookup failed.",
      });
    }

    return res.status(200).json({
      ok: true,
      ip: g.ip || ip,
      country: g.country || null,
      city: g.city || null,
      region: g.region || null,
      postal: g.postal || null,
      latitude: typeof g.latitude === "number" ? g.latitude : null,
      longitude: typeof g.longitude === "number" ? g.longitude : null,
      timezone: g.timezone || null,
      isp: g.isp || null,
      org: g.org || null,
      asn: g.asn || null,
      geoNote: null,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Failed to load IP info",
      detail: err?.message ? String(err.message).slice(0, 200) : "Unknown error",
    });
  }
}

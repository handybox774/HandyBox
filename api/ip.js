// api/ip.js

function getClientIp(req) {
  // Vercel / proxies
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) {
    // can be "ip, ip, ip"
    return xff.split(",")[0].trim();
  }
  const xrip = req.headers["x-real-ip"];
  if (typeof xrip === "string" && xrip.length) return xrip.trim();

  // Node fallback (sometimes available)
  return "";
}

function withTimeout(ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(t) };
}

export default async function handler(req, res) {
  // Allow OPTIONS safely
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const ip = getClientIp(req);
    const ua = req.headers["user-agent"] || "";

    // Always return at least IP (even if geo lookup fails)
    const base = {
      ok: true,
      ip: ip || null,
      userAgent: ua || null,
    };

    // If no IP detected, just return base
    if (!ip) return res.status(200).json(base);

    // Server-side fetch: no browser CORS problem
    const fields =
      "success,ip,type,continent,country,region,city,latitude,longitude,timezone,isp,org,asn";
    const url = `https://ipwho.is/${encodeURIComponent(ip)}?fields=${fields}`;

    const { signal, clear } = withTimeout(8000);
    let data = null;

    try {
      const r = await fetch(url, {
        method: "GET",
        headers: {
          "accept": "application/json",
          "user-agent": "HandyBox/1.0 (Vercel Serverless)",
        },
        signal,
      });
      data = await r.json().catch(() => null);
    } finally {
      clear();
    }

    if (!data || data.success === false) {
      // still ok, but no geo
      return res.status(200).json({
        ...base,
        geo: null,
        note: data?.message || "Geo lookup failed",
      });
    }

    return res.status(200).json({
      ok: true,
      ip: data.ip || ip,
      type: data.type || null,
      country: data.country || null,
      region: data.region || null,
      city: data.city || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      timezone: data.timezone || null,
      isp: data.isp || null,
      org: data.org || null,
      asn: data.asn || null,
      userAgent: ua || null,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Failed to detect IP",
      detail: err?.message ? String(err.message).slice(0, 200) : "Unknown error",
    });
  }
}

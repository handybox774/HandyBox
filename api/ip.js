// api/ip.js

function withTimeout(ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(t) };
}

async function safeJson(url, options = {}, timeoutMs = 8000) {
  const { signal, clear } = withTimeout(timeoutMs);
  try {
    const r = await fetch(url, { ...options, signal });
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
    // Get IPv4/IPv6 from ipify (server-side, no CORS issues)
    const [v4, v6] = await Promise.all([
      safeJson("https://api.ipify.org?format=json", { headers: { accept: "application/json" } }, 8000),
      safeJson("https://api64.ipify.org?format=json", { headers: { accept: "application/json" } }, 8000),
    ]);

    const ipv4 = v4?.json?.ip || null;
    const ipv6 = v6?.json?.ip || null;

    // Use IPv4 for geo if available, otherwise IPv6
    const geoIp = ipv4 || ipv6;

    let geo = null;
    if (geoIp) {
      const fields =
        "success,ip,country,city,region,postal,latitude,longitude,timezone,isp,org,asn";
      const geoRes = await safeJson(
        `https://ipwho.is/${encodeURIComponent(geoIp)}?fields=${fields}`,
        { headers: { accept: "application/json" } },
        8000
      );

      if (geoRes?.json && geoRes.json.success !== false) {
        geo = geoRes.json;
      } else {
        geo = { success: false, message: geoRes?.json?.message || "Geo lookup failed" };
      }
    }

    return res.status(200).json({
      ok: true,
      ipv4,
      ipv6,
      geoIp: geoIp || null,
      country: geo?.country || null,
      city: geo?.city || null,
      region: geo?.region || null,
      postal: geo?.postal || null,
      latitude: typeof geo?.latitude === "number" ? geo.latitude : null,
      longitude: typeof geo?.longitude === "number" ? geo.longitude : null,
      timezone: geo?.timezone || null,
      isp: geo?.isp || null,
      org: geo?.org || null,
      asn: geo?.asn || null,
      geoNote: geo?.success === false ? geo.message : null,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Failed to load IP info",
      detail: err?.message ? String(err.message).slice(0, 200) : "Unknown error",
    });
  }
}

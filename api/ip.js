// api/ip.js

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];

  if (typeof xff === "string" && xff.trim()) {
    // Take the first public-facing IP only
    return xff.split(",")[0].trim();
  }

  const xrip = req.headers["x-real-ip"];
  if (typeof xrip === "string" && xrip.trim()) {
    return xrip.trim();
  }

  return "";
}

function withTimeout(ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(t),
  };
}

async function fetchJson(url, timeoutMs = 8000) {
  const { signal, clear } = withTimeout(timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "user-agent": "HandyBox/1.0 (Vercel Serverless)",
      },
      signal,
    });

    const data = await response.json().catch(() => null);

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error,
    };
  } finally {
    clear();
  }
}

async function lookupGeoFromIpapi(ip) {
  const result = await fetchJson(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, 8000);
  const g = result.data;

  if (!result.ok || !g || g.error) return null;

  const latitude = g.latitude != null ? Number(g.latitude) : null;
  const longitude = g.longitude != null ? Number(g.longitude) : null;

  return {
    country: g.country_name || null,
    city: g.city || null,
    region: g.region || null,
    postal: g.postal || null,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    timezone: g.timezone || null,
    isp: g.org || null,
    org: g.org || null,
    asn: g.asn || null,
    source: "ipapi",
  };
}

async function lookupGeoFromIpApi(ip) {
  // ip-api uses HTTP on free tier
  const result = await fetchJson(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,city,regionName,zip,lat,lon,timezone,isp,org,as`, 8000);
  const g = result.data;

  if (!result.ok || !g || g.status !== "success") return null;

  const latitude = g.lat != null ? Number(g.lat) : null;
  const longitude = g.lon != null ? Number(g.lon) : null;

  return {
    country: g.country || null,
    city: g.city || null,
    region: g.regionName || null,
    postal: g.zip || null,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    timezone: g.timezone || null,
    isp: g.isp || null,
    org: g.org || null,
    asn: g.as || null,
    source: "ip-api",
  };
}

async function detectIPv6() {
  const result = await fetchJson("https://api64.ipify.org?format=json", 8000);
  const ip = result?.data?.ip;

  if (typeof ip === "string" && ip.includes(":")) {
    return ip;
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  // Prevent CDN/browser caching so each visitor gets their own real result
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");

  try {
    const ip = getClientIp(req);

    const base = {
      ok: true,
      ip: ip || null,
      ipv6: null,
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
      geoSource: null,
      geoNote: null,
    };

    if (!ip) {
      return res.status(200).json({
        ...base,
        geoNote: "Could not detect client IP.",
      });
    }

    // Run IPv6 detection and geo lookup in parallel
    const [ipv6, geo1] = await Promise.all([
      detectIPv6(),
      lookupGeoFromIpapi(ip),
    ]);

    let geo = geo1;

    // Fallback to second provider if first one is weak or empty
    if (!geo || (!geo.country && !geo.city && !geo.isp)) {
      const geo2 = await lookupGeoFromIpApi(ip);
      if (geo2) geo = geo2;
    }

    return res.status(200).json({
      ok: true,
      ip,
      ipv6: ipv6 || null,
      country: geo?.country || null,
      city: geo?.city || null,
      region: geo?.region || null,
      postal: geo?.postal || null,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      timezone: geo?.timezone || null,
      isp: geo?.isp || null,
      org: geo?.org || null,
      asn: geo?.asn || null,
      geoSource: geo?.source || null,
      geoNote: geo ? null : "Location is approximate or unavailable for this IP.",
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Failed to load IP info",
      detail: err?.message ? String(err.message).slice(0, 200) : "Unknown error",
    });
  }
}

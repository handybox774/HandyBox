// netlify/functions/ipinfo.js
export async function handler(event, context) {
  const h = event.headers || {};
  const ip =
    h["x-nf-client-connection-ip"] ||
    (h["x-forwarded-for"] ? h["x-forwarded-for"].split(",")[0].trim() : "") ||
    context?.ip ||
    "";

  // Geo من Netlify (قد تأتي كـ context.geo في الإنتاج)
  let geo = context?.geo || {};
  if (!geo || Object.keys(geo).length === 0) {
    try { geo = JSON.parse(h["x-nf-geo"] || "{}"); } catch (_) {}
  }

  let isp = null, city = geo?.city || null, countryName = null, zip = null;

  try {
    const url = ip ? `https://ipwho.is/${encodeURIComponent(ip)}` : `https://ipwho.is/`;
    const resp = await fetch(url, { headers: { "user-agent": "handybox.tools" } });
    const data = await resp.json();
    if (data && data.success !== false) {
      isp = data?.connection?.isp || data?.connection?.org || null;
      city = city || data?.city || null;
      zip = zip || data?.postal || data?.zip || null;
      countryName = geo?.country?.name || data?.country || geo?.country || null;
    }
  } catch {
    try {
      const r = await fetch("https://ipapi.co/json/");
      const d = await r.json();
      isp = isp || d?.org || d?.asn || null;
      city = city || d?.city || null;
      zip = zip || d?.postal || d?.postcode || null;
      countryName = countryName || d?.country_name || d?.country || null;
    } catch {}
  }

  if (!countryName) countryName = geo?.country?.name || geo?.country || null;

  const payload = {
    ip: ip || null,
    country: countryName || null,
    city: city || null,
    zip: zip || null,
    isp: isp || null,
    region: geo?.subdivision?.name || geo?.region || null,
    latitude: geo?.latitude || null,
    longitude: geo?.longitude || null
  };

  return {
    statusCode: 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    body: JSON.stringify(payload)
  };
}

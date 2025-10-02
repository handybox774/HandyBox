export default async (request, context) => {
  const ip =
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    '';
  const { city, country, subdivision, latitude, longitude, timezone } = context.geo || {};
  
  return new Response(
    JSON.stringify({
      ip,
      city,
      region: subdivision,
      country,
      latitude,
      longitude,
      timezone
    }),
    { headers: { 'content-type': 'application/json' } }
  );
};

export const config = { path: '/api/ip' };
exports.handler = async (event, context) => {
  try {
    // الحصول على IP من المستخدم
    const ip = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || '1.1.1.1';
    
    // استخدام API من الخادم (HTTPS)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ip: ip,
        country: data.country_name || 'N/A',
        city: data.city || 'N/A',
        isp: data.org || 'N/A',
        zip: data.postal || 'N/A'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch IP data' })
    };
  }
};
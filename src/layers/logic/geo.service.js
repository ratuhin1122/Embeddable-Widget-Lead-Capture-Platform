const config = require('../../config');

/**
 * Geo enrichment service with provider fallback chain.
 * Provider A: ip-api.com (free, no key, 45 req/min)
 * Provider B: ipapi.co (free tier, ~1000 lookups/day)
 *
 * If both providers fail, returns null — submission still succeeds.
 */
const GeoService = {
  /**
   * Enrich an IP address with geolocation data.
   * Tries Provider A, then Provider B. Returns null if all fail.
   */
  async enrich(ipAddress) {
    // Skip private/local IPs
    if (isPrivateIp(ipAddress)) {
      return { country: 'Local', city: 'Localhost', note: 'Private IP — no geo lookup' };
    }

    // Try Provider A
    try {
      const result = await this.fetchProviderA(ipAddress);
      if (result) return result;
    } catch (err) {
      console.warn(`[GEO] Provider A failed for ${ipAddress}: ${err.message}`);
    }

    // Fallback to Provider B
    try {
      const result = await this.fetchProviderB(ipAddress);
      if (result) return result;
    } catch (err) {
      console.warn(`[GEO] Provider B failed for ${ipAddress}: ${err.message}`);
    }

    // Both failed — degrade gracefully
    console.warn(`[GEO] All providers failed for ${ipAddress}. Storing without geo.`);
    return null;
  },

  /**
   * Provider A: ip-api.com
   */
  async fetchProviderA(ipAddress) {
    const url = `${config.geoProviderA}/${ipAddress}?fields=status,country,city,regionName,lat,lon`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      const data = await response.json();

      if (data.status === 'fail') return null;

      return {
        provider: 'ip-api.com',
        country: data.country || null,
        city: data.city || null,
        region: data.regionName || null,
        lat: data.lat || null,
        lon: data.lon || null,
      };
    } finally {
      clearTimeout(timeout);
    }
  },

  /**
   * Provider B: ipapi.co
   */
  async fetchProviderB(ipAddress) {
    const url = `${config.geoProviderB}/${ipAddress}/json/`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      const data = await response.json();

      if (data.error) return null;

      return {
        provider: 'ipapi.co',
        country: data.country_name || null,
        city: data.city || null,
        region: data.region || null,
        lat: data.latitude || null,
        lon: data.longitude || null,
      };
    } finally {
      clearTimeout(timeout);
    }
  },
};

/**
 * Check if an IP is private/local (no geo lookup needed).
 */
function isPrivateIp(ip) {
  if (!ip) return true;
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('192.168.') ||
    ip === 'localhost'
  );
}

module.exports = GeoService;

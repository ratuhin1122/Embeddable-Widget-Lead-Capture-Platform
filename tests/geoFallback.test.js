/**
 * Test: Geo Enrichment Fallback Chain
 * Probe 4: Disable provider A → provider B answers → stored with geo.
 *          Disable both → stored anyway without geo.
 *
 * Uses mocked providers to make the test deterministic.
 */
const GeoService = require('../src/layers/logic/geo.service');

describe('Geo Enrichment Fallback Chain', () => {
  // Save originals
  const originalFetchA = GeoService.fetchProviderA;
  const originalFetchB = GeoService.fetchProviderB;

  afterEach(() => {
    // Restore originals after each test
    GeoService.fetchProviderA = originalFetchA;
    GeoService.fetchProviderB = originalFetchB;
  });

  it('should use Provider A when available', async () => {
    GeoService.fetchProviderA = jest.fn().mockResolvedValue({
      provider: 'ip-api.com',
      country: 'United States',
      city: 'New York',
      region: 'New York',
      lat: 40.7128,
      lon: -74.006,
    });

    const result = await GeoService.enrich('8.8.8.8');

    expect(result).not.toBeNull();
    expect(result.provider).toBe('ip-api.com');
    expect(result.country).toBe('United States');
    expect(GeoService.fetchProviderA).toHaveBeenCalledWith('8.8.8.8');
  });

  it('should fallback to Provider B when Provider A fails', async () => {
    // Provider A fails
    GeoService.fetchProviderA = jest.fn().mockRejectedValue(new Error('Provider A is down'));

    // Provider B succeeds
    GeoService.fetchProviderB = jest.fn().mockResolvedValue({
      provider: 'ipapi.co',
      country: 'Germany',
      city: 'Berlin',
      region: 'Berlin',
      lat: 52.52,
      lon: 13.405,
    });

    const result = await GeoService.enrich('8.8.4.4');

    expect(result).not.toBeNull();
    expect(result.provider).toBe('ipapi.co');
    expect(result.country).toBe('Germany');
    expect(GeoService.fetchProviderA).toHaveBeenCalled();
    expect(GeoService.fetchProviderB).toHaveBeenCalled();
  });

  it('should return null when both providers fail — degrade gracefully', async () => {
    // Both providers fail
    GeoService.fetchProviderA = jest.fn().mockRejectedValue(new Error('Provider A is down'));
    GeoService.fetchProviderB = jest.fn().mockRejectedValue(new Error('Provider B is down'));

    const result = await GeoService.enrich('8.8.8.8');

    // Should return null, NOT throw an error
    expect(result).toBeNull();
  });

  it('should return local stub for private IPs without calling providers', async () => {
    GeoService.fetchProviderA = jest.fn();
    GeoService.fetchProviderB = jest.fn();

    const result = await GeoService.enrich('127.0.0.1');

    expect(result).not.toBeNull();
    expect(result.country).toBe('Local');
    // Should NOT call any provider for private IPs
    expect(GeoService.fetchProviderA).not.toHaveBeenCalled();
    expect(GeoService.fetchProviderB).not.toHaveBeenCalled();
  });

  it('should handle Provider A returning null and fall to Provider B', async () => {
    // Provider A returns null (e.g., invalid IP response)
    GeoService.fetchProviderA = jest.fn().mockResolvedValue(null);

    // Provider B succeeds
    GeoService.fetchProviderB = jest.fn().mockResolvedValue({
      provider: 'ipapi.co',
      country: 'Canada',
      city: 'Toronto',
      region: 'Ontario',
      lat: 43.65,
      lon: -79.38,
    });

    const result = await GeoService.enrich('1.1.1.1');

    expect(result).not.toBeNull();
    expect(result.provider).toBe('ipapi.co');
    expect(result.country).toBe('Canada');
  });
});

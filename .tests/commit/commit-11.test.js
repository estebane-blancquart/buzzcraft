/**
 * Test COMMIT 11 - System Network
 */

import { checkProxyStatus } from '../../app-server/systems/network/proxy.js';
import { checkLoadBalancer } from '../../app-server/systems/network/load-balancer.js';
import { checkSSLCertificate } from '../../app-server/systems/network/ssl.js';

describe('COMMIT 11 - System Network', () => {
  
  // === TESTS PROXY ===
  test('checkProxyStatus - structure retour correcte', async () => {
    const result = await checkProxyStatus('http://localhost:8080');
    
    expect(result).toHaveProperty('proxyUrl');
    expect(result).toHaveProperty('healthy');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('latency');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.proxyUrl).toBe('http://localhost:8080');
    expect(typeof result.healthy).toBe('boolean');
    expect(typeof result.status).toBe('number');
    expect(typeof result.latency).toBe('number');
    expect(typeof result.accessible).toBe('boolean');
  });

  test('checkProxyStatus - accepte options personnalisées', async () => {
    const result = await checkProxyStatus('https://example.com', {
      timeout: 3000,
      headers: { 'User-Agent': 'BuzzCraft' }
    });
    
    expect(result.proxyUrl).toBe('https://example.com');
    expect(result).toHaveProperty('healthy');
    expect(result).toHaveProperty('accessible');
  });

  test('checkProxyStatus - validation entrées invalides', async () => {
    await expect(checkProxyStatus('')).rejects.toThrow('ValidationError');
    await expect(checkProxyStatus(null)).rejects.toThrow('ValidationError');
    await expect(checkProxyStatus('invalid-url')).rejects.toThrow('ValidationError');
    await expect(checkProxyStatus('http://example.com', 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS LOAD BALANCER ===
  test('checkLoadBalancer - structure retour correcte', async () => {
    const config = {
      upstreams: ['server1:80', 'server2:80', 'server3:80']
    };
    const result = await checkLoadBalancer(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('operational');
    expect(result).toHaveProperty('upstreams');
    expect(result).toHaveProperty('healthyNodes');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(result.upstreams).toBe(3);
    expect(typeof result.operational).toBe('boolean');
    expect(typeof result.healthyNodes).toBe('number');
    expect(typeof result.accessible).toBe('boolean');
  });

  test('checkLoadBalancer - accepte options personnalisées', async () => {
    const config = { upstreams: ['server1:80'] };
    const result = await checkLoadBalancer(config, {
      checkUpstreams: false,
      timeout: 1000
    });
    
    expect(result.config).toEqual(config);
    expect(result.upstreams).toBe(1);
    expect(result).toHaveProperty('operational');
  });

  test('checkLoadBalancer - validation entrées invalides', async () => {
    await expect(checkLoadBalancer(null)).rejects.toThrow('ValidationError');
    await expect(checkLoadBalancer('')).rejects.toThrow('ValidationError');
    await expect(checkLoadBalancer({})).rejects.toThrow('ValidationError');
    await expect(checkLoadBalancer({ upstreams: 'invalid' })).rejects.toThrow('ValidationError');
    await expect(checkLoadBalancer({ upstreams: [] }, 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS SSL ===
  test('checkSSLCertificate - structure retour correcte', async () => {
    const result = await checkSSLCertificate('example.com');
    
    expect(result).toHaveProperty('domain');
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('expiresAt');
    expect(result).toHaveProperty('daysUntilExpiry');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.domain).toBe('example.com');
    expect(typeof result.valid).toBe('boolean');
    expect(typeof result.daysUntilExpiry).toBe('number');
    expect(typeof result.accessible).toBe('boolean');
  });

  test('checkSSLCertificate - accepte options personnalisées', async () => {
    const result = await checkSSLCertificate('example.com', {
      port: 443,
      checkExpiry: true
    });
    
    expect(result.domain).toBe('example.com');
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('expiresAt');
  }, 10000);

  test('checkSSLCertificate - validation entrées invalides', async () => {
    await expect(checkSSLCertificate('')).rejects.toThrow('ValidationError');
    await expect(checkSSLCertificate(null)).rejects.toThrow('ValidationError');
    await expect(checkSSLCertificate('invalid..domain')).rejects.toThrow('ValidationError');
    await expect(checkSSLCertificate('-invalid.com')).rejects.toThrow('ValidationError');
    await expect(checkSSLCertificate('example.com', 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS EDGE CASES ===
  test('Gestion des timeouts et erreurs réseau', async () => {
    // Test proxy avec URL inaccessible
    const proxyResult = await checkProxyStatus('http://non-existent-proxy.local');
    expect(proxyResult.accessible).toBe(false);
    expect(proxyResult.healthy).toBe(false);

    // Test load balancer avec config vide
    const lbResult = await checkLoadBalancer({ upstreams: [] });
    expect(lbResult.operational).toBe(false);
    expect(lbResult.upstreams).toBe(0);

    // Test SSL avec domaine inexistant
    const sslResult = await checkSSLCertificate('non-existent-domain.invalid');
    expect(sslResult.accessible).toBe(false);
    expect(sslResult.valid).toBe(false);
  });

});

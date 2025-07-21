/**
 * Test COMMIT 9 - System Cache
 */

import { checkRedisConnection } from '../../app-server/systems/cache/redis.js';
import { checkMemoryCache } from '../../app-server/systems/cache/memory.js';
import { validateCacheKey } from '../../app-server/systems/cache/invalidation.js';

describe('COMMIT 9 - System Cache', () => {
  
  test('checkRedisConnection - structure retour correcte', async () => {
    // Test sans Redis réel - on teste juste que ça ne crash pas
    const result = await checkRedisConnection();
    
    expect(result).toHaveProperty('connectionString');
    expect(result).toHaveProperty('connected');
    expect(result).toHaveProperty('latency');
    expect(result).toHaveProperty('accessible');
    expect(result.connectionString).toBe('redis://localhost:6379');
    expect(typeof result.connected).toBe('boolean');
    expect(typeof result.latency).toBe('number');
    expect(typeof result.accessible).toBe('boolean');
  });

  test('checkRedisConnection - accepte connection string personnalisée', async () => {
    const customConnection = 'redis://redis-server:6380';
    const result = await checkRedisConnection(customConnection);
    
    expect(result.connectionString).toBe(customConnection);
    expect(result).toHaveProperty('connected');
    expect(result).toHaveProperty('latency');
    expect(result).toHaveProperty('accessible');
  });

  test('checkMemoryCache - structure retour correcte', () => {
    const result = checkMemoryCache();
    
    expect(result).toHaveProperty('available');
    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('maxSize');
    expect(result).toHaveProperty('usage');
    expect(result.maxSize).toBe(1000);
    expect(typeof result.available).toBe('boolean');
    expect(typeof result.size).toBe('number');
    expect(result.usage).toHaveProperty('current');
    expect(result.usage).toHaveProperty('percentage');
  });

  test('checkMemoryCache - accepte maxSize personnalisée', () => {
    const result = checkMemoryCache({ maxSize: 500 });
    
    expect(result.maxSize).toBe(500);
    expect(result).toHaveProperty('available');
  });

  test('validateCacheKey - clé valide acceptée', () => {
    const result = validateCacheKey('user:123:profile');
    
    expect(result.key).toBe('user:123:profile');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.validations.length).toBe(true);
    expect(result.validations.pattern).toBe(true);
    expect(result.normalized).toBe('user:123:profile');
  });

  test('validateCacheKey - clé trop longue rejetée', () => {
    const longKey = 'a'.repeat(300);
    const result = validateCacheKey(longKey);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Key too long');
    expect(result.validations.length).toBe(false);
  });

  test('validateCacheKey - clé avec caractères invalides rejetée', () => {
    const result = validateCacheKey('user@invalid#key');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid characters');
    expect(result.validations.pattern).toBe(false);
  });

  test('validateCacheKey - clé avec espaces rejetée', () => {
    const result = validateCacheKey('user key with spaces');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Key cannot contain spaces');
    expect(result.validations.noSpaces).toBe(false);
  });

  test('validateCacheKey - normalisation de clé', () => {
    const result = validateCacheKey('User@123#Profile');
    
    expect(result.normalized).toBe('user-123-profile');
    expect(result.valid).toBe(false); // Invalide à cause des caractères spéciaux
  });

  test('Validation entrées invalides', async () => {
    await expect(checkRedisConnection('')).rejects.toThrow('ValidationError');
    
    expect(() => checkMemoryCache('invalid')).toThrow('ValidationError');
    
    expect(() => validateCacheKey('')).toThrow('ValidationError');
    expect(() => validateCacheKey('test', 'invalid')).toThrow('ValidationError');
  });

});
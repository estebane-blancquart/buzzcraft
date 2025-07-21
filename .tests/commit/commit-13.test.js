/**
 * Test COMMIT 13 - System Security
 */

import { checkAuthSystem } from '../../app-server/systems/security/auth.js';
import { checkEncryptionSupport } from '../../app-server/systems/security/encryption.js';
import { checkPermissionSystem } from '../../app-server/systems/security/permissions.js';

describe('COMMIT 13 - System Security', () => {
  
  // === TESTS AUTH ===
  test('checkAuthSystem - structure retour correcte', async () => {
    const config = {
      provider: 'jwt',
      methods: ['token', 'refresh']
    };
    const result = await checkAuthSystem(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('operational');
    expect(result).toHaveProperty('methods');
    expect(result).toHaveProperty('tokenValid');
    expect(result).toHaveProperty('provider');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.operational).toBe('boolean');
    expect(Array.isArray(result.methods)).toBe(true);
    expect(typeof result.tokenValid).toBe('boolean');
    expect(typeof result.accessible).toBe('boolean');
    expect(result.provider).toHaveProperty('name');
    expect(result.provider).toHaveProperty('supported');
  });

  test('checkAuthSystem - accepte options personnalisées', async () => {
    const config = {
      provider: 'oauth',
      methods: ['google', 'github'],
      token: 'valid-token-123'
    };
    const result = await checkAuthSystem(config, {
      validateTokens: true,
      checkExpiry: false
    });
    
    expect(result.config).toEqual(config);
    expect(result.tokenValid).toBe(true);
    expect(result.provider.name).toBe('oauth');
    expect(result.provider.supported).toBe(true);
  });

  test('checkAuthSystem - validation entrées invalides', async () => {
    await expect(checkAuthSystem(null)).rejects.toThrow('ValidationError');
    await expect(checkAuthSystem('')).rejects.toThrow('ValidationError');
    await expect(checkAuthSystem({})).rejects.toThrow('ValidationError');
    await expect(checkAuthSystem({ provider: '' })).rejects.toThrow('ValidationError');
    await expect(checkAuthSystem({ provider: 'valid' }, 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS ENCRYPTION ===
  test('checkEncryptionSupport - structure retour correcte', () => {
    const result = checkEncryptionSupport('aes');
    
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('supported');
    expect(result).toHaveProperty('strength');
    expect(result).toHaveProperty('algorithms');
    expect(result).toHaveProperty('keySize');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.type).toBe('aes');
    expect(typeof result.supported).toBe('boolean');
    expect(typeof result.strength).toBe('string');
    expect(Array.isArray(result.algorithms)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.keySize).toHaveProperty('requested');
    expect(result.keySize).toHaveProperty('minimum');
    expect(result.keySize).toHaveProperty('valid');
  });

  test('checkEncryptionSupport - accepte options personnalisées', () => {
    const result = checkEncryptionSupport('rsa', {
      keySize: 2048,
      testMode: true
    });
    
    expect(result.type).toBe('rsa');
    expect(result.keySize.requested).toBe(2048);
    expect(result.keySize.valid).toBe(true);
    expect(result.supported).toBe(true);
    expect(result.strength).toBe('high');
  });

  test('checkEncryptionSupport - validation entrées invalides', () => {
    expect(() => checkEncryptionSupport('')).toThrow('ValidationError');
    expect(() => checkEncryptionSupport(null)).toThrow('ValidationError');
    expect(() => checkEncryptionSupport('invalid-crypto')).toThrow('ValidationError');
    expect(() => checkEncryptionSupport('aes', 'invalid')).toThrow('ValidationError');
  });

  // === TESTS PERMISSIONS ===
  test('checkPermissionSystem - structure retour correcte', () => {
    const config = {
      roles: ['admin', 'user', 'guest'],
      permissions: ['read', 'write', 'delete'],
      model: 'rbac'
    };
    const result = checkPermissionSystem(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('roles');
    expect(result).toHaveProperty('permissions');
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('hierarchy');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.valid).toBe('boolean');
    expect(Array.isArray(result.roles)).toBe(true);
    expect(Array.isArray(result.permissions)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.model).toHaveProperty('type');
    expect(result.model).toHaveProperty('supported');
  });

  test('checkPermissionSystem - accepte options personnalisées', () => {
    const config = {
      roles: [
        { name: 'admin', permissions: ['all'] },
        { name: 'user', permissions: ['read'] }
      ],
      model: 'abac',
      hierarchy: { admin: ['user'], user: [] }
    };
    const result = checkPermissionSystem(config, {
      checkHierarchy: true,
      validateRoles: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.model.type).toBe('abac');
    expect(result.model.supported).toBe(true);
    expect(result.hierarchy).toEqual(config.hierarchy);
  });

  test('checkPermissionSystem - validation entrées invalides', () => {
    expect(() => checkPermissionSystem(null)).toThrow('ValidationError');
    expect(() => checkPermissionSystem('')).toThrow('ValidationError');
    expect(() => checkPermissionSystem({})).toThrow('ValidationError');
    expect(() => checkPermissionSystem({ roles: 'invalid' })).toThrow('ValidationError');
    expect(() => checkPermissionSystem({ roles: [] }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS EDGE CASES ===
  test('Gestion des cas limites et erreurs', async () => {
    // Test auth avec token expiré
    const expiredResult = await checkAuthSystem({
      provider: 'jwt',
      token: 'expired-token',
      methods: ['token']
    });
    expect(expiredResult.tokenValid).toBe(false);
    expect(expiredResult.operational).toBe(false);

    // Test encryption avec keySize insuffisante
    const weakResult = checkEncryptionSupport('rsa', { keySize: 512 });
    expect(weakResult.supported).toBe(false);
    expect(weakResult.keySize.valid).toBe(false);

    // Test permissions avec rôles vides
    const emptyResult = checkPermissionSystem({ roles: [] });
    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.roles).toHaveLength(0);

    // Test provider non supporté
    const unsupportedResult = await checkAuthSystem({
      provider: 'unknown-provider',
      methods: ['test']
    });
    expect(unsupportedResult.provider.supported).toBe(false);
    expect(unsupportedResult.operational).toBe(false);
  });

});

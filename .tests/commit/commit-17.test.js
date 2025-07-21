/**
 * Test COMMIT 17 - System Tenancy
 */

import { checkTenantIsolation } from '../../app-server/systems/tenancy/isolation.js';
import { checkTenantQuotas } from '../../app-server/systems/tenancy/quotas.js';
import { checkMultiTenantArchitecture } from '../../app-server/systems/tenancy/multi-tenant.js';

describe('COMMIT 17 - System Tenancy', () => {
  
  // === TESTS ISOLATION ===
  test('checkTenantIsolation - structure retour correcte', () => {
    const config = {
      level: 'schema',
      tenantId: 'tenant-123',
      encryption: true,
      auth: true
    };
    const result = checkTenantIsolation(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('isolated');
    expect(result).toHaveProperty('level');
    expect(result).toHaveProperty('tenantId');
    expect(result).toHaveProperty('boundaries');
    expect(result).toHaveProperty('security');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.isolated).toBe('boolean');
    expect(typeof result.tenantId).toBe('string');
    expect(typeof result.accessible).toBe('boolean');
    expect(result.level).toHaveProperty('name');
    expect(result.level).toHaveProperty('supported');
    expect(result.boundaries).toHaveProperty('data');
    expect(result.boundaries).toHaveProperty('network');
    expect(result.boundaries).toHaveProperty('compute');
  });

  test('checkTenantIsolation - accepte options personnalisées', () => {
    const config = {
      level: 'container',
      tenantId: 'enterprise-tenant',
      encryption: true,
      loadBalancer: true,
      monitoring: true
    };
    const result = checkTenantIsolation(config, {
      checkNetworking: true,
      validateStorage: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.level.name).toBe('container');
    expect(result.level.supported).toBe(true);
    expect(result.boundaries.data.database).toBe(true);
    expect(result.boundaries.network.vpc).toBe(true);
    expect(result.security.authentication).toBe(true);
  });

  test('checkTenantIsolation - validation entrées invalides', () => {
    expect(() => checkTenantIsolation(null)).toThrow('ValidationError');
    expect(() => checkTenantIsolation('')).toThrow('ValidationError');
    expect(() => checkTenantIsolation({})).toThrow('ValidationError');
    expect(() => checkTenantIsolation({ level: '' })).toThrow('ValidationError');
    expect(() => checkTenantIsolation({ level: 'valid' }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS QUOTAS ===
  test('checkTenantQuotas - structure retour correcte', async () => {
    const config = {
      tenantId: 'tenant-456',
      plan: 'standard',
      hardLimits: true
    };
    const result = await checkTenantQuotas(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('enforced');
    expect(result).toHaveProperty('tenantId');
    expect(result).toHaveProperty('plan');
    expect(result).toHaveProperty('limits');
    expect(result).toHaveProperty('usage');
    expect(result).toHaveProperty('validation');
    expect(result).toHaveProperty('enforcement');
    expect(result).toHaveProperty('billing');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.enforced).toBe('boolean');
    expect(typeof result.tenantId).toBe('string');
    expect(typeof result.accessible).toBe('boolean');
    expect(result.plan).toHaveProperty('name');
    expect(result.plan).toHaveProperty('supported');
  });

  test('checkTenantQuotas - accepte options personnalisées', async () => {
    const config = {
      tenantId: 'premium-tenant',
      plan: 'premium',
      limits: {
        users: 150,
        storage: '50GB',
        requests: 50000,
        databases: 5
      },
      metered: true,
      overage: true
    };
    const result = await checkTenantQuotas(config, {
      checkUsage: true,
      validateLimits: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.plan.name).toBe('premium');
    expect(result.plan.supported).toBe(true);
    expect(result.limits.users).toBe(150);
    expect(result.billing.metered).toBe(true);
    expect(result.billing.overage).toBe(true);
  });

  test('checkTenantQuotas - validation entrées invalides', async () => {
    await expect(checkTenantQuotas(null)).rejects.toThrow('ValidationError');
    await expect(checkTenantQuotas('')).rejects.toThrow('ValidationError');
    await expect(checkTenantQuotas({})).rejects.toThrow('ValidationError');
    await expect(checkTenantQuotas({ tenantId: '' })).rejects.toThrow('ValidationError');
    await expect(checkTenantQuotas({ tenantId: 'valid' }, 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS MULTI-TENANT ===
  test('checkMultiTenantArchitecture - structure retour correcte', () => {
    const config = {
      architecture: 'multi-tenant-isolated',
      maxTenants: 50,
      routing: {
        strategy: 'subdomain'
      }
    };
    const result = checkMultiTenantArchitecture(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('operational');
    expect(result).toHaveProperty('architecture');
    expect(result).toHaveProperty('tenants');
    expect(result).toHaveProperty('routing');
    expect(result).toHaveProperty('scaling');
    expect(result).toHaveProperty('dataManagement');
    expect(result).toHaveProperty('monitoring');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.operational).toBe('boolean');
    expect(typeof result.accessible).toBe('boolean');
    expect(result.architecture).toHaveProperty('type');
    expect(result.architecture).toHaveProperty('supported');
    expect(result.tenants).toHaveProperty('total');
    expect(result.tenants).toHaveProperty('active');
  });

  test('checkMultiTenantArchitecture - accepte options personnalisées', () => {
    const config = {
      architecture: 'hybrid',
      maxTenants: 200,
      tenants: [
        { id: 'tenant1', status: 'active', plan: 'enterprise' }
      ],
      scaling: {
        autoScaling: true,
        loadBalancer: true
      },
      sharding: 'geographic'
    };
    const result = checkMultiTenantArchitecture(config, {
      validateRouting: true,
      checkScaling: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.architecture.type).toBe('hybrid');
    expect(result.architecture.supported).toBe(true);
    expect(result.tenants.total).toBe(1);
    expect(result.tenants.active).toBe(1);
    expect(result.scaling.autoScaling).toBe(true);
  });

  test('checkMultiTenantArchitecture - validation entrées invalides', () => {
    expect(() => checkMultiTenantArchitecture(null)).toThrow('ValidationError');
    expect(() => checkMultiTenantArchitecture('')).toThrow('ValidationError');
    expect(() => checkMultiTenantArchitecture({})).toThrow('ValidationError');
    expect(() => checkMultiTenantArchitecture({ architecture: '' })).toThrow('ValidationError');
    expect(() => checkMultiTenantArchitecture({ architecture: 'valid' }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS EDGE CASES ===
  test('Gestion des cas limites et erreurs', async () => {
    // Test isolation avec niveau non supporté
    const isolationResult = checkTenantIsolation({
      level: 'unsupported-level',
      tenantId: 'test'
    });
    expect(isolationResult.level.supported).toBe(false);
    expect(isolationResult.isolated).toBe(false);

    // Test quotas avec plan non supporté
    const quotasResult = await checkTenantQuotas({
      tenantId: 'test-tenant',
      plan: 'unknown-plan'
    });
    expect(quotasResult.plan.supported).toBe(false);
    expect(quotasResult.enforced).toBe(false);

    // Test architecture non supportée
    const architectureResult = checkMultiTenantArchitecture({
      architecture: 'unsupported-architecture'
    });
    expect(architectureResult.architecture.supported).toBe(false);
    expect(architectureResult.operational).toBe(false);

    // Test avec tenants dépassant la limite
    const overLimitResult = checkMultiTenantArchitecture({
      architecture: 'multi-tenant-shared',
      maxTenants: 2,
      tenants: [
        { id: 'tenant1', status: 'active' },
        { id: 'tenant2', status: 'active' },
        { id: 'tenant3', status: 'active' }
      ]
    });
    expect(overLimitResult.operational).toBe(false);
  });

});

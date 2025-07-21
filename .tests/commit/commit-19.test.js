/**
 * Test COMMIT 19 - System Compliance
 */

import { checkAuditCompliance } from '../../app-server/systems/compliance/audit.js';
import { checkDataRetention } from '../../app-server/systems/compliance/retention.js';
import { checkGovernanceSystem } from '../../app-server/systems/compliance/governance.js';

describe('COMMIT 19 - System Compliance', () => {
  
  // === TESTS AUDIT ===
  test('checkAuditCompliance - structure retour correcte', async () => {
    const config = {
      standard: 'sox',
      logging: true,
      events: ['login', 'data_access'],
      encryption: true
    };
    const result = await checkAuditCompliance(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('compliant');
    expect(result).toHaveProperty('standard');
    expect(result).toHaveProperty('logs');
    expect(result).toHaveProperty('trails');
    expect(result).toHaveProperty('retention');
    expect(result).toHaveProperty('monitoring');
    expect(result).toHaveProperty('accessControls');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.compliant).toBe('boolean');
    expect(Array.isArray(result.trails)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.standard).toHaveProperty('name');
    expect(result.standard).toHaveProperty('supported');
    expect(result.standard).toHaveProperty('requirements');
  });

  test('checkAuditCompliance - accepte options personnalisées', async () => {
    const config = {
      standard: 'gdpr',
      logging: true,
      encryption: true,
      integrity: true,
      retention: {
        period: '6y',
        backup: true
      }
    };
    const result = await checkAuditCompliance(config, {
      validateLogs: true,
      checkRetention: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.standard.name).toBe('gdpr');
    expect(result.standard.supported).toBe(true);
    expect(result.logs.enabled).toBe(true);
    expect(result.logs.encryption).toBe(true);
    expect(result.retention.period).toBe('6y');
  });

  test('checkAuditCompliance - validation entrées invalides', async () => {
    await expect(checkAuditCompliance(null)).rejects.toThrow('ValidationError');
    await expect(checkAuditCompliance('')).rejects.toThrow('ValidationError');
    await expect(checkAuditCompliance({})).rejects.toThrow('ValidationError');
    await expect(checkAuditCompliance({ standard: '' })).rejects.toThrow('ValidationError');
    await expect(checkAuditCompliance({ standard: 'valid' }, 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS RETENTION ===
  test('checkDataRetention - structure retour correcte', () => {
    const config = {
      defaultPeriod: '7y',
      policies: [
        { dataType: 'personal', period: '6y' },
        { dataType: 'financial', period: '7y' }
      ],
      archival: true
    };
    const result = checkDataRetention(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('enforced');
    expect(result).toHaveProperty('defaultPeriod');
    expect(result).toHaveProperty('policies');
    expect(result).toHaveProperty('dataTypes');
    expect(result).toHaveProperty('archival');
    expect(result).toHaveProperty('lifecycle');
    expect(result).toHaveProperty('compliance');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.enforced).toBe('boolean');
    expect(typeof result.defaultPeriod).toBe('string');
    expect(Array.isArray(result.policies)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
  });

  test('checkDataRetention - accepte options personnalisées', () => {
    const config = {
      defaultPeriod: '3y',
      policies: ['30d', '1y'],
      archivalStrategy: 'automatic',
      archivalStorage: 'glacier',
      gdpr: true,
      rightToErasure: true
    };
    const result = checkDataRetention(config, {
      validatePolicies: true,
      checkArchival: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.defaultPeriod).toBe('3y');
    expect(result.archival.strategy).toBe('automatic');
    expect(result.archival.storage).toBe('glacier');
    expect(result.compliance.gdpr).toBe(true);
    expect(result.compliance.rightToErasure).toBe(true);
  });

  test('checkDataRetention - validation entrées invalides', () => {
    expect(() => checkDataRetention(null)).toThrow('ValidationError');
    expect(() => checkDataRetention('')).toThrow('ValidationError');
    expect(() => checkDataRetention({})).toThrow('ValidationError');
    expect(() => checkDataRetention({ defaultPeriod: '' })).toThrow('ValidationError');
    expect(() => checkDataRetention({ defaultPeriod: '1y' }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS GOVERNANCE ===
  test('checkGovernanceSystem - structure retour correcte', () => {
    const config = {
      framework: 'cobit',
      maturity: 'defined',
      controls: {
        access: true,
        change: true
      }
    };
    const result = checkGovernanceSystem(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('operational');
    expect(result).toHaveProperty('framework');
    expect(result).toHaveProperty('controls');
    expect(result).toHaveProperty('policies');
    expect(result).toHaveProperty('riskManagement');
    expect(result).toHaveProperty('stakeholders');
    expect(result).toHaveProperty('reporting');
    expect(result).toHaveProperty('improvement');
    expect(result).toHaveProperty('effectiveness');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.operational).toBe('boolean');
    expect(Array.isArray(result.policies)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.framework).toHaveProperty('name');
    expect(result.framework).toHaveProperty('supported');
    expect(result.effectiveness).toHaveProperty('controls');
    expect(result.effectiveness).toHaveProperty('policies');
    expect(result.effectiveness).toHaveProperty('overall');
  });

  test('checkGovernanceSystem - accepte options personnalisées', () => {
    const config = {
      framework: 'itil',
      maturity: 'managed',
      policies: [
        {
          name: 'Security Policy',
          version: '2.0',
          status: 'active',
          owner: 'CISO'
        }
      ],
      riskRegister: true,
      riskAssessment: true
    };
    const result = checkGovernanceSystem(config, {
      validateControls: true,
      checkPolicies: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.framework.name).toBe('itil');
    expect(result.framework.maturity).toBe('managed');
    expect(result.policies).toHaveLength(1);
    expect(result.riskManagement.register).toBe(true);
    expect(result.riskManagement.assessment).toBe(true);
  });

  test('checkGovernanceSystem - validation entrées invalides', () => {
    expect(() => checkGovernanceSystem(null)).toThrow('ValidationError');
    expect(() => checkGovernanceSystem('')).toThrow('ValidationError');
    expect(() => checkGovernanceSystem({})).toThrow('ValidationError');
    expect(() => checkGovernanceSystem({ framework: '' })).toThrow('ValidationError');
    expect(() => checkGovernanceSystem({ framework: 'valid' }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS EDGE CASES ===
  test('Gestion des cas limites et erreurs', async () => {
    // Test audit avec standard non supporté
    const auditResult = await checkAuditCompliance({
      standard: 'unsupported-standard',
      logging: false
    });
    expect(auditResult.standard.supported).toBe(false);
    expect(auditResult.compliant).toBe(false);

    // Test retention avec période invalide
    const retentionResult = checkDataRetention({
      defaultPeriod: 'invalid-period',
      policies: []
    });
    expect(retentionResult.enforced).toBe(false);

    // Test governance avec framework non supporté
    const governanceResult = checkGovernanceSystem({
      framework: 'unknown-framework',
      maturity: 'invalid-maturity'
    });
    expect(governanceResult.framework.supported).toBe(false);
    expect(governanceResult.framework.maturityValid).toBe(false);
    expect(governanceResult.operational).toBe(false);

    // Test audit sans logging requis pour SOX
    const soxResult = await checkAuditCompliance({
      standard: 'sox',
      logging: false,
      integrity: false
    });
    expect(soxResult.compliant).toBe(false);

    // Test governance avec aucun contrôle
    const noControlsResult = checkGovernanceSystem({
      framework: 'cobit',
      controls: {
        access: false,
        change: false,
        risk: false,
        compliance: false
      }
    });
    expect(noControlsResult.effectiveness.controls).toBe(0);
    expect(noControlsResult.operational).toBe(false);
  });

});

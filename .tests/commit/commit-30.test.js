/**
 * Test COMMIT 30 - Transition Migrate
 */

import { validateMigrate } from '../../app-server/transitions/migrate/validation.js';
import { executeMigrate } from '../../app-server/transitions/migrate/action.js';
import { cleanupMigrate } from '../../app-server/transitions/migrate/cleanup.js';

describe('COMMIT 30 - Transition Migrate', () => {
  
  // === TESTS VALIDATION ===
  describe('validateMigrate', () => {
    
    test('valide transition DRAFT→BUILT avec contexte complet', async () => {
      const context = {
        projectId: 'test-migrate-project',
        targetEnvironment: 'production',
        migrateConfig: {
          strategy: 'blue-green',
          preserveData: true,
          targetVersion: '2.0.0',
          allowDowngrade: false,
          forceUnsafe: false
        }
      };
      
      const result = await validateMigrate('DRAFT', 'BUILT', context);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(true);
      expect(result.requirements).toEqual([]);
    });
    
    test('valide différentes transitions sûres', async () => {
      const context = {
        projectId: 'test-safe-transitions',
        targetEnvironment: 'staging',
        migrateConfig: {
          strategy: 'rolling',
          preserveData: true,
          targetVersion: '1.5.0',
          allowDowngrade: true,
          forceUnsafe: false
        }
      };
      
      const safeTransitions = [
        { from: 'VOID', to: 'DRAFT' },
        { from: 'DRAFT', to: 'BUILT' },
        { from: 'BUILT', to: 'OFFLINE' },
        { from: 'OFFLINE', to: 'ONLINE' },
        { from: 'ONLINE', to: 'OFFLINE' }
      ];
      
      for (const transition of safeTransitions) {
        const result = await validateMigrate(transition.from, transition.to, context);
        expect(result.valid).toBe(true);
        expect(result.canTransition).toBe(true);
      }
    });
    
    test('rejette transition vers même état', async () => {
      const context = {
        projectId: 'test-same-state',
        targetEnvironment: 'test',
        migrateConfig: {
          strategy: 'inmem',
          preserveData: false,
          targetVersion: '1.0.0',
          allowDowngrade: false
        }
      };
      
      await expect(validateMigrate('DRAFT', 'DRAFT', context))
        .rejects.toThrow('ValidationError');
      
      await expect(validateMigrate('ONLINE', 'ONLINE', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('rejette transitions dangereuses sans forceUnsafe', async () => {
      const context = {
        projectId: 'test-dangerous',
        targetEnvironment: 'production',
        migrateConfig: {
          strategy: 'direct',
          preserveData: true,
          targetVersion: '2.0.0',
          allowDowngrade: false,
          forceUnsafe: false
        }
      };
      
      const dangerousTransitions = [
        { from: 'ONLINE', to: 'VOID' },
        { from: 'BUILT', to: 'VOID' },
        { from: 'ONLINE', to: 'DRAFT' }
      ];
      
      for (const transition of dangerousTransitions) {
        const result = await validateMigrate(transition.from, transition.to, context);
        expect(result.canTransition).toBe(false);
        expect(result.requirements).toContain('Transition dangereuse - forceUnsafe requis');
      }
    });
    
    test('autorise transitions dangereuses avec forceUnsafe', async () => {
      const context = {
        projectId: 'test-force-unsafe',
        targetEnvironment: 'development',
        migrateConfig: {
          strategy: 'emergency',
          preserveData: false,
          targetVersion: '0.1.0',
          allowDowngrade: true,
          forceUnsafe: true
        }
      };
      
      const result = await validateMigrate('ONLINE', 'VOID', context);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(true);
      expect(result.requirements).toEqual([]);
    });
    
    test('détecte prérequis manquants', async () => {
      const contextIncomplet = {
        projectId: 'test-incomplete'
        // manque migrateConfig et targetEnvironment
      };
      
      const result = await validateMigrate('DRAFT', 'BUILT', contextIncomplet);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toEqual([
        'migrateConfig manquant',
        'targetEnvironment manquant'
      ]);
    });
    
    test('détecte configuration migration incomplète', async () => {
      const contextConfig = {
        projectId: 'test-incomplete-config',
        targetEnvironment: 'staging',
        migrateConfig: {
          // manque tous les champs requis
          description: 'Migration incomplète'
        }
      };
      
      const result = await validateMigrate('OFFLINE', 'ONLINE', contextConfig);
      
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toContain('migrateConfig.strategy manquant');
      expect(result.requirements).toContain('migrateConfig.preserveData manquant');
      expect(result.requirements).toContain('migrateConfig.targetVersion manquant');
      expect(result.requirements).toContain('migrateConfig.allowDowngrade manquant');
    });
    
    test('rejette états invalides', async () => {
      const context = {
        projectId: 'test-invalid-states',
        targetEnvironment: 'test',
        migrateConfig: {
          strategy: 'test',
          preserveData: true,
          targetVersion: '1.0.0',
          allowDowngrade: false
        }
      };
      
      await expect(validateMigrate('INVALID', 'DRAFT', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateMigrate('DRAFT', 'UNKNOWN', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('validation paramètres entrée stricte', async () => {
      const context = {
        projectId: 'test-params',
        targetEnvironment: 'test',
        migrateConfig: {
          strategy: 'test',
          preserveData: true,
          targetVersion: '1.0.0',
          allowDowngrade: false
        }
      };
      
      await expect(validateMigrate(null, 'BUILT', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateMigrate('DRAFT', null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateMigrate('DRAFT', 'BUILT', null))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS ACTION ===
  describe('executeMigrate', () => {
    
    test('exécute transition atomique OFFLINE→ONLINE', async () => {
      const projectId = 'test-migrate-execution';
      const context = {
        fromState: 'OFFLINE',
        toState: 'ONLINE',
        projectId: 'test-migrate-execution',
        targetEnvironment: 'production',
        migrateConfig: {
          strategy: 'blue-green',
          preserveData: true,
          targetVersion: '2.1.0',
          allowDowngrade: false,
          forceUnsafe: false
        }
      };
      
      const result = await executeMigrate(projectId, context);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe('OFFLINE');
      expect(result.toState).toBe('ONLINE');
      expect(result.timestamp).toBeDefined();
      expect(result.transitionData.projectId).toBe(projectId);
      expect(result.transitionData.context.migrateConfig).toEqual(context.migrateConfig);
      expect(result.transitionData.context.targetEnvironment).toBe('production');
    });
    
    test('applique valeurs par défaut', async () => {
      const result = await executeMigrate('test-defaults', {
        projectId: 'test-defaults',
        targetEnvironment: 'test',
        migrateConfig: { strategy: 'simple', preserveData: true, targetVersion: '1.0.0', allowDowngrade: false }
      });
      
      expect(result.fromState).toBe('UNKNOWN');
      expect(result.toState).toBe('DRAFT');
      expect(result.transitionData.context.migrationStrategy).toBe('simple');
      expect(result.transitionData.context.preserveData).toBe(true);
      expect(result.transitionData.context.allowDowngrade).toBe(false);
      expect(result.transitionData.context.forceUnsafe).toBe(false);
    });
    
    test('gère migration dangereuse forcée', async () => {
      const result = await executeMigrate('test-dangerous-forced', {
        fromState: 'ONLINE',
        toState: 'VOID',
        projectId: 'test-dangerous-forced',
        targetEnvironment: 'emergency',
        migrateConfig: {
          strategy: 'emergency-shutdown',
          preserveData: false,
          targetVersion: '0.0.0',
          allowDowngrade: true,
          forceUnsafe: true
        }
      });
      
      expect(result.fromState).toBe('ONLINE');
      expect(result.toState).toBe('VOID');
      expect(result.transitionData.context.forceUnsafe).toBe(true);
      expect(result.transitionData.context.preserveData).toBe(false);
      expect(result.transitionData.context.migrationStrategy).toBe('emergency-shutdown');
    });
    
    test('validation paramètres action stricte', async () => {
      const context = {
        fromState: 'BUILT',
        toState: 'OFFLINE',
        projectId: 'test-params',
        targetEnvironment: 'test',
        migrateConfig: { strategy: 'test', preserveData: true, targetVersion: '1.0.0', allowDowngrade: false }
      };
      
      await expect(executeMigrate(null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeMigrate('', context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeMigrate('test-project', null))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure retour cohérente', async () => {
      const result = await executeMigrate('test-structure', {
        fromState: 'BUILT',
        toState: 'OFFLINE',
        projectId: 'test-structure',
        targetEnvironment: 'staging',
        migrateConfig: { strategy: 'rolling', preserveData: true, targetVersion: '1.5.0', allowDowngrade: false }
      });
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('fromState');
      expect(result).toHaveProperty('toState');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('transitionData');
      
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.fromState).toBe('string');
      expect(typeof result.toState).toBe('string');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.transitionData).toBe('object');
    });
    
  });

  // === TESTS CLEANUP ===
  describe('cleanupMigrate', () => {
    
    test('nettoie après migration réussie avec préservation données', async () => {
      const transitionResult = {
        success: true,
        fromState: 'DRAFT',
        toState: 'BUILT',
        timestamp: new Date().toISOString(),
        transitionData: {
          context: {
            preserveData: true
          }
        }
      };
      
      const result = await cleanupMigrate(transitionResult, 'test-migrate-success');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('validate-post-migration-integrity');
      expect(result.actions).toContain('update-state-configurations');
      expect(result.actions).toContain('cleanup-old-state-configurations');
      expect(result.actions).toContain('create-post-migration-snapshot');
      expect(result.actions).toContain('update-state-registries');
      expect(result.actions).toContain('finalize-migration-process');
      expect(result.actions).toContain('notify-services-state-change');
      expect(result.actions).toContain('clear-validation-cache');
      expect(result.actions).toContain('cleanup-migration-temp-files');
      expect(result.actions).toContain('optimize-post-migration-config');
      expect(result.actions).toContain('update-migration-metrics');
      expect(Array.isArray(result.actions)).toBe(true);
    });
    
    test('nettoie après migration échouée avec rollback', async () => {
      const transitionResult = {
        success: false,
        fromState: 'ONLINE',
        toState: 'OFFLINE',
        timestamp: new Date().toISOString(),
        transitionData: {
          context: {
            preserveData: true
          }
        }
      };
      
      const result = await cleanupMigrate(transitionResult, 'test-migrate-failed');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('attempt-rollback-to-previous-state');
      expect(result.actions).toContain('restore-preserved-data');
      expect(result.actions).toContain('alert-migration-failure');
      expect(result.actions).toContain('analyze-migration-failure');
      expect(result.actions).toContain('cleanup-partial-migration-artifacts');
      expect(result.actions).toContain('clear-validation-cache');
    });
    
    test('nettoie après migration échouée sans préservation', async () => {
      const transitionResult = {
        success: false,
        fromState: 'BUILT',
        toState: 'VOID',
        timestamp: new Date().toISOString(),
        transitionData: {
          context: {
            preserveData: false
          }
        }
      };
      
      const result = await cleanupMigrate(transitionResult, 'test-migrate-no-preserve');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).not.toContain('restore-preserved-data');
      expect(result.actions).toContain('attempt-rollback-to-previous-state');
      expect(result.actions).toContain('alert-migration-failure');
    });
    
    test('nettoie logs anciens de migration', async () => {
      const oldTimestamp = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 60 min ago
      const transitionResult = {
        success: true,
        fromState: 'OFFLINE',
        toState: 'ONLINE', 
        timestamp: oldTimestamp,
        transitionData: { context: { preserveData: true } }
      };
      
      const result = await cleanupMigrate(transitionResult, 'test-migrate-old-logs');
      
      expect(result.actions).toContain('cleanup-old-migration-logs');
    });
    
    test('validation paramètres cleanup stricte', async () => {
      const validTransition = {
        success: true,
        timestamp: new Date().toISOString(),
        transitionData: { context: {} }
      };
      
      await expect(cleanupMigrate(null, 'test-project'))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupMigrate(validTransition, null))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupMigrate(validTransition, ''))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration validation→action→cleanup', () => {
    
    test('workflow complet transition MIGRATE', async () => {
      const projectId = 'integration-migrate-test';
      const context = {
        fromState: 'BUILT',
        toState: 'OFFLINE',
        projectId: 'integration-migrate-test',
        targetEnvironment: 'production',
        migrateConfig: {
          strategy: 'blue-green',
          preserveData: true,
          targetVersion: '2.0.0',
          allowDowngrade: false,
          forceUnsafe: false
        }
      };
      
      // 1. Validation
      const validation = await validateMigrate('BUILT', 'OFFLINE', context);
      expect(validation.canTransition).toBe(true);
      
      // 2. Action
      const action = await executeMigrate(projectId, context);
      expect(action.success).toBe(true);
      
      // 3. Cleanup 
      const cleanup = await cleanupMigrate(action, projectId);
      expect(cleanup.cleaned).toBe(true);
      
      // Vérifier cohérence
      expect(action.fromState).toBe('BUILT');
      expect(action.toState).toBe('OFFLINE');
      expect(cleanup.actions.length).toBeGreaterThan(0);
    });
    
    test('workflow avec validation qui bloque - transition dangereuse', async () => {
      const context = {
        projectId: 'test-dangerous-blocked',
        targetEnvironment: 'production',
        migrateConfig: {
          strategy: 'direct',
          preserveData: true,
          targetVersion: '0.1.0',
          allowDowngrade: true,
          forceUnsafe: false // Pas de forceUnsafe
        }
      };
      
      const validation = await validateMigrate('ONLINE', 'VOID', context);
      expect(validation.canTransition).toBe(false);
      expect(validation.requirements).toContain('Transition dangereuse - forceUnsafe requis');
      
      // Ne pas continuer si validation échoue
      console.log('✅ Validation bloque correctement la transition MIGRATE dangereuse');
    });
    
  });

});

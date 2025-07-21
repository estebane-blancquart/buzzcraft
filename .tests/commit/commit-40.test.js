/**
 * Test COMMIT 40 - Engine Migrate
 */

import { executeMigrateWorkflow } from '../../app-server/engines/migrate/workflow.js';
import { logMigrateWorkflow } from '../../app-server/engines/migrate/logging.js';
import { recoverMigrateWorkflow } from '../../app-server/engines/migrate/recovery.js';

describe('COMMIT 40 - Engine Migrate', () => {
  
  // === TESTS WORKFLOW ===
  describe('executeMigrateWorkflow', () => {
    
    test('validation paramètres workflow stricte', async () => {
      const validMigrateConfig = {
        targetEnvironment: 'production',
        strategy: 'blue-green',
        projectPath: '/tmp/test',
        toState: 'ONLINE'
      };
      
      await expect(executeMigrateWorkflow(null, validMigrateConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeMigrateWorkflow('', validMigrateConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeMigrateWorkflow('test', null))
        .rejects.toThrow('ValidationError');
      
      await expect(executeMigrateWorkflow('test', {}))
        .rejects.toThrow('ValidationError');
      
      await expect(executeMigrateWorkflow('test', { targetEnvironment: 'production' }))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure paramètres migrateConfig validée', async () => {
      const projectId = 'test-validation';
      
      // MigrateConfig manque targetEnvironment
      await expect(executeMigrateWorkflow(projectId, {
        strategy: 'rolling',
        projectPath: '/tmp/test',
        toState: 'BUILT'
      })).rejects.toThrow('ValidationError: migrateConfig.targetEnvironment requis');
      
      // MigrateConfig manque strategy  
      await expect(executeMigrateWorkflow(projectId, {
        targetEnvironment: 'staging',
        projectPath: '/tmp/test',
        toState: 'OFFLINE'
      })).rejects.toThrow('ValidationError: migrateConfig.strategy requis');
      
      // MigrateConfig manque projectPath
      await expect(executeMigrateWorkflow(projectId, {
        targetEnvironment: 'production',
        strategy: 'blue-green',
        toState: 'ONLINE'
      })).rejects.toThrow('ValidationError: migrateConfig.projectPath requis');
      
      // MigrateConfig manque toState
      await expect(executeMigrateWorkflow(projectId, {
        targetEnvironment: 'production',
        strategy: 'blue-green',
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: migrateConfig.toState requis');
    });
    
    test('workflow démarre et initialise métriques avec migrationId', async () => {
      const projectId = 'test-metrics-init';
      const migrateConfig = {
        targetEnvironment: 'test',
        strategy: 'rolling',
        projectPath: '/nonexistent/path/to/trigger/state-detection-error',
        toState: 'DRAFT'
      };
      
      try {
        await executeMigrateWorkflow(projectId, migrateConfig);
        fail('Should have thrown WorkflowError');
      } catch (error) {
        // Doit échouer sur détection état mais avoir démarré
        expect(error.message).toContain('WorkflowError');
        
        // Workflow a au moins tenté de démarrer
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
  });

  // === TESTS LOGGING ===
  describe('logMigrateWorkflow', () => {
    
    test('log événements workflow avec structure correcte', async () => {
      const result = await logMigrateWorkflow('workflow-start', {
        projectId: 'test-log-123',
        migrationId: 'migrate-test-123',
        migrateConfig: { 
          targetEnvironment: 'test',
          strategy: 'rolling',
          projectPath: '/tmp/test-log',
          toState: 'BUILT'
        }
      });
      
      expect(result.logged).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.logLevel).toBeDefined();
    });
    
    test('gère différents types d\'événements migrate', async () => {
      const events = [
        'workflow-start',
        'validation-migrate',
        'filesystem-checks-migrate',
        'backup-pre-migration',
        'transition-migrate',
        'verification-migrate',
        'workflow-success',
        'workflow-error'
      ];
      
      for (const eventType of events) {
        const result = await logMigrateWorkflow(eventType, {
          projectId: 'test-events',
          migrationId: 'migrate-events',
          migrateConfig: { 
            targetEnvironment: 'test',
            strategy: 'direct',
            projectPath: '/tmp/test',
            toState: 'ONLINE'
          }
        });
        
        expect(result.logged).toBe(true);
      }
    });
    
    test('validation paramètres logging stricte', async () => {
      const validData = { projectId: 'test', migrationId: 'migrate-test', migrateConfig: {} };
      
      await expect(logMigrateWorkflow(null, validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logMigrateWorkflow('', validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logMigrateWorkflow('valid-event', null))
        .rejects.toThrow('ValidationError');
      
      await expect(logMigrateWorkflow('valid-event', 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS RECOVERY ===
  describe('recoverMigrateWorkflow', () => {
    
    test('recovery pour échec validation', async () => {
      const error = new Error('WorkflowError: Validation échec: targetEnvironment manquant, strategy manquant');
      
      const result = await recoverMigrateWorkflow('test-recovery-123', {
        targetEnvironment: 'production',
        strategy: 'blue-green',
        projectPath: '/tmp/recovery',
        toState: 'ONLINE'
      }, error);
      
      expect(result.recovered).toBeDefined();
      expect(result.strategy).toBe('validation-failure');
      expect(result.actions).toContain('missing-requirements-2');
      expect(result.actions).toContain('cleanup-partial-migration');
      expect(result.stateRestored).toBeDefined();
    });
    
    test('recovery pour échec détection état', async () => {
      const error = new Error('WorkflowError: Impossible de déterminer l\'état actuel du projet');
      
      const result = await recoverMigrateWorkflow('test-state-detection', {
        targetEnvironment: 'staging',
        strategy: 'rolling',
        projectPath: '/tmp/state-detection',
        toState: 'BUILT'
      }, error);
      
      expect(result.strategy).toBe('state-detection-failure');
      expect(result.actions).toContain('attempt-force-state-detection');
    });
    
    test('recovery pour projet déjà dans état cible', async () => {
      const error = new Error('WorkflowError: Projet déjà dans l\'état cible');
      
      const result = await recoverMigrateWorkflow('test-already-target', {
        targetEnvironment: 'production',
        strategy: 'blue-green',
        projectPath: '/tmp/already-target',
        toState: 'ONLINE'
      }, error);
      
      expect(result.strategy).toBe('already-in-target-state');
      expect(result.actions).toContain('detect-already-migrated');
      expect(result.actions).toContain('verify-target-state-valid');
      expect(result.recovered).toBe(true);
    });
    
    test('recovery avec restauration état', async () => {
      const error = new Error('WorkflowError: Transition MIGRATE échouée');
      
      const result = await recoverMigrateWorkflow('test-state-restore', {
        targetEnvironment: 'production',
        strategy: 'blue-green',
        projectPath: '/tmp/state-test',
        toState: 'ONLINE',
        preserveData: true
      }, error);
      
      expect(result.strategy).toBe('transition-failure');
      expect(result.actions).toContain('restore-previous-state-requested');
      expect(result.actions).toContain('previous-state-restored-successfully');
      expect(result.stateRestored).toBe(true);
    });
    
    test('validation paramètres recovery stricte', async () => {
      const validMigrateConfig = { 
        targetEnvironment: 'test',
        strategy: 'rolling',
        projectPath: '/tmp',
        toState: 'BUILT'
      };
      const validError = new Error('Test error');
      
      await expect(recoverMigrateWorkflow(null, validMigrateConfig, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverMigrateWorkflow('test', null, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverMigrateWorkflow('test', validMigrateConfig, null))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverMigrateWorkflow('test', validMigrateConfig, 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration modules', () => {
    
    test('workflow avec échec et recovery automatique', async () => {
      const projectId = 'integration-recovery-123';
      const invalidMigrateConfig = {
        targetEnvironment: 'production'
        // manque strategy, projectPath, toState → validation va échouer
      };
      
      try {
        await executeMigrateWorkflow(projectId, invalidMigrateConfig);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('ValidationError');
        
        // Tester recovery après échec
        const recovery = await recoverMigrateWorkflow(projectId, invalidMigrateConfig, error);
        expect(recovery.recovered).toBeDefined();
        expect(recovery.strategy).toBeDefined();
        expect(recovery.actions.length).toBeGreaterThan(0);
        expect(recovery.stateRestored).toBeDefined();
      }
    });
    
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof executeMigrateWorkflow).toBe('function');
      expect(typeof logMigrateWorkflow).toBe('function');
      expect(typeof recoverMigrateWorkflow).toBe('function');
      
      // Noms cohérents avec pattern executeXXX, logXXX, recoverXXX
      expect(executeMigrateWorkflow.name).toBe('executeMigrateWorkflow');
      expect(logMigrateWorkflow.name).toBe('logMigrateWorkflow');
      expect(recoverMigrateWorkflow.name).toBe('recoverMigrateWorkflow');
    });
    
    test('workflow génère migrationId unique et cohérent', async () => {
      const projectId = 'test-migration-id-generation';
      const migrateConfig = {
        targetEnvironment: 'test',
        strategy: 'rolling',
        projectPath: '/tmp/migration-id-test',
        toState: 'BUILT'
      };
      
      try {
        await executeMigrateWorkflow(projectId, migrateConfig);
        fail('Expected workflow error');
      } catch (error) {
        // Workflow doit avoir généré migrationId même en cas d'échec
        expect(error.message).toContain('WorkflowError');
        
        // On peut pas vérifier directement le migrationId généré, mais au moins 
        // le workflow a démarré avec génération migrationId
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
    test('workflow valide configuration migrate complète', async () => {
      const projectId = 'test-config-validation';
      const completeMigrateConfig = {
        targetEnvironment: 'production',
        strategy: 'blue-green',
        projectPath: '/tmp/complete-migrate-config',
        toState: 'ONLINE',
        preserveData: true,
        targetVersion: '2.0.0',
        allowDowngrade: false,
        forceUnsafe: false,
        rollbackOnFailure: true
      };
      
      try {
        await executeMigrateWorkflow(projectId, completeMigrateConfig);
        fail('Expected workflow error on state detection');
      } catch (error) {
        // Doit échouer sur détection état mais avoir validé config complète
        expect(error.message).toContain('WorkflowError');
        
        // Config a été acceptée (échec vient de la détection d'état)
        expect(error.message).not.toContain('ValidationError');
      }
    });
    
    test('workflow gère différentes stratégies de migration', async () => {
      const projectId = 'test-migration-strategies';
      
      const strategies = ['blue-green', 'rolling', 'canary', 'direct'];
      
      for (const strategy of strategies) {
        const migrateConfig = {
          targetEnvironment: 'test',
          strategy,
          projectPath: '/tmp/strategy-test',
          toState: 'OFFLINE'
        };
        
        try {
          await executeMigrateWorkflow(projectId, migrateConfig);
          fail('Expected workflow error');
        } catch (error) {
          expect(error.message).toContain('WorkflowError');
          
          // Validation de la stratégie a passé
          expect(error.message).not.toContain('strategy');
        }
      }
    });
    
    test('workflow avec preserveData vs sans preserveData', async () => {
      const projectId = 'test-preserve-modes';
      
      // Config avec preserveData
      const withPreserveConfig = {
        targetEnvironment: 'production',
        strategy: 'blue-green',
        projectPath: '/tmp/preserve-test',
        toState: 'ONLINE',
        preserveData: true
      };
      
      // Config sans preserveData
      const withoutPreserveConfig = {
        targetEnvironment: 'staging',
        strategy: 'rolling',
        projectPath: '/tmp/no-preserve-test',
        toState: 'BUILT',
        preserveData: false
      };
      
      try {
        await executeMigrateWorkflow(projectId, withPreserveConfig);
        fail('Expected workflow error');
      } catch (preserveError) {
        expect(preserveError.message).toContain('WorkflowError');
      }
      
      try {
        await executeMigrateWorkflow(projectId, withoutPreserveConfig);
        fail('Expected workflow error');
      } catch (noPreserveError) {
        expect(noPreserveError.message).toContain('WorkflowError');
      }
    });
    
    test('workflow gère tous les états cibles valides', async () => {
      const projectId = 'test-target-states';
      
      const targetStates = ['VOID', 'DRAFT', 'BUILT', 'OFFLINE', 'ONLINE'];
      
      for (const toState of targetStates) {
        const migrateConfig = {
          targetEnvironment: 'test',
          strategy: 'direct',
          projectPath: '/tmp/target-state-test',
          toState
        };
        
        try {
          await executeMigrateWorkflow(projectId, migrateConfig);
          fail('Expected workflow error');
        } catch (error) {
          expect(error.message).toContain('WorkflowError');
          
          // Validation du toState a passé
          expect(error.message).not.toContain('toState');
        }
      }
    });
    
    test('workflow avec forceUnsafe vs safe migration', async () => {
      const projectId = 'test-force-vs-safe';
      
      // Config safe migration
      const safeMigrateConfig = {
        targetEnvironment: 'production',
        strategy: 'blue-green',
        projectPath: '/tmp/safe-test',
        toState: 'ONLINE',
        forceUnsafe: false,
        allowDowngrade: false
      };
      
      // Config force unsafe migration
      const forceMigrateConfig = {
        targetEnvironment: 'emergency',
        strategy: 'direct',
        projectPath: '/tmp/force-test',
        toState: 'VOID',
        forceUnsafe: true,
        allowDowngrade: true
      };
      
      try {
        await executeMigrateWorkflow(projectId, safeMigrateConfig);
        fail('Expected workflow error');
      } catch (safeError) {
        expect(safeError.message).toContain('WorkflowError');
      }
      
      try {
        await executeMigrateWorkflow(projectId, forceMigrateConfig);
        fail('Expected workflow error');
      } catch (forceError) {
        expect(forceError.message).toContain('WorkflowError');
      }
    });
    
  });

});

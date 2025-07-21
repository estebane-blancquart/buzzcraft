/**
 * Test COMMIT 23 - Transition Build
 */

import { validateBuild } from '../../app-server/transitions/build/validation.js';
import { executeBuild } from '../../app-server/transitions/build/action.js';
import { cleanupBuild } from '../../app-server/transitions/build/cleanup.js';

describe('COMMIT 23 - Transition Build', () => {
  
  // === TESTS VALIDATION ===
  describe('validateBuild', () => {
    
    test('valide transition DRAFT→BUILT avec contexte complet', async () => {
      const context = {
        projectId: 'test-project-789',
        projectPath: '/tmp/build-project',
        buildConfig: {
          target: 'production',
          environment: 'node',
          optimization: true
        }
      };
      
      const result = await validateBuild('DRAFT', 'BUILT', context);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(true);
      expect(result.requirements).toEqual([]);
    });
    
    test('rejette transition depuis état non-DRAFT', async () => {
      const context = { 
        projectId: 'test', 
        buildConfig: { target: 'prod', environment: 'node' }, 
        projectPath: '/tmp' 
      };
      
      await expect(validateBuild('VOID', 'BUILT', context))
        .rejects.toThrow('ValidationError');
      
      await expect(validateBuild('BUILT', 'BUILT', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('rejette transition vers état non-BUILT', async () => {
      const context = { 
        projectId: 'test', 
        buildConfig: { target: 'prod', environment: 'node' }, 
        projectPath: '/tmp' 
      };
      
      await expect(validateBuild('DRAFT', 'DRAFT', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateBuild('DRAFT', 'ONLINE', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('détecte prérequis manquants', async () => {
      const contextIncomplet = {
        projectId: 'test-789'
        // manque buildConfig et projectPath
      };
      
      const result = await validateBuild('DRAFT', 'BUILT', contextIncomplet);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toEqual([
        'buildConfig manquant',
        'projectPath manquant'
      ]);
    });
    
    test('détecte configuration build incomplète', async () => {
      const contextConfig = {
        projectId: 'test-789',
        projectPath: '/tmp/test',
        buildConfig: {
          // manque target et environment
          optimization: true
        }
      };
      
      const result = await validateBuild('DRAFT', 'BUILT', contextConfig);
      
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toContain('buildConfig.target manquant');
      expect(result.requirements).toContain('buildConfig.environment manquant');
    });
    
    test('validation paramètres entrée stricte', async () => {
      const context = { 
        projectId: 'test', 
        buildConfig: { target: 'prod', environment: 'node' }, 
        projectPath: '/tmp' 
      };
      
      await expect(validateBuild(null, 'BUILT', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateBuild('DRAFT', null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateBuild('DRAFT', 'BUILT', null))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS ACTION ===
  describe('executeBuild', () => {
    
    test('exécute transition atomique DRAFT→BUILT', async () => {
      const projectId = 'test-build-789';
      const context = {
        projectId: 'test-build-789',
        projectPath: '/tmp/build-test',
        buildConfig: {
          target: 'production',
          environment: 'node',
          optimization: true
        },
        buildType: 'release'
      };
      
      const result = await executeBuild(projectId, context);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe('DRAFT');
      expect(result.toState).toBe('BUILT');
      expect(result.timestamp).toBeDefined();
      expect(result.transitionData.projectId).toBe(projectId);
      expect(result.transitionData.context.buildConfig).toEqual(context.buildConfig);
      expect(result.transitionData.context.buildType).toBe('release');
    });
    
    test('applique valeurs par défaut', async () => {
      const result = await executeBuild('test-default', {
        projectId: 'test-default',
        projectPath: '/tmp/default',
        buildConfig: { target: 'prod', environment: 'node' }
      });
      
      expect(result.transitionData.context.buildType).toBe('production');
      expect(result.transitionData.context.optimization).toBe(true);
    });
    
    test('validation paramètres action stricte', async () => {
      const context = { 
        projectId: 'test', 
        buildConfig: { target: 'prod', environment: 'node' }, 
        projectPath: '/tmp' 
      };
      
      await expect(executeBuild(null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeBuild('', context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeBuild('test-789', null))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure retour cohérente', async () => {
      const result = await executeBuild('test-structure', {
        projectId: 'test-structure',
        projectPath: '/tmp/structure', 
        buildConfig: { target: 'dev', environment: 'node' }
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
  describe('cleanupBuild', () => {
    
    test('nettoie après build réussi', async () => {
      const transitionResult = {
        success: true,
        fromState: 'DRAFT',
        toState: 'BUILT',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupBuild(transitionResult, 'test-build-789');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('cleanup-temp-source-files');
      expect(result.actions).toContain('compress-build-artifacts');
      expect(result.actions).toContain('archive-build-logs');
      expect(result.actions).toContain('finalize-build');
      expect(result.actions).toContain('clear-validation-cache');
      expect(result.actions).toContain('optimize-disk-space');
      expect(Array.isArray(result.actions)).toBe(true);
    });
    
    test('nettoie après build échoué', async () => {
      const transitionResult = {
        success: false,
        fromState: 'DRAFT',
        toState: 'BUILT',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupBuild(transitionResult, 'test-build-789');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('cleanup-partial-build-artifacts');
      expect(result.actions).toContain('clear-compilation-cache');
      expect(result.actions).toContain('rollback-state-to-draft');
      expect(result.actions).toContain('clear-validation-cache');
    });
    
    test('nettoie logs anciens de build', async () => {
      const oldTimestamp = new Date(Date.now() - 45 * 60 * 1000).toISOString(); // 45 min ago
      const transitionResult = {
        success: true,
        fromState: 'DRAFT',
        toState: 'BUILT', 
        timestamp: oldTimestamp
      };
      
      const result = await cleanupBuild(transitionResult, 'test-build-789');
      
      expect(result.actions).toContain('cleanup-old-build-logs');
    });
    
    test('validation paramètres cleanup stricte', async () => {
      const validTransition = {
        success: true,
        timestamp: new Date().toISOString()
      };
      
      await expect(cleanupBuild(null, 'test-789'))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupBuild(validTransition, null))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupBuild(validTransition, ''))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration validation→action→cleanup', () => {
    
    test('workflow complet transition BUILD', async () => {
      const projectId = 'integration-build-789';
      const context = {
        projectId: 'integration-build-789',
        projectPath: '/tmp/integration-build',
        buildConfig: {
          target: 'production',
          environment: 'node',
          optimization: true
        },
        buildType: 'release'
      };
      
      // 1. Validation
      const validation = await validateBuild('DRAFT', 'BUILT', context);
      expect(validation.canTransition).toBe(true);
      
      // 2. Action
      const action = await executeBuild(projectId, context);
      expect(action.success).toBe(true);
      
      // 3. Cleanup 
      const cleanup = await cleanupBuild(action, projectId);
      expect(cleanup.cleaned).toBe(true);
      
      // Vérifier cohérence
      expect(action.fromState).toBe('DRAFT');
      expect(action.toState).toBe('BUILT');
      expect(cleanup.actions.length).toBeGreaterThan(0);
    });
    
    test('workflow avec validation qui bloque', async () => {
      const context = {
        projectId: 'test-789'
        // manque prérequis
      };
      
      const validation = await validateBuild('DRAFT', 'BUILT', context);
      expect(validation.canTransition).toBe(false);
      expect(validation.requirements.length).toBeGreaterThan(0);
      
      // Ne pas continuer si validation échoue
      console.log('✅ Validation bloque correctement la transition BUILD');
    });
    
  });

});

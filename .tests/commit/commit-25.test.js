/**
 * Test COMMIT 25 - Transition Deploy
 */

import { validateDeploy } from '../../app-server/transitions/deploy/validation.js';
import { executeDeploy } from '../../app-server/transitions/deploy/action.js';
import { cleanupDeploy } from '../../app-server/transitions/deploy/cleanup.js';

describe('COMMIT 25 - Transition Deploy', () => {
  
  // === TESTS VALIDATION ===
  describe('validateDeploy', () => {
    
    test('valide transition BUILT→OFFLINE avec contexte complet', async () => {
      const context = {
        projectId: 'test-project-789',
        projectPath: '/tmp/deploy-project',
        deployConfig: {
          target: 'docker',
          environment: 'production',
          port: 8080,
          healthCheck: '/health'
        }
      };
      
      const result = await validateDeploy('BUILT', 'OFFLINE', context);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(true);
      expect(result.requirements).toEqual([]);
    });
    
    test('rejette transition depuis état non-BUILT', async () => {
      const context = { 
        projectId: 'test', 
        deployConfig: { target: 'docker', environment: 'prod', port: 3000 }, 
        projectPath: '/tmp' 
      };
      
      await expect(validateDeploy('VOID', 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
      
      await expect(validateDeploy('DRAFT', 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('rejette transition vers état non-OFFLINE', async () => {
      const context = { 
        projectId: 'test', 
        deployConfig: { target: 'docker', environment: 'prod', port: 3000 }, 
        projectPath: '/tmp' 
      };
      
      await expect(validateDeploy('BUILT', 'BUILT', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateDeploy('BUILT', 'ONLINE', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('détecte prérequis manquants', async () => {
      const contextIncomplet = {
        projectId: 'test-789'
        // manque deployConfig et projectPath
      };
      
      const result = await validateDeploy('BUILT', 'OFFLINE', contextIncomplet);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toEqual([
        'deployConfig manquant',
        'projectPath manquant'
      ]);
    });
    
    test('détecte configuration déploiement incomplète', async () => {
      const contextConfig = {
        projectId: 'test-789',
        projectPath: '/tmp/test',
        deployConfig: {
          // manque target, environment et port
          healthCheck: '/status'
        }
      };
      
      const result = await validateDeploy('BUILT', 'OFFLINE', contextConfig);
      
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toContain('deployConfig.target manquant');
      expect(result.requirements).toContain('deployConfig.environment manquant');
      expect(result.requirements).toContain('deployConfig.port manquant');
    });
    
    test('validation paramètres entrée stricte', async () => {
      const context = { 
        projectId: 'test', 
        deployConfig: { target: 'docker', environment: 'prod', port: 3000 }, 
        projectPath: '/tmp' 
      };
      
      await expect(validateDeploy(null, 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateDeploy('BUILT', null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateDeploy('BUILT', 'OFFLINE', null))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS ACTION ===
  describe('executeDeploy', () => {
    
    test('exécute transition atomique BUILT→OFFLINE', async () => {
      const projectId = 'test-deploy-789';
      const context = {
        projectId: 'test-deploy-789',
        projectPath: '/tmp/deploy-test',
        deployConfig: {
          target: 'docker',
          environment: 'production',
          port: 8080,
          replicas: 3
        },
        deployType: 'kubernetes'
      };
      
      const result = await executeDeploy(projectId, context);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe('BUILT');
      expect(result.toState).toBe('OFFLINE');
      expect(result.timestamp).toBeDefined();
      expect(result.transitionData.projectId).toBe(projectId);
      expect(result.transitionData.context.deployConfig).toEqual(context.deployConfig);
      expect(result.transitionData.context.deployType).toBe('kubernetes');
    });
    
    test('applique valeurs par défaut', async () => {
      const result = await executeDeploy('test-default', {
        projectId: 'test-default',
        projectPath: '/tmp/default',
        deployConfig: { target: 'docker', environment: 'dev', port: 3000 }
      });
      
      expect(result.transitionData.context.deployType).toBe('container');
      expect(result.transitionData.context.autoStart).toBe(true);
      expect(result.transitionData.context.healthCheck).toBe(true);
    });
    
    test('gère options personnalisées', async () => {
      const result = await executeDeploy('test-custom', {
        projectId: 'test-custom',
        projectPath: '/tmp/custom',
        deployConfig: { target: 'docker', environment: 'staging', port: 4000 },
        autoStart: false,
        healthCheck: false
      });
      
      expect(result.transitionData.context.autoStart).toBe(false);
      expect(result.transitionData.context.healthCheck).toBe(false);
    });
    
    test('validation paramètres action stricte', async () => {
      const context = { 
        projectId: 'test', 
        deployConfig: { target: 'docker', environment: 'prod', port: 3000 }, 
        projectPath: '/tmp' 
      };
      
      await expect(executeDeploy(null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeDeploy('', context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeDeploy('test-789', null))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure retour cohérente', async () => {
      const result = await executeDeploy('test-structure', {
        projectId: 'test-structure',
        projectPath: '/tmp/structure', 
        deployConfig: { target: 'docker', environment: 'test', port: 5000 }
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
  describe('cleanupDeploy', () => {
    
    test('nettoie après déploiement réussi', async () => {
      const transitionResult = {
        success: true,
        fromState: 'BUILT',
        toState: 'OFFLINE',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupDeploy(transitionResult, 'test-deploy-789');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('setup-deployment-monitoring');
      expect(result.actions).toContain('create-health-endpoints');
      expect(result.actions).toContain('setup-application-logging');
      expect(result.actions).toContain('register-service-discovery');
      expect(result.actions).toContain('finalize-deployment');
      expect(result.actions).toContain('clear-validation-cache');
      expect(result.actions).toContain('cleanup-build-artifacts');
      expect(result.actions).toContain('optimize-system-resources');
      expect(Array.isArray(result.actions)).toBe(true);
    });
    
    test('nettoie après déploiement échoué', async () => {
      const transitionResult = {
        success: false,
        fromState: 'BUILT',
        toState: 'OFFLINE',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupDeploy(transitionResult, 'test-deploy-789');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('cleanup-partial-containers');
      expect(result.actions).toContain('cleanup-network-configs');
      expect(result.actions).toContain('release-reserved-ports');
      expect(result.actions).toContain('rollback-state-to-built');
      expect(result.actions).toContain('clear-validation-cache');
    });
    
    test('nettoie logs anciens de déploiement', async () => {
      const oldTimestamp = new Date(Date.now() - 75 * 60 * 1000).toISOString(); // 75 min ago
      const transitionResult = {
        success: true,
        fromState: 'BUILT',
        toState: 'OFFLINE', 
        timestamp: oldTimestamp
      };
      
      const result = await cleanupDeploy(transitionResult, 'test-deploy-789');
      
      expect(result.actions).toContain('cleanup-old-deploy-logs');
    });
    
    test('validation paramètres cleanup stricte', async () => {
      const validTransition = {
        success: true,
        timestamp: new Date().toISOString()
      };
      
      await expect(cleanupDeploy(null, 'test-789'))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupDeploy(validTransition, null))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupDeploy(validTransition, ''))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration validation→action→cleanup', () => {
    
    test('workflow complet transition DEPLOY', async () => {
      const projectId = 'integration-deploy-789';
      const context = {
        projectId: 'integration-deploy-789',
        projectPath: '/tmp/integration-deploy',
        deployConfig: {
          target: 'docker',
          environment: 'production',
          port: 8080,
          replicas: 2
        },
        deployType: 'swarm',
        autoStart: true
      };
      
      // 1. Validation
      const validation = await validateDeploy('BUILT', 'OFFLINE', context);
      expect(validation.canTransition).toBe(true);
      
      // 2. Action
      const action = await executeDeploy(projectId, context);
      expect(action.success).toBe(true);
      
      // 3. Cleanup 
      const cleanup = await cleanupDeploy(action, projectId);
      expect(cleanup.cleaned).toBe(true);
      
      // Vérifier cohérence
      expect(action.fromState).toBe('BUILT');
      expect(action.toState).toBe('OFFLINE');
      expect(cleanup.actions.length).toBeGreaterThan(0);
    });
    
    test('workflow avec validation qui bloque', async () => {
      const context = {
        projectId: 'test-789'
        // manque prérequis
      };
      
      const validation = await validateDeploy('BUILT', 'OFFLINE', context);
      expect(validation.canTransition).toBe(false);
      expect(validation.requirements.length).toBeGreaterThan(0);
      
      // Ne pas continuer si validation échoue
      console.log('✅ Validation bloque correctement la transition DEPLOY');
    });
    
  });

});

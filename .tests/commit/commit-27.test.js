/**
 * Test COMMIT 27 - Transition Stop
 */

import { validateStop } from '../../app-server/transitions/stop/validation.js';
import { executeStop } from '../../app-server/transitions/stop/action.js';
import { cleanupStop } from '../../app-server/transitions/stop/cleanup.js';

describe('COMMIT 27 - Transition Stop', () => {
  
  // === TESTS VALIDATION ===
  describe('validateStop', () => {
    
    test('valide transition ONLINE→OFFLINE avec contexte complet', async () => {
      const context = {
        projectId: 'test-project-456',
        deploymentId: 'deploy-789',
        stopConfig: {
          graceful: true,
          timeout: 30000,
          drainConnections: true,
          saveState: false
        }
      };
      
      const result = await validateStop('ONLINE', 'OFFLINE', context);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(true);
      expect(result.requirements).toEqual([]);
    });
    
    test('rejette transition depuis état non-ONLINE', async () => {
      const context = { 
        projectId: 'test', 
        deploymentId: 'deploy-456',
        stopConfig: { graceful: true, timeout: 10000, drainConnections: true }
      };
      
      await expect(validateStop('VOID', 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
      
      await expect(validateStop('DRAFT', 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateStop('BUILT', 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateStop('OFFLINE', 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('rejette transition vers état non-OFFLINE', async () => {
      const context = { 
        projectId: 'test', 
        deploymentId: 'deploy-456',
        stopConfig: { graceful: true, timeout: 10000, drainConnections: true }
      };
      
      await expect(validateStop('ONLINE', 'ONLINE', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateStop('ONLINE', 'BUILT', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('détecte prérequis manquants', async () => {
      const contextIncomplet = {
        projectId: 'test-456'
        // manque stopConfig et deploymentId
      };
      
      const result = await validateStop('ONLINE', 'OFFLINE', contextIncomplet);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toEqual([
        'stopConfig manquant',
        'deploymentId manquant'
      ]);
    });
    
    test('détecte configuration arrêt incomplète', async () => {
      const contextConfig = {
        projectId: 'test-456',
        deploymentId: 'deploy-789',
        stopConfig: {
          // manque graceful, timeout et drainConnections
          saveState: true
        }
      };
      
      const result = await validateStop('ONLINE', 'OFFLINE', contextConfig);
      
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toContain('stopConfig.graceful manquant');
      expect(result.requirements).toContain('stopConfig.timeout manquant');
      expect(result.requirements).toContain('stopConfig.drainConnections manquant');
    });
    
    test('validation paramètres entrée stricte', async () => {
      const context = { 
        projectId: 'test', 
        deploymentId: 'deploy-456',
        stopConfig: { graceful: false, timeout: 5000, drainConnections: false }
      };
      
      await expect(validateStop(null, 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateStop('ONLINE', null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateStop('ONLINE', 'OFFLINE', null))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS ACTION ===
  describe('executeStop', () => {
    
    test('exécute transition atomique ONLINE→OFFLINE', async () => {
      const projectId = 'test-stop-456';
      const context = {
        projectId: 'test-stop-456',
        deploymentId: 'deploy-stop-789',
        stopConfig: {
          graceful: true,
          timeout: 45000,
          drainConnections: true
        },
        stopReason: 'maintenance'
      };
      
      const result = await executeStop(projectId, context);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe('ONLINE');
      expect(result.toState).toBe('OFFLINE');
      expect(result.timestamp).toBeDefined();
      expect(result.transitionData.projectId).toBe(projectId);
      expect(result.transitionData.context.stopConfig).toEqual(context.stopConfig);
      expect(result.transitionData.context.stopReason).toBe('maintenance');
      expect(result.transitionData.context.deploymentId).toBe('deploy-stop-789');
    });
    
    test('applique valeurs par défaut', async () => {
      const result = await executeStop('test-default', {
        projectId: 'test-default',
        deploymentId: 'deploy-default',
        stopConfig: { graceful: true, timeout: 10000, drainConnections: true }
      });
      
      expect(result.transitionData.context.stopReason).toBe('manual');
      expect(result.transitionData.context.gracefulShutdown).toBe(true);
      expect(result.transitionData.context.drainConnections).toBe(true);
    });
    
    test('gère arrêt forcé', async () => {
      const result = await executeStop('test-force', {
        projectId: 'test-force',
        deploymentId: 'deploy-force',
        stopConfig: { graceful: false, timeout: 1000, drainConnections: false },
        stopReason: 'emergency'
      });
      
      expect(result.transitionData.context.gracefulShutdown).toBe(false);
      expect(result.transitionData.context.drainConnections).toBe(false);
      expect(result.transitionData.context.stopReason).toBe('emergency');
    });
    
    test('validation paramètres action stricte', async () => {
      const context = { 
        projectId: 'test', 
        deploymentId: 'deploy-456',
        stopConfig: { graceful: true, timeout: 10000, drainConnections: true }
      };
      
      await expect(executeStop(null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeStop('', context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeStop('test-456', null))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure retour cohérente', async () => {
      const result = await executeStop('test-structure', {
        projectId: 'test-structure',
        deploymentId: 'deploy-structure',
        stopConfig: { graceful: true, timeout: 15000, drainConnections: true }
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
  describe('cleanupStop', () => {
    
    test('nettoie après arrêt réussi', async () => {
      const transitionResult = {
        success: true,
        fromState: 'ONLINE',
        toState: 'OFFLINE',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupStop(transitionResult, 'test-stop-456');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('deactivate-active-monitoring');
      expect(result.actions).toContain('unregister-load-balancer');
      expect(result.actions).toContain('stop-metrics-collection');
      expect(result.actions).toContain('close-network-connections');
      expect(result.actions).toContain('release-system-resources');
      expect(result.actions).toContain('mark-service-stopped');
      expect(result.actions).toContain('notify-service-discovery-stop');
      expect(result.actions).toContain('clear-validation-cache');
      expect(result.actions).toContain('cleanup-shutdown-temp-files');
      expect(result.actions).toContain('archive-final-application-logs');
      expect(Array.isArray(result.actions)).toBe(true);
    });
    
    test('nettoie après arrêt échoué', async () => {
      const transitionResult = {
        success: false,
        fromState: 'ONLINE',
        toState: 'OFFLINE',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupStop(transitionResult, 'test-stop-456');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('attempt-force-shutdown');
      expect(result.actions).toContain('cleanup-pending-connections');
      expect(result.actions).toContain('alert-shutdown-failure');
      expect(result.actions).toContain('keep-online-state');
      expect(result.actions).toContain('clear-validation-cache');
    });
    
    test('nettoie logs anciens d\'arrêt', async () => {
      const oldTimestamp = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 min ago
      const transitionResult = {
        success: true,
        fromState: 'ONLINE',
        toState: 'OFFLINE', 
        timestamp: oldTimestamp
      };
      
      const result = await cleanupStop(transitionResult, 'test-stop-456');
      
      expect(result.actions).toContain('cleanup-old-stop-logs');
    });
    
    test('validation paramètres cleanup stricte', async () => {
      const validTransition = {
        success: true,
        timestamp: new Date().toISOString()
      };
      
      await expect(cleanupStop(null, 'test-456'))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupStop(validTransition, null))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupStop(validTransition, ''))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration validation→action→cleanup', () => {
    
    test('workflow complet transition STOP', async () => {
      const projectId = 'integration-stop-456';
      const context = {
        projectId: 'integration-stop-456',
        deploymentId: 'deploy-integration-789',
        stopConfig: {
          graceful: true,
          timeout: 60000,
          drainConnections: true,
          saveState: true
        },
        stopReason: 'planned-maintenance'
      };
      
      // 1. Validation
      const validation = await validateStop('ONLINE', 'OFFLINE', context);
      expect(validation.canTransition).toBe(true);
      
      // 2. Action
      const action = await executeStop(projectId, context);
      expect(action.success).toBe(true);
      
      // 3. Cleanup 
      const cleanup = await cleanupStop(action, projectId);
      expect(cleanup.cleaned).toBe(true);
      
      // Vérifier cohérence
      expect(action.fromState).toBe('ONLINE');
      expect(action.toState).toBe('OFFLINE');
      expect(cleanup.actions.length).toBeGreaterThan(0);
    });
    
    test('workflow avec validation qui bloque', async () => {
      const context = {
        projectId: 'test-456'
        // manque prérequis
      };
      
      const validation = await validateStop('ONLINE', 'OFFLINE', context);
      expect(validation.canTransition).toBe(false);
      expect(validation.requirements.length).toBeGreaterThan(0);
      
      // Ne pas continuer si validation échoue
      console.log('✅ Validation bloque correctement la transition STOP');
    });
    
  });

});

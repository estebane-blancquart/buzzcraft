/**
 * Test COMMIT 26 - Transition Start
 */

import { validateStart } from '../../app-server/transitions/start/validation.js';
import { executeStart } from '../../app-server/transitions/start/action.js';
import { cleanupStart } from '../../app-server/transitions/start/cleanup.js';

describe('COMMIT 26 - Transition Start', () => {
  
  // === TESTS VALIDATION ===
  describe('validateStart', () => {
    
    test('valide transition OFFLINE→ONLINE avec contexte complet', async () => {
      const context = {
        projectId: 'test-project-123',
        deploymentId: 'deploy-456',
        startConfig: {
          healthCheck: '/api/health',
          timeout: 30000,
          readinessProbe: '/ready',
          livenessProbe: '/alive'
        }
      };
      
      const result = await validateStart('OFFLINE', 'ONLINE', context);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(true);
      expect(result.requirements).toEqual([]);
    });
    
    test('rejette transition depuis état non-OFFLINE', async () => {
      const context = { 
        projectId: 'test', 
        deploymentId: 'deploy-123',
        startConfig: { healthCheck: '/health', timeout: 10000, readinessProbe: '/ready' }
      };
      
      await expect(validateStart('VOID', 'ONLINE', context))
        .rejects.toThrow('ValidationError');
      
      await expect(validateStart('DRAFT', 'ONLINE', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateStart('BUILT', 'ONLINE', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('rejette transition vers état non-ONLINE', async () => {
      const context = { 
        projectId: 'test', 
        deploymentId: 'deploy-123',
        startConfig: { healthCheck: '/health', timeout: 10000, readinessProbe: '/ready' }
      };
      
      await expect(validateStart('OFFLINE', 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateStart('OFFLINE', 'BUILT', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('détecte prérequis manquants', async () => {
      const contextIncomplet = {
        projectId: 'test-123'
        // manque startConfig et deploymentId
      };
      
      const result = await validateStart('OFFLINE', 'ONLINE', contextIncomplet);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toEqual([
        'startConfig manquant',
        'deploymentId manquant'
      ]);
    });
    
    test('détecte configuration démarrage incomplète', async () => {
      const contextConfig = {
        projectId: 'test-123',
        deploymentId: 'deploy-456',
        startConfig: {
          // manque healthCheck, timeout et readinessProbe
          livenessProbe: '/ping'
        }
      };
      
      const result = await validateStart('OFFLINE', 'ONLINE', contextConfig);
      
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toContain('startConfig.healthCheck manquant');
      expect(result.requirements).toContain('startConfig.timeout manquant');
      expect(result.requirements).toContain('startConfig.readinessProbe manquant');
    });
    
    test('validation paramètres entrée stricte', async () => {
      const context = { 
        projectId: 'test', 
        deploymentId: 'deploy-123',
        startConfig: { healthCheck: '/health', timeout: 5000, readinessProbe: '/ready' }
      };
      
      await expect(validateStart(null, 'ONLINE', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateStart('OFFLINE', null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateStart('OFFLINE', 'ONLINE', null))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS ACTION ===
  describe('executeStart', () => {
    
    test('exécute transition atomique OFFLINE→ONLINE', async () => {
      const projectId = 'test-start-123';
      const context = {
        projectId: 'test-start-123',
        deploymentId: 'deploy-789',
        startConfig: {
          healthCheck: '/api/health',
          timeout: 30000,
          readinessProbe: '/ready'
        },
        startMode: 'fast'
      };
      
      const result = await executeStart(projectId, context);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe('OFFLINE');
      expect(result.toState).toBe('ONLINE');
      expect(result.timestamp).toBeDefined();
      expect(result.transitionData.projectId).toBe(projectId);
      expect(result.transitionData.context.startConfig).toEqual(context.startConfig);
      expect(result.transitionData.context.startMode).toBe('fast');
      expect(result.transitionData.context.deploymentId).toBe('deploy-789');
    });
    
    test('applique valeurs par défaut', async () => {
      const result = await executeStart('test-default', {
        projectId: 'test-default',
        deploymentId: 'deploy-default',
        startConfig: { healthCheck: '/health', timeout: 10000, readinessProbe: '/ready' }
      });
      
      expect(result.transitionData.context.startMode).toBe('standard');
      expect(result.transitionData.context.gracefulStart).toBe(true);
      expect(result.transitionData.context.healthCheckEnabled).toBe(true);
    });
    
    test('gère options personnalisées', async () => {
      const result = await executeStart('test-custom', {
        projectId: 'test-custom',
        deploymentId: 'deploy-custom',
        startConfig: { healthCheck: false, timeout: 5000, readinessProbe: '/ping' },
        gracefulStart: false
      });
      
      expect(result.transitionData.context.gracefulStart).toBe(false);
      expect(result.transitionData.context.healthCheckEnabled).toBe(false);
    });
    
    test('validation paramètres action stricte', async () => {
      const context = { 
        projectId: 'test', 
        deploymentId: 'deploy-123',
        startConfig: { healthCheck: '/health', timeout: 10000, readinessProbe: '/ready' }
      };
      
      await expect(executeStart(null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeStart('', context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeStart('test-123', null))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure retour cohérente', async () => {
      const result = await executeStart('test-structure', {
        projectId: 'test-structure',
        deploymentId: 'deploy-structure',
        startConfig: { healthCheck: '/status', timeout: 15000, readinessProbe: '/ready' }
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
  describe('cleanupStart', () => {
    
    test('nettoie après démarrage réussi', async () => {
      const transitionResult = {
        success: true,
        fromState: 'OFFLINE',
        toState: 'ONLINE',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupStart(transitionResult, 'test-start-123');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('activate-full-monitoring');
      expect(result.actions).toContain('register-load-balancer');
      expect(result.actions).toContain('setup-health-alerts');
      expect(result.actions).toContain('enable-metrics-collection');
      expect(result.actions).toContain('mark-service-online');
      expect(result.actions).toContain('notify-service-discovery');
      expect(result.actions).toContain('clear-validation-cache');
      expect(result.actions).toContain('cleanup-startup-temp-files');
      expect(result.actions).toContain('optimize-network-connections');
      expect(Array.isArray(result.actions)).toBe(true);
    });
    
    test('nettoie après démarrage échoué', async () => {
      const transitionResult = {
        success: false,
        fromState: 'OFFLINE',
        toState: 'ONLINE',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupStart(transitionResult, 'test-start-123');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('stop-partially-started-services');
      expect(result.actions).toContain('cleanup-temp-health-endpoints');
      expect(result.actions).toContain('release-network-resources');
      expect(result.actions).toContain('rollback-state-to-offline');
      expect(result.actions).toContain('clear-validation-cache');
    });
    
    test('nettoie logs anciens de démarrage', async () => {
      const oldTimestamp = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // 20 min ago
      const transitionResult = {
        success: true,
        fromState: 'OFFLINE',
        toState: 'ONLINE', 
        timestamp: oldTimestamp
      };
      
      const result = await cleanupStart(transitionResult, 'test-start-123');
      
      expect(result.actions).toContain('cleanup-old-start-logs');
    });
    
    test('validation paramètres cleanup stricte', async () => {
      const validTransition = {
        success: true,
        timestamp: new Date().toISOString()
      };
      
      await expect(cleanupStart(null, 'test-123'))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupStart(validTransition, null))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupStart(validTransition, ''))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration validation→action→cleanup', () => {
    
    test('workflow complet transition START', async () => {
      const projectId = 'integration-start-123';
      const context = {
        projectId: 'integration-start-123',
        deploymentId: 'deploy-integration-456',
        startConfig: {
          healthCheck: '/api/v1/health',
          timeout: 45000,
          readinessProbe: '/ready',
          livenessProbe: '/alive'
        },
        startMode: 'production',
        gracefulStart: true
      };
      
      // 1. Validation
      const validation = await validateStart('OFFLINE', 'ONLINE', context);
      expect(validation.canTransition).toBe(true);
      
      // 2. Action
      const action = await executeStart(projectId, context);
      expect(action.success).toBe(true);
      
      // 3. Cleanup 
      const cleanup = await cleanupStart(action, projectId);
      expect(cleanup.cleaned).toBe(true);
      
      // Vérifier cohérence
      expect(action.fromState).toBe('OFFLINE');
      expect(action.toState).toBe('ONLINE');
      expect(cleanup.actions.length).toBeGreaterThan(0);
    });
    
    test('workflow avec validation qui bloque', async () => {
      const context = {
        projectId: 'test-123'
        // manque prérequis
      };
      
      const validation = await validateStart('OFFLINE', 'ONLINE', context);
      expect(validation.canTransition).toBe(false);
      expect(validation.requirements.length).toBeGreaterThan(0);
      
      // Ne pas continuer si validation échoue
      console.log('✅ Validation bloque correctement la transition START');
    });
    
  });

});

/**
 * COMMIT 37 - Engine Stop
 * 
 * FAIT QUOI : Orchestre workflow arrêt complet ONLINE→OFFLINE
 * REÇOIT : projectId: string, stopConfig: object, options?: object
 * RETOURNE : { success: boolean, projectId: string, finalState: string, stoppedServices: string[], metrics: object }
 * ERREURS : ValidationError si paramètres invalides, WorkflowError si orchestration échoue
 */

import { detectOnlineState } from '../../states/online/detector.js';
import { validateStop } from '../../transitions/stop/validation.js';
import { executeStop } from '../../transitions/stop/action.js';
import { cleanupStop } from '../../transitions/stop/cleanup.js';
import { detectOfflineState } from '../../states/offline/detector.js';
import { checkOutputPath } from '../../systems/filesystem/generator.js';
import { checkProjectExists } from '../../systems/filesystem/project.js';
import { logStopWorkflow } from './logging.js';
import { recoverStopWorkflow } from './recovery.js';

/**
 * Exécute workflow arrêt complet
 */
export async function executeStopWorkflow(projectId, stopConfig, options = {}) {
    // Validation paramètres d'entrée
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!stopConfig || typeof stopConfig !== 'object') {
        throw new Error('ValidationError: stopConfig requis object');
    }
    
    if (!stopConfig.deploymentId) {
        throw new Error('ValidationError: stopConfig.deploymentId requis');
    }
    
    if (!stopConfig.projectPath) {
        throw new Error('ValidationError: stopConfig.projectPath requis');
    }
    
    const workflowStart = Date.now();
    const stoppedServices = [];
    const metrics = {
        startTime: new Date().toISOString(),
        steps: [],
        duration: 0,
        success: false,
        stoppedServices
    };
    
    try {
        // ÉTAPE 1: Vérifier état initial ONLINE
        await logStopWorkflow('workflow-start', { projectId, stopConfig }, options);
        const stepStart1 = Date.now();
        
        const onlineState = await detectOnlineState(stopConfig.projectPath);
        if (!onlineState.isOnline || onlineState.confidence < 0.7) {
            throw new Error('WorkflowError: Projet n\'est pas en état ONLINE');
        }
        
        metrics.steps.push({
            name: 'detect-online-state',
            duration: Date.now() - stepStart1,
            success: true
        });
        
        // ÉTAPE 2: Validation transition STOP  
        await logStopWorkflow('validation-stop', { fromState: 'ONLINE', toState: 'OFFLINE' }, options);
        const stepStart2 = Date.now();
        
        const context = {
            projectId,
            deploymentId: stopConfig.deploymentId,
            stopConfig: {
                graceful: stopConfig.graceful !== false,
                timeout: stopConfig.timeout || 30000,
                drainConnections: stopConfig.drainConnections !== false,
                saveState: stopConfig.saveState !== false,
                backupBeforeStop: stopConfig.backupBeforeStop || false
            },
            stopReason: stopConfig.stopReason || 'manual'
        };
        
        const validation = await validateStop('ONLINE', 'OFFLINE', context);
        if (!validation.canTransition) {
            throw new Error(`WorkflowError: Validation échec: ${validation.requirements.join(', ')}`);
        }
        
        metrics.steps.push({
            name: 'validate-stop-transition',
            duration: Date.now() - stepStart2,
            success: true
        });
        
        // ÉTAPE 3: Vérifications filesystem via systems
        await logStopWorkflow('filesystem-checks-stop', { stopConfig }, options);
        const stepStart3 = Date.now();
        
        // Vérifier projet existe
        const projectCheck = await checkProjectExists(projectId);
        if (!projectCheck.exists) {
            throw new Error(`WorkflowError: Projet ${projectId} inexistant`);
        }
        
        // Vérifier chemin d'arrêt accessible
        const outputCheck = await checkOutputPath(stopConfig.projectPath);
        if (!outputCheck.writable) {
            throw new Error(`WorkflowError: Chemin ${stopConfig.projectPath} non accessible en écriture`);
        }
        
        const stopChecks = {
            success: true,
            projectCheck,
            outputCheck,
            message: 'Vérifications arrêt filesystem réussies'
        };
        
        metrics.steps.push({
            name: 'filesystem-checks',
            duration: Date.now() - stepStart3,
            success: true
        });
        
        // ÉTAPE 4: Exécution transition STOP
        await logStopWorkflow('transition-stop', { projectId, context }, options);
        const stepStart4 = Date.now();
        
        const transition = await executeStop(projectId, context);
        if (!transition.success) {
            throw new Error('WorkflowError: Transition STOP échouée');
        }
        
        // Simulation arrêt des services
        if (context.stopConfig.graceful) {
            stoppedServices.push(`web-service-${projectId}`);
            stoppedServices.push(`api-service-${projectId}`);
        } else {
            stoppedServices.push(`force-stopped-${projectId}`);
        }
        
        if (context.stopConfig.drainConnections) {
            stoppedServices.push(`connections-drained-${projectId}`);
        }
        
        metrics.steps.push({
            name: 'execute-stop-transition',
            duration: Date.now() - stepStart4,
            success: true
        });
        
        // ÉTAPE 5: Vérification état final OFFLINE
        await logStopWorkflow('verification-stop', { expectedState: 'OFFLINE' }, options);
        const stepStart5 = Date.now();
        
        const offlineState = await detectOfflineState(stopConfig.projectPath);
        if (!offlineState.isOffline || offlineState.confidence < 0.7) {
            throw new Error('WorkflowError: État final n\'est pas OFFLINE valide');
        }
        
        metrics.steps.push({
            name: 'verify-offline-state',
            duration: Date.now() - stepStart5,
            success: true
        });
        
        // ÉTAPE 6: Cleanup transition
        const stepStart6 = Date.now();
        const cleanup = await cleanupStop(transition, projectId);
        
        metrics.steps.push({
            name: 'cleanup-transition',
            duration: Date.now() - stepStart6,
            success: cleanup.cleaned
        });
        
        // Finalisation workflow
        metrics.duration = Date.now() - workflowStart;
        metrics.success = true;
        
        await logStopWorkflow('workflow-success', { 
            projectId, 
            stoppedServices,
            finalState: 'OFFLINE',
            metrics 
        }, options);
        
        return {
            success: true,
            projectId,
            finalState: 'OFFLINE',
            stoppedServices,
            transition,
            stopChecks,
            metrics
        };
        
    } catch (error) {
        // Gestion d'erreur avec recovery
        metrics.duration = Date.now() - workflowStart;
        metrics.success = false;
        metrics.error = error.message;
        
        await logStopWorkflow('workflow-error', { 
            projectId, 
            stoppedServices,
            error: error.message,
            metrics 
        }, options);
        
        // Tentative de recovery
        const recovery = await recoverStopWorkflow(projectId, stopConfig, error, options);
        
        throw new Error(`WorkflowError: ${error.message}`);
    }
}

export default executeStopWorkflow;

/*
 * DEPENDENCY FLOW: engines/stop/workflow → transitions/stop → systems/filesystem → states/online,offline
 * ARCHITECTURE: Orchestration complète workflow arrêt avec gestion d'erreurs
 * PATTERN: executeXXXWorkflow() cohérent avec style BuzzCraft
 */

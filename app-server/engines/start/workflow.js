/**
 * COMMIT 36 - Engine Start
 * 
 * FAIT QUOI : Orchestre workflow démarrage complet OFFLINE→ONLINE
 * REÇOIT : projectId: string, startConfig: object, options?: object
 * RETOURNE : { success: boolean, projectId: string, finalState: string, serviceId: string, metrics: object }
 * ERREURS : ValidationError si paramètres invalides, WorkflowError si orchestration échoue
 */

import { detectOfflineState } from '../../states/offline/detector.js';
import { validateStart } from '../../transitions/start/validation.js';
import { executeStart } from '../../transitions/start/action.js';
import { cleanupStart } from '../../transitions/start/cleanup.js';
import { detectOnlineState } from '../../states/online/detector.js';
import { checkOutputPath } from '../../systems/filesystem/generator.js';
import { checkProjectExists } from '../../systems/filesystem/project.js';
import { logStartWorkflow } from './logging.js';
import { recoverStartWorkflow } from './recovery.js';

/**
 * Exécute workflow démarrage complet
 */
export async function executeStartWorkflow(projectId, startConfig, options = {}) {
    // Validation paramètres d'entrée
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!startConfig || typeof startConfig !== 'object') {
        throw new Error('ValidationError: startConfig requis object');
    }
    
    if (!startConfig.deploymentId) {
        throw new Error('ValidationError: startConfig.deploymentId requis');
    }
    
    if (!startConfig.projectPath) {
        throw new Error('ValidationError: startConfig.projectPath requis');
    }
    
    const workflowStart = Date.now();
    const serviceId = `service-${projectId}-${Date.now()}`;
    const metrics = {
        startTime: new Date().toISOString(),
        steps: [],
        duration: 0,
        success: false,
        serviceId
    };
    
    try {
        // ÉTAPE 1: Vérifier état initial OFFLINE
        await logStartWorkflow('workflow-start', { projectId, startConfig }, options);
        const stepStart1 = Date.now();
        
        const offlineState = await detectOfflineState(startConfig.projectPath);
        if (!offlineState.isOffline || offlineState.confidence < 0.7) {
            throw new Error('WorkflowError: Projet n\'est pas en état OFFLINE');
        }
        
        metrics.steps.push({
            name: 'detect-offline-state',
            duration: Date.now() - stepStart1,
            success: true
        });
        
        // ÉTAPE 2: Validation transition START  
        await logStartWorkflow('validation-start', { fromState: 'OFFLINE', toState: 'ONLINE' }, options);
        const stepStart2 = Date.now();
        
        const context = {
            projectId,
            deploymentId: startConfig.deploymentId,
            startConfig: {
                healthCheck: startConfig.healthCheck || '/health',
                timeout: startConfig.timeout || 30000,
                readinessProbe: startConfig.readinessProbe || '/ready',
                livenessProbe: startConfig.livenessProbe || '/alive',
                gracefulStart: startConfig.gracefulStart !== false
            }
        };
        
        const validation = await validateStart('OFFLINE', 'ONLINE', context);
        if (!validation.canTransition) {
            throw new Error(`WorkflowError: Validation échec: ${validation.requirements.join(', ')}`);
        }
        
        metrics.steps.push({
            name: 'validate-start-transition',
            duration: Date.now() - stepStart2,
            success: true
        });
        
        // ÉTAPE 3: Vérifications filesystem via systems
        await logStartWorkflow('filesystem-checks-start', { startConfig }, options);
        const stepStart3 = Date.now();
        
        // Vérifier projet existe
        const projectCheck = await checkProjectExists(projectId);
        if (!projectCheck.exists) {
            throw new Error(`WorkflowError: Projet ${projectId} inexistant`);
        }
        
        // Vérifier chemin de démarrage accessible
        const outputCheck = await checkOutputPath(startConfig.projectPath);
        if (!outputCheck.writable) {
            throw new Error(`WorkflowError: Chemin ${startConfig.projectPath} non accessible en écriture`);
        }
        
        const startChecks = {
            success: true,
            projectCheck,
            outputCheck,
            message: 'Vérifications démarrage filesystem réussies'
        };
        
        metrics.steps.push({
            name: 'filesystem-checks',
            duration: Date.now() - stepStart3,
            success: true
        });
        
        // ÉTAPE 4: Exécution transition START
        await logStartWorkflow('transition-start', { projectId, context }, options);
        const stepStart4 = Date.now();
        
        const transition = await executeStart(projectId, context);
        if (!transition.success) {
            throw new Error('WorkflowError: Transition START échouée');
        }
        
        metrics.steps.push({
            name: 'execute-start-transition',
            duration: Date.now() - stepStart4,
            success: true
        });
        
        // ÉTAPE 5: Vérification état final ONLINE
        await logStartWorkflow('verification-start', { expectedState: 'ONLINE' }, options);
        const stepStart5 = Date.now();
        
        const onlineState = await detectOnlineState(startConfig.projectPath);
        if (!onlineState.isOnline || onlineState.confidence < 0.7) {
            throw new Error('WorkflowError: État final n\'est pas ONLINE valide');
        }
        
        metrics.steps.push({
            name: 'verify-online-state',
            duration: Date.now() - stepStart5,
            success: true
        });
        
        // ÉTAPE 6: Cleanup transition
        const stepStart6 = Date.now();
        const cleanup = await cleanupStart(transition, projectId);
        
        metrics.steps.push({
            name: 'cleanup-transition',
            duration: Date.now() - stepStart6,
            success: cleanup.cleaned
        });
        
        // Finalisation workflow
        metrics.duration = Date.now() - workflowStart;
        metrics.success = true;
        
        await logStartWorkflow('workflow-success', { 
            projectId, 
            serviceId,
            finalState: 'ONLINE',
            metrics 
        }, options);
        
        return {
            success: true,
            projectId,
            finalState: 'ONLINE',
            serviceId,
            transition,
            startChecks,
            metrics
        };
        
    } catch (error) {
        // Gestion d'erreur avec recovery
        metrics.duration = Date.now() - workflowStart;
        metrics.success = false;
        metrics.error = error.message;
        
        await logStartWorkflow('workflow-error', { 
            projectId, 
            serviceId,
            error: error.message,
            metrics 
        }, options);
        
        // Tentative de recovery
        const recovery = await recoverStartWorkflow(projectId, startConfig, error, options);
        
        throw new Error(`WorkflowError: ${error.message}`);
    }
}

export default executeStartWorkflow;

/*
 * DEPENDENCY FLOW: engines/start/workflow → transitions/start → systems/filesystem → states/offline,online
 * ARCHITECTURE: Orchestration complète workflow démarrage avec gestion d'erreurs
 * PATTERN: executeXXXWorkflow() cohérent avec style BuzzCraft
 */

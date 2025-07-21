/**
 * COMMIT 35 - Engine Deploy
 * 
 * FAIT QUOI : Orchestre workflow déploiement complet BUILT→OFFLINE
 * REÇOIT : projectId: string, deployConfig: object, options?: object
 * RETOURNE : { success: boolean, projectId: string, finalState: string, deploymentId: string, metrics: object }
 * ERREURS : ValidationError si paramètres invalides, WorkflowError si orchestration échoue
 */

import { detectBuiltState } from '../../states/built/detector.js';
import { validateDeploy } from '../../transitions/deploy/validation.js';
import { executeDeploy } from '../../transitions/deploy/action.js';
import { cleanupDeploy } from '../../transitions/deploy/cleanup.js';
import { detectOfflineState } from '../../states/offline/detector.js';
import { checkOutputPath } from '../../systems/filesystem/generator.js';
import { checkProjectExists } from '../../systems/filesystem/project.js';
import { logDeployWorkflow } from './logging.js';
import { recoverDeployWorkflow } from './recovery.js';

/**
 * Exécute workflow déploiement complet
 */
export async function executeDeployWorkflow(projectId, deployConfig, options = {}) {
    // Validation paramètres d'entrée
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!deployConfig || typeof deployConfig !== 'object') {
        throw new Error('ValidationError: deployConfig requis object');
    }
    
    if (!deployConfig.target) {
        throw new Error('ValidationError: deployConfig.target requis');
    }
    
    if (!deployConfig.environment) {
        throw new Error('ValidationError: deployConfig.environment requis');
    }
    
    if (!deployConfig.projectPath) {
        throw new Error('ValidationError: deployConfig.projectPath requis');
    }
    
    const workflowStart = Date.now();
    const deploymentId = `deploy-${projectId}-${Date.now()}`;
    const metrics = {
        startTime: new Date().toISOString(),
        steps: [],
        duration: 0,
        success: false,
        deploymentId
    };
    
    try {
        // ÉTAPE 1: Vérifier état initial BUILT
        await logDeployWorkflow('workflow-start', { projectId, deployConfig }, options);
        const stepStart1 = Date.now();
        
        const builtState = await detectBuiltState(deployConfig.projectPath);
        if (!builtState.isBuilt || builtState.confidence < 0.7) {
            throw new Error('WorkflowError: Projet n\'est pas en état BUILT');
        }
        
        metrics.steps.push({
            name: 'detect-built-state',
            duration: Date.now() - stepStart1,
            success: true
        });
        
        // ÉTAPE 2: Validation transition DEPLOY  
        await logDeployWorkflow('validation-start', { fromState: 'BUILT', toState: 'OFFLINE' }, options);
        const stepStart2 = Date.now();
        
        const context = {
            projectId,
            projectPath: deployConfig.projectPath,
            deployConfig: {
                target: deployConfig.target,
                environment: deployConfig.environment,
                port: deployConfig.port || 8080,
                healthCheck: deployConfig.healthCheck !== false,
                replicas: deployConfig.replicas || 1,
                autoStart: deployConfig.autoStart !== false
            }
        };
        
        const validation = await validateDeploy('BUILT', 'OFFLINE', context);
        if (!validation.canTransition) {
            throw new Error(`WorkflowError: Validation échec: ${validation.requirements.join(', ')}`);
        }
        
        metrics.steps.push({
            name: 'validate-deploy-transition',
            duration: Date.now() - stepStart2,
            success: true
        });
        
        // ÉTAPE 3: Vérifications filesystem via systems
        await logDeployWorkflow('filesystem-checks-start', { deployConfig }, options);
        const stepStart3 = Date.now();
        
        // Vérifier projet existe
        const projectCheck = await checkProjectExists(projectId);
        if (!projectCheck.exists) {
            throw new Error(`WorkflowError: Projet ${projectId} inexistant`);
        }
        
        // Vérifier chemin de déploiement accessible
        const outputCheck = await checkOutputPath(deployConfig.projectPath);
        if (!outputCheck.writable) {
            throw new Error(`WorkflowError: Chemin ${deployConfig.projectPath} non accessible en écriture`);
        }
        
        const deployChecks = {
            success: true,
            projectCheck,
            outputCheck,
            message: 'Vérifications déploiement filesystem réussies'
        };
        
        metrics.steps.push({
            name: 'filesystem-checks',
            duration: Date.now() - stepStart3,
            success: true
        });
        
        // ÉTAPE 4: Exécution transition DEPLOY
        await logDeployWorkflow('transition-start', { projectId, context }, options);
        const stepStart4 = Date.now();
        
        const transition = await executeDeploy(projectId, context);
        if (!transition.success) {
            throw new Error('WorkflowError: Transition DEPLOY échouée');
        }
        
        metrics.steps.push({
            name: 'execute-deploy-transition',
            duration: Date.now() - stepStart4,
            success: true
        });
        
        // ÉTAPE 5: Vérification état final OFFLINE
        await logDeployWorkflow('verification-start', { expectedState: 'OFFLINE' }, options);
        const stepStart5 = Date.now();
        
        const offlineState = await detectOfflineState(deployConfig.projectPath);
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
        const cleanup = await cleanupDeploy(transition, projectId);
        
        metrics.steps.push({
            name: 'cleanup-transition',
            duration: Date.now() - stepStart6,
            success: cleanup.cleaned
        });
        
        // Finalisation workflow
        metrics.duration = Date.now() - workflowStart;
        metrics.success = true;
        
        await logDeployWorkflow('workflow-success', { 
            projectId, 
            deploymentId,
            finalState: 'OFFLINE',
            metrics 
        }, options);
        
        return {
            success: true,
            projectId,
            finalState: 'OFFLINE',
            deploymentId,
            transition,
            deployChecks,
            metrics
        };
        
    } catch (error) {
        // Gestion d'erreur avec recovery
        metrics.duration = Date.now() - workflowStart;
        metrics.success = false;
        metrics.error = error.message;
        
        await logDeployWorkflow('workflow-error', { 
            projectId, 
            deploymentId,
            error: error.message,
            metrics 
        }, options);
        
        // Tentative de recovery
        const recovery = await recoverDeployWorkflow(projectId, deployConfig, error, options);
        
        throw new Error(`WorkflowError: ${error.message}`);
    }
}

export default executeDeployWorkflow;

/*
 * DEPENDENCY FLOW: engines/deploy/workflow → transitions/deploy → systems/filesystem → states/built,offline
 * ARCHITECTURE: Orchestration complète workflow déploiement avec gestion d'erreurs
 * PATTERN: executeXXXWorkflow() cohérent avec style BuzzCraft
 */

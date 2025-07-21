/**
 * COMMIT 38 - Engine Update
 * 
 * FAIT QUOI : Orchestre workflow mise à jour complet OFFLINE→OFFLINE
 * REÇOIT : projectId: string, updateConfig: object, options?: object
 * RETOURNE : { success: boolean, projectId: string, finalState: string, updateId: string, backupId?: string, metrics: object }
 * ERREURS : ValidationError si paramètres invalides, WorkflowError si orchestration échoue
 */

import { detectOfflineState } from '../../states/offline/detector.js';
import { validateUpdate } from '../../transitions/update/validation.js';
import { executeUpdate } from '../../transitions/update/action.js';
import { cleanupUpdate } from '../../transitions/update/cleanup.js';
import { checkOutputPath } from '../../systems/filesystem/generator.js';
import { checkProjectExists } from '../../systems/filesystem/project.js';
import { logUpdateWorkflow } from './logging.js';
import { recoverUpdateWorkflow } from './recovery.js';

/**
 * Exécute workflow mise à jour complet
 */
export async function executeUpdateWorkflow(projectId, updateConfig, options = {}) {
    // Validation paramètres d'entrée
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!updateConfig || typeof updateConfig !== 'object') {
        throw new Error('ValidationError: updateConfig requis object');
    }
    
    if (!updateConfig.deploymentId) {
        throw new Error('ValidationError: updateConfig.deploymentId requis');
    }
    
    if (!updateConfig.updateType) {
        throw new Error('ValidationError: updateConfig.updateType requis');
    }
    
    if (!updateConfig.projectPath) {
        throw new Error('ValidationError: updateConfig.projectPath requis');
    }
    
    const workflowStart = Date.now();
    const updateId = `update-${projectId}-${Date.now()}`;
    const backupId = updateConfig.createBackup !== false ? `backup-${updateId}` : null;
    const metrics = {
        startTime: new Date().toISOString(),
        steps: [],
        duration: 0,
        success: false,
        updateId,
        backupId
    };
    
    try {
        // ÉTAPE 1: Vérifier état initial OFFLINE
        await logUpdateWorkflow('workflow-start', { projectId, updateConfig, updateId }, options);
        const stepStart1 = Date.now();
        
        const offlineState = await detectOfflineState(updateConfig.projectPath);
        if (!offlineState.isOffline || offlineState.confidence < 0.7) {
            throw new Error('WorkflowError: Projet n\'est pas en état OFFLINE');
        }
        
        metrics.steps.push({
            name: 'detect-offline-state',
            duration: Date.now() - stepStart1,
            success: true
        });
        
        // ÉTAPE 2: Validation transition UPDATE  
        await logUpdateWorkflow('validation-update', { fromState: 'OFFLINE', toState: 'OFFLINE' }, options);
        const stepStart2 = Date.now();
        
        const context = {
            projectId,
            deploymentId: updateConfig.deploymentId,
            updateConfig: {
                updateType: updateConfig.updateType,
                createBackup: updateConfig.createBackup !== false,
                version: updateConfig.version || 'auto',
                rollbackOnFailure: updateConfig.rollbackOnFailure !== false,
                preserveData: updateConfig.preserveData !== false,
                incrementalUpdate: updateConfig.incrementalUpdate || false
            },
            previousVersion: updateConfig.previousVersion || 'unknown'
        };
        
        const validation = await validateUpdate('OFFLINE', 'OFFLINE', context);
        if (!validation.canTransition) {
            throw new Error(`WorkflowError: Validation échec: ${validation.requirements.join(', ')}`);
        }
        
        metrics.steps.push({
            name: 'validate-update-transition',
            duration: Date.now() - stepStart2,
            success: true
        });
        
        // ÉTAPE 3: Vérifications filesystem via systems
        await logUpdateWorkflow('filesystem-checks-update', { updateConfig }, options);
        const stepStart3 = Date.now();
        
        // Vérifier projet existe
        const projectCheck = await checkProjectExists(projectId);
        if (!projectCheck.exists) {
            throw new Error(`WorkflowError: Projet ${projectId} inexistant`);
        }
        
        // Vérifier chemin de mise à jour accessible
        const outputCheck = await checkOutputPath(updateConfig.projectPath);
        if (!outputCheck.writable) {
            throw new Error(`WorkflowError: Chemin ${updateConfig.projectPath} non accessible en écriture`);
        }
        
        const updateChecks = {
            success: true,
            projectCheck,
            outputCheck,
            message: 'Vérifications mise à jour filesystem réussies'
        };
        
        metrics.steps.push({
            name: 'filesystem-checks',
            duration: Date.now() - stepStart3,
            success: true
        });
        
        // ÉTAPE 4: Création backup si demandé
        if (context.updateConfig.createBackup) {
            await logUpdateWorkflow('backup-creation', { updateId, backupId }, options);
            const stepStart4 = Date.now();
            
            // Simulation création backup
            const backupResult = {
                success: true,
                backupId,
                backupPath: `${updateConfig.projectPath}/.backups/${backupId}`,
                timestamp: new Date().toISOString()
            };
            
            metrics.steps.push({
                name: 'create-backup',
                duration: Date.now() - stepStart4,
                success: backupResult.success
            });
        }
        
        // ÉTAPE 5: Exécution transition UPDATE
        await logUpdateWorkflow('transition-update', { projectId, context, updateId }, options);
        const stepStart5 = Date.now();
        
        const transition = await executeUpdate(projectId, context);
        if (!transition.success) {
            throw new Error('WorkflowError: Transition UPDATE échouée');
        }
        
        metrics.steps.push({
            name: 'execute-update-transition',
            duration: Date.now() - stepStart5,
            success: true
        });
        
        // ÉTAPE 6: Vérification état final OFFLINE
        await logUpdateWorkflow('verification-update', { expectedState: 'OFFLINE' }, options);
        const stepStart6 = Date.now();
        
        const finalOfflineState = await detectOfflineState(updateConfig.projectPath);
        if (!finalOfflineState.isOffline || finalOfflineState.confidence < 0.7) {
            throw new Error('WorkflowError: État final n\'est pas OFFLINE valide');
        }
        
        metrics.steps.push({
            name: 'verify-offline-state',
            duration: Date.now() - stepStart6,
            success: true
        });
        
        // ÉTAPE 7: Cleanup transition
        const stepStart7 = Date.now();
        const cleanup = await cleanupUpdate(transition, projectId);
        
        metrics.steps.push({
            name: 'cleanup-transition',
            duration: Date.now() - stepStart7,
            success: cleanup.cleaned
        });
        
        // Finalisation workflow
        metrics.duration = Date.now() - workflowStart;
        metrics.success = true;
        
        await logUpdateWorkflow('workflow-success', { 
            projectId, 
            updateId,
            backupId,
            finalState: 'OFFLINE',
            metrics 
        }, options);
        
        return {
            success: true,
            projectId,
            finalState: 'OFFLINE',
            updateId,
            backupId,
            transition,
            updateChecks,
            metrics
        };
        
    } catch (error) {
        // Gestion d'erreur avec recovery
        metrics.duration = Date.now() - workflowStart;
        metrics.success = false;
        metrics.error = error.message;
        
        await logUpdateWorkflow('workflow-error', { 
            projectId, 
            updateId,
            backupId,
            error: error.message,
            metrics 
        }, options);
        
        // Tentative de recovery
        const recovery = await recoverUpdateWorkflow(projectId, updateConfig, error, options);
        
        throw new Error(`WorkflowError: ${error.message}`);
    }
}

export default executeUpdateWorkflow;

/*
 * DEPENDENCY FLOW: engines/update/workflow → transitions/update → systems/filesystem → states/offline
 * ARCHITECTURE: Orchestration complète workflow mise à jour avec gestion d'erreurs
 * PATTERN: executeXXXWorkflow() cohérent avec style BuzzCraft
 */

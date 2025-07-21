/**
 * COMMIT 32 - Engine Save
 * 
 * FAIT QUOI : Orchestre workflow sauvegarde complet DRAFT→DRAFT
 * REÇOIT : projectId: string, saveData: object, options?: object
 * RETOURNE : { success: boolean, projectId: string, finalState: string, saveId: string, metrics: object }
 * ERREURS : ValidationError si paramètres invalides, WorkflowError si orchestration échoue
 */

import { detectDraftState } from '../../states/draft/detector.js';
import { validateSave } from '../../transitions/save/validation.js';
import { executeSave } from '../../transitions/save/action.js';
import { cleanupSave } from '../../transitions/save/cleanup.js';
import { checkOutputPath } from '../../systems/filesystem/generator.js';
import { checkProjectExists } from '../../systems/filesystem/project.js';
import { logSaveWorkflow } from './logging.js';
import { recoverSaveWorkflow } from './recovery.js';

/**
 * Exécute workflow sauvegarde complet
 */
export async function executeSaveWorkflow(projectId, saveData, options = {}) {
    // Validation paramètres d'entrée
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!saveData || typeof saveData !== 'object') {
        throw new Error('ValidationError: saveData requis object');
    }
    
    if (!saveData.projectPath) {
        throw new Error('ValidationError: saveData.projectPath requis');
    }
    
    if (!saveData.content && !saveData.changes) {
        throw new Error('ValidationError: saveData.content ou saveData.changes requis');
    }
    
    const workflowStart = Date.now();
    const saveId = `save-${projectId}-${Date.now()}`;
    const metrics = {
        startTime: new Date().toISOString(),
        steps: [],
        duration: 0,
        success: false,
        saveId
    };
    
    try {
        // ÉTAPE 1: Vérifier état initial DRAFT
        await logSaveWorkflow('workflow-start', { projectId, saveData }, options);
        const stepStart1 = Date.now();
        
        const draftState = await detectDraftState(saveData.projectPath);
        if (!draftState.isDraft || draftState.confidence < 0.7) {
            throw new Error('WorkflowError: Projet n\'est pas en état DRAFT');
        }
        
        metrics.steps.push({
            name: 'detect-draft-state',
            duration: Date.now() - stepStart1,
            success: true
        });
        
        // ÉTAPE 2: Validation transition SAVE  
        await logSaveWorkflow('validation-start', { fromState: 'DRAFT', toState: 'DRAFT' }, options);
        const stepStart2 = Date.now();
        
        const context = {
            projectId,
            projectPath: saveData.projectPath,
            saveData: {
                content: saveData.content,
                changes: saveData.changes,
                version: saveData.version || 'auto',
                commitMessage: saveData.commitMessage || 'Auto save'
            }
        };
        
        const validation = await validateSave('DRAFT', 'DRAFT', context);
        if (!validation.canTransition) {
            throw new Error(`WorkflowError: Validation échec: ${validation.requirements.join(', ')}`);
        }
        
        metrics.steps.push({
            name: 'validate-save-transition',
            duration: Date.now() - stepStart2,
            success: true
        });
        
        // ÉTAPE 3: Vérifications filesystem via systems
        await logSaveWorkflow('filesystem-checks-start', { saveData }, options);
        const stepStart3 = Date.now();
        
        // Vérifier projet existe
        const projectCheck = await checkProjectExists(projectId);
        if (!projectCheck.exists) {
            throw new Error(`WorkflowError: Projet ${projectId} inexistant`);
        }
        
        // Vérifier chemin de sauvegarde accessible
        const outputCheck = await checkOutputPath(saveData.projectPath);
        if (!outputCheck.writable) {
            throw new Error(`WorkflowError: Chemin ${saveData.projectPath} non accessible en écriture`);
        }
        
        const filesystemChecks = {
            success: true,
            projectCheck,
            outputCheck,
            message: 'Vérifications filesystem réussies'
        };
        
        metrics.steps.push({
            name: 'filesystem-checks',
            duration: Date.now() - stepStart3,
            success: true
        });
        
        // ÉTAPE 4: Exécution transition SAVE
        await logSaveWorkflow('transition-start', { projectId, context }, options);
        const stepStart4 = Date.now();
        
        const transition = await executeSave(projectId, context);
        if (!transition.success) {
            throw new Error('WorkflowError: Transition SAVE échouée');
        }
        
        metrics.steps.push({
            name: 'execute-save-transition',
            duration: Date.now() - stepStart4,
            success: true
        });
        
        // ÉTAPE 5: Vérification état final DRAFT
        await logSaveWorkflow('verification-start', { expectedState: 'DRAFT' }, options);
        const stepStart5 = Date.now();
        
        const finalDraftState = await detectDraftState(saveData.projectPath);
        if (!finalDraftState.isDraft || finalDraftState.confidence < 0.7) {
            throw new Error('WorkflowError: État final n\'est pas DRAFT valide');
        }
        
        metrics.steps.push({
            name: 'verify-draft-state',
            duration: Date.now() - stepStart5,
            success: true
        });
        
        // ÉTAPE 6: Cleanup transition
        const stepStart6 = Date.now();
        const cleanup = await cleanupSave(transition, projectId);
        
        metrics.steps.push({
            name: 'cleanup-transition',
            duration: Date.now() - stepStart6,
            success: cleanup.cleaned
        });
        
        // Finalisation workflow
        metrics.duration = Date.now() - workflowStart;
        metrics.success = true;
        
        await logSaveWorkflow('workflow-success', { 
            projectId, 
            saveId,
            finalState: 'DRAFT',
            metrics 
        }, options);
        
        return {
            success: true,
            projectId,
            finalState: 'DRAFT',
            saveId,
            transition,
            filesystemChecks,
            metrics
        };
        
    } catch (error) {
        // Gestion d'erreur avec recovery
        metrics.duration = Date.now() - workflowStart;
        metrics.success = false;
        metrics.error = error.message;
        
        await logSaveWorkflow('workflow-error', { 
            projectId, 
            saveId,
            error: error.message,
            metrics 
        }, options);
        
        // Tentative de recovery
        const recovery = await recoverSaveWorkflow(projectId, saveData, error, options);
        
        throw new Error(`WorkflowError: ${error.message}`);
    }
}

export default executeSaveWorkflow;

/*
 * DEPENDENCY FLOW: engines/save/workflow → transitions/save → systems/filesystem → states/draft
 * ARCHITECTURE: Orchestration complète workflow sauvegarde avec gestion d'erreurs
 * PATTERN: executeXXXWorkflow() cohérent avec style BuzzCraft
 */

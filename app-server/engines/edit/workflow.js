/**
 * COMMIT 34 - Engine Edit
 * 
 * FAIT QUOI : Orchestre workflow édition complet BUILT→DRAFT
 * REÇOIT : projectId: string, editOptions: object, options?: object
 * RETOURNE : { success: boolean, projectId: string, finalState: string, editSession: string, metrics: object }
 * ERREURS : ValidationError si paramètres invalides, WorkflowError si orchestration échoue
 */

import { detectBuiltState } from '../../states/built/detector.js';
import { validateEdit } from '../../transitions/edit/validation.js';
import { executeEdit } from '../../transitions/edit/action.js';
import { cleanupEdit } from '../../transitions/edit/cleanup.js';
import { detectDraftState } from '../../states/draft/detector.js';
import { checkOutputPath } from '../../systems/filesystem/generator.js';
import { checkProjectExists } from '../../systems/filesystem/project.js';
import { logEditWorkflow } from './logging.js';
import { recoverEditWorkflow } from './recovery.js';

/**
 * Exécute workflow édition complet
 */
export async function executeEditWorkflow(projectId, editOptions, options = {}) {
    // Validation paramètres d'entrée
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!editOptions || typeof editOptions !== 'object') {
        throw new Error('ValidationError: editOptions requis object');
    }
    
    if (!editOptions.projectPath) {
        throw new Error('ValidationError: editOptions.projectPath requis');
    }
    
    if (!editOptions.editConfig) {
        throw new Error('ValidationError: editOptions.editConfig requis');
    }
    
    const workflowStart = Date.now();
    const editSession = `edit-${projectId}-${Date.now()}`;
    const metrics = {
        startTime: new Date().toISOString(),
        steps: [],
        duration: 0,
        success: false,
        editSession
    };
    
    try {
        // ÉTAPE 1: Vérifier état initial BUILT
        await logEditWorkflow('workflow-start', { projectId, editOptions }, options);
        const stepStart1 = Date.now();
        
        const builtState = await detectBuiltState(editOptions.projectPath);
        if (!builtState.isBuilt || builtState.confidence < 0.7) {
            throw new Error('WorkflowError: Projet n\'est pas en état BUILT');
        }
        
        metrics.steps.push({
            name: 'detect-built-state',
            duration: Date.now() - stepStart1,
            success: true
        });
        
        // ÉTAPE 2: Validation transition EDIT  
        await logEditWorkflow('validation-start', { fromState: 'BUILT', toState: 'DRAFT' }, options);
        const stepStart2 = Date.now();
        
        const context = {
            projectId,
            projectPath: editOptions.projectPath,
            editConfig: {
                backupBuild: editOptions.editConfig.backupBuild !== false,
                preserveChanges: editOptions.editConfig.preserveChanges !== false,
                editMode: editOptions.editConfig.editMode || 'full',
                createBranch: editOptions.editConfig.createBranch !== false
            }
        };
        
        const validation = await validateEdit('BUILT', 'DRAFT', context);
        if (!validation.canTransition) {
            throw new Error(`WorkflowError: Validation échec: ${validation.requirements.join(', ')}`);
        }
        
        metrics.steps.push({
            name: 'validate-edit-transition',
            duration: Date.now() - stepStart2,
            success: true
        });
        
        // ÉTAPE 3: Vérifications filesystem via systems
        await logEditWorkflow('filesystem-checks-start', { editOptions }, options);
        const stepStart3 = Date.now();
        
        // Vérifier projet existe
        const projectCheck = await checkProjectExists(projectId);
        if (!projectCheck.exists) {
            throw new Error(`WorkflowError: Projet ${projectId} inexistant`);
        }
        
        // Vérifier chemin d'édition accessible
        const outputCheck = await checkOutputPath(editOptions.projectPath);
        if (!outputCheck.writable) {
            throw new Error(`WorkflowError: Chemin ${editOptions.projectPath} non accessible en écriture`);
        }
        
        const editChecks = {
            success: true,
            projectCheck,
            outputCheck,
            message: 'Vérifications édition filesystem réussies'
        };
        
        metrics.steps.push({
            name: 'filesystem-checks',
            duration: Date.now() - stepStart3,
            success: true
        });
        
        // ÉTAPE 4: Exécution transition EDIT
        await logEditWorkflow('transition-start', { projectId, context }, options);
        const stepStart4 = Date.now();
        
        const transition = await executeEdit(projectId, context);
        if (!transition.success) {
            throw new Error('WorkflowError: Transition EDIT échouée');
        }
        
        metrics.steps.push({
            name: 'execute-edit-transition',
            duration: Date.now() - stepStart4,
            success: true
        });
        
        // ÉTAPE 5: Vérification état final DRAFT
        await logEditWorkflow('verification-start', { expectedState: 'DRAFT' }, options);
        const stepStart5 = Date.now();
        
        const draftState = await detectDraftState(editOptions.projectPath);
        if (!draftState.isDraft || draftState.confidence < 0.7) {
            throw new Error('WorkflowError: État final n\'est pas DRAFT valide');
        }
        
        metrics.steps.push({
            name: 'verify-draft-state',
            duration: Date.now() - stepStart5,
            success: true
        });
        
        // ÉTAPE 6: Cleanup transition
        const stepStart6 = Date.now();
        const cleanup = await cleanupEdit(transition, projectId);
        
        metrics.steps.push({
            name: 'cleanup-transition',
            duration: Date.now() - stepStart6,
            success: cleanup.cleaned
        });
        
        // Finalisation workflow
        metrics.duration = Date.now() - workflowStart;
        metrics.success = true;
        
        await logEditWorkflow('workflow-success', { 
            projectId, 
            editSession,
            finalState: 'DRAFT',
            metrics 
        }, options);
        
        return {
            success: true,
            projectId,
            finalState: 'DRAFT',
            editSession,
            transition,
            editChecks,
            metrics
        };
        
    } catch (error) {
        // Gestion d'erreur avec recovery
        metrics.duration = Date.now() - workflowStart;
        metrics.success = false;
        metrics.error = error.message;
        
        await logEditWorkflow('workflow-error', { 
            projectId, 
            editSession,
            error: error.message,
            metrics 
        }, options);
        
        // Tentative de recovery
        const recovery = await recoverEditWorkflow(projectId, editOptions, error, options);
        
        throw new Error(`WorkflowError: ${error.message}`);
    }
}

export default executeEditWorkflow;

/*
 * DEPENDENCY FLOW: engines/edit/workflow → transitions/edit → systems/filesystem → states/built,draft
 * ARCHITECTURE: Orchestration complète workflow édition avec gestion d'erreurs
 * PATTERN: executeXXXWorkflow() cohérent avec style BuzzCraft
 */

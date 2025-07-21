/**
 * COMMIT 31 - Engine Create
 * 
 * FAIT QUOI : Orchestre workflow création complet VOID→DRAFT
 * REÇOIT : projectId: string, template: object, options?: object
 * RETOURNE : { success: boolean, projectId: string, finalState: string, metrics: object }
 * ERREURS : ValidationError si paramètres invalides, WorkflowError si orchestration échoue
 */

import { detectVoidState } from '../../states/void/detector.js';
import { validateCreate } from '../../transitions/create/validation.js';
import { executeCreate } from '../../transitions/create/action.js';
import { cleanupCreate } from '../../transitions/create/cleanup.js';
import { detectDraftState } from '../../states/draft/detector.js';
import { checkOutputPath } from '../../systems/filesystem/generator.js';
import { checkTemplateExists } from '../../systems/filesystem/templates.js';
import { checkProjectExists } from '../../systems/filesystem/project.js';
import { logCreateWorkflow } from './logging.js';
import { recoverCreateWorkflow } from './recovery.js';

/**
 * Exécute workflow création complet
 */
export async function executeCreateWorkflow(projectId, template, options = {}) {
    // Validation paramètres d'entrée
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!template || typeof template !== 'object') {
        throw new Error('ValidationError: template requis object');
    }
    
    if (!template.templateId) {
        throw new Error('ValidationError: template.templateId requis');
    }
    
    if (!template.projectPath) {
        throw new Error('ValidationError: template.projectPath requis');  
    }
    
    if (!template.projectName) {
        throw new Error('ValidationError: template.projectName requis');
    }
    
    const workflowStart = Date.now();
    const metrics = {
        startTime: new Date().toISOString(),
        steps: [],
        duration: 0,
        success: false
    };
    
    try {
        // ÉTAPE 1: Vérifier état initial VOID
        await logCreateWorkflow('workflow-start', { projectId, template }, options);
        const stepStart1 = Date.now();
        
        const voidState = await detectVoidState(template.projectPath);
        if (!voidState.isVoid || voidState.confidence < 0.8) {
            throw new Error('WorkflowError: Projet n\'est pas en état VOID');
        }
        
        metrics.steps.push({
            name: 'detect-void-state',
            duration: Date.now() - stepStart1,
            success: true
        });
        
        // ÉTAPE 2: Validation transition CREATE  
        await logCreateWorkflow('validation-start', { fromState: 'VOID', toState: 'DRAFT' }, options);
        const stepStart2 = Date.now();
        
        const context = {
            templateId: template.templateId,
            projectPath: template.projectPath,
            projectName: template.projectName,
            ...template
        };
        
        const validation = await validateCreate('VOID', 'DRAFT', context);
        if (!validation.canTransition) {
            throw new Error(`WorkflowError: Validation échec: ${validation.requirements.join(', ')}`);
        }
        
        metrics.steps.push({
            name: 'validate-create-transition',
            duration: Date.now() - stepStart2,
            success: true
        });
        
        // ÉTAPE 3: Vérifications filesystem via systems
        await logCreateWorkflow('filesystem-checks-start', { template }, options);
        const stepStart3 = Date.now();
        
        // Vérifier template existe
        const templateCheck = await checkTemplateExists(template.templateId);
        if (!templateCheck.exists) {
            throw new Error(`WorkflowError: Template ${template.templateId} inexistant`);
        }
        
        // Vérifier projet n'existe pas déjà
        const projectCheck = await checkProjectExists(projectId);
        if (projectCheck.exists) {
            throw new Error(`WorkflowError: Projet ${projectId} existe déjà`);
        }
        
        // Vérifier chemin de sortie
        const outputCheck = await checkOutputPath(template.projectPath);
        if (!outputCheck.writable) {
            throw new Error(`WorkflowError: Chemin de sortie ${template.projectPath} non accessible`);
        }
        
        const generation = {
            success: true,
            templateCheck,
            projectCheck,
            outputCheck,
            message: 'Vérifications filesystem réussies'
        };
        
        metrics.steps.push({
            name: 'filesystem-checks',
            duration: Date.now() - stepStart3,
            success: true
        });
        
        // ÉTAPE 4: Exécution transition CREATE
        await logCreateWorkflow('transition-start', { projectId, context }, options);
        const stepStart4 = Date.now();
        
        const transition = await executeCreate(projectId, context);
        if (!transition.success) {
            throw new Error('WorkflowError: Transition CREATE échouée');
        }
        
        metrics.steps.push({
            name: 'execute-create-transition',
            duration: Date.now() - stepStart4,
            success: true
        });
        
        // ÉTAPE 5: Vérification état final DRAFT
        await logCreateWorkflow('verification-start', { expectedState: 'DRAFT' }, options);
        const stepStart5 = Date.now();
        
        const draftState = await detectDraftState(template.projectPath);
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
        const cleanup = await cleanupCreate(transition, projectId);
        
        metrics.steps.push({
            name: 'cleanup-transition',
            duration: Date.now() - stepStart6,
            success: cleanup.cleaned
        });
        
        // Finalisation workflow
        metrics.duration = Date.now() - workflowStart;
        metrics.success = true;
        
        await logCreateWorkflow('workflow-success', { 
            projectId, 
            finalState: 'DRAFT',
            metrics 
        }, options);
        
        return {
            success: true,
            projectId,
            finalState: 'DRAFT',
            transition,
            generation,
            metrics
        };
        
    } catch (error) {
        // Gestion d'erreur avec recovery
        metrics.duration = Date.now() - workflowStart;
        metrics.success = false;
        metrics.error = error.message;
        
        await logCreateWorkflow('workflow-error', { 
            projectId, 
            error: error.message,
            metrics 
        }, options);
        
        // Tentative de recovery
        const recovery = await recoverCreateWorkflow(projectId, template, error, options);
        
        throw new Error(`WorkflowError: ${error.message}`);
    }
}

export default executeCreateWorkflow;

/*
 * DEPENDENCY FLOW: engines/create/workflow → transitions/create → systems/filesystem → states/void,draft
 * ARCHITECTURE: Orchestration complète workflow création avec gestion d'erreurs
 * PATTERN: executeXXXWorkflow() cohérent avec style BuzzCraft
 */

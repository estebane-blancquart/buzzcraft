/**
 * COMMIT 33 - Engine Build
 * 
 * FAIT QUOI : Orchestre workflow build complet DRAFT→BUILT
 * REÇOIT : projectId: string, buildConfig: object, options?: object
 * RETOURNE : { success: boolean, projectId: string, finalState: string, buildId: string, metrics: object }
 * ERREURS : ValidationError si paramètres invalides, WorkflowError si orchestration échoue
 */

import { detectDraftState } from '../../states/draft/detector.js';
import { validateBuild } from '../../transitions/build/validation.js';
import { executeBuild } from '../../transitions/build/action.js';
import { cleanupBuild } from '../../transitions/build/cleanup.js';
import { detectBuiltState } from '../../states/built/detector.js';
import { checkOutputPath } from '../../systems/filesystem/generator.js';
import { checkProjectExists } from '../../systems/filesystem/project.js';
import { logBuildWorkflow } from './logging.js';
import { recoverBuildWorkflow } from './recovery.js';

/**
 * Exécute workflow build complet
 */
export async function executeBuildWorkflow(projectId, buildConfig, options = {}) {
    // Validation paramètres d'entrée
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!buildConfig || typeof buildConfig !== 'object') {
        throw new Error('ValidationError: buildConfig requis object');
    }
    
    if (!buildConfig.target) {
        throw new Error('ValidationError: buildConfig.target requis');
    }
    
    if (!buildConfig.environment) {
        throw new Error('ValidationError: buildConfig.environment requis');
    }
    
    if (!buildConfig.projectPath) {
        throw new Error('ValidationError: buildConfig.projectPath requis');
    }
    
    const workflowStart = Date.now();
    const buildId = `build-${projectId}-${Date.now()}`;
    const metrics = {
        startTime: new Date().toISOString(),
        steps: [],
        duration: 0,
        success: false,
        buildId
    };
    
    try {
        // ÉTAPE 1: Vérifier état initial DRAFT
        await logBuildWorkflow('workflow-start', { projectId, buildConfig }, options);
        const stepStart1 = Date.now();
        
        const draftState = await detectDraftState(buildConfig.projectPath);
        if (!draftState.isDraft || draftState.confidence < 0.7) {
            throw new Error('WorkflowError: Projet n\'est pas en état DRAFT');
        }
        
        metrics.steps.push({
            name: 'detect-draft-state',
            duration: Date.now() - stepStart1,
            success: true
        });
        
        // ÉTAPE 2: Validation transition BUILD  
        await logBuildWorkflow('validation-start', { fromState: 'DRAFT', toState: 'BUILT' }, options);
        const stepStart2 = Date.now();
        
        const context = {
            projectId,
            projectPath: buildConfig.projectPath,
            buildConfig: {
                target: buildConfig.target,
                environment: buildConfig.environment,
                optimization: buildConfig.optimization !== false,
                parallel: buildConfig.parallel !== false,
                cache: buildConfig.cache !== false
            }
        };
        
        const validation = await validateBuild('DRAFT', 'BUILT', context);
        if (!validation.canTransition) {
            throw new Error(`WorkflowError: Validation échec: ${validation.requirements.join(', ')}`);
        }
        
        metrics.steps.push({
            name: 'validate-build-transition',
            duration: Date.now() - stepStart2,
            success: true
        });
        
        // ÉTAPE 3: Vérifications filesystem via systems
        await logBuildWorkflow('filesystem-checks-start', { buildConfig }, options);
        const stepStart3 = Date.now();
        
        // Vérifier projet existe
        const projectCheck = await checkProjectExists(projectId);
        if (!projectCheck.exists) {
            throw new Error(`WorkflowError: Projet ${projectId} inexistant`);
        }
        
        // Vérifier chemin de build accessible
        const outputCheck = await checkOutputPath(buildConfig.projectPath);
        if (!outputCheck.writable) {
            throw new Error(`WorkflowError: Chemin ${buildConfig.projectPath} non accessible en écriture`);
        }
        
        const buildChecks = {
            success: true,
            projectCheck,
            outputCheck,
            message: 'Vérifications build filesystem réussies'
        };
        
        metrics.steps.push({
            name: 'filesystem-checks',
            duration: Date.now() - stepStart3,
            success: true
        });
        
        // ÉTAPE 4: Exécution transition BUILD
        await logBuildWorkflow('transition-start', { projectId, context }, options);
        const stepStart4 = Date.now();
        
        const transition = await executeBuild(projectId, context);
        if (!transition.success) {
            throw new Error('WorkflowError: Transition BUILD échouée');
        }
        
        metrics.steps.push({
            name: 'execute-build-transition',
            duration: Date.now() - stepStart4,
            success: true
        });
        
        // ÉTAPE 5: Vérification état final BUILT
        await logBuildWorkflow('verification-start', { expectedState: 'BUILT' }, options);
        const stepStart5 = Date.now();
        
        const builtState = await detectBuiltState(buildConfig.projectPath);
        if (!builtState.isBuilt || builtState.confidence < 0.7) {
            throw new Error('WorkflowError: État final n\'est pas BUILT valide');
        }
        
        metrics.steps.push({
            name: 'verify-built-state',
            duration: Date.now() - stepStart5,
            success: true
        });
        
        // ÉTAPE 6: Cleanup transition
        const stepStart6 = Date.now();
        const cleanup = await cleanupBuild(transition, projectId);
        
        metrics.steps.push({
            name: 'cleanup-transition',
            duration: Date.now() - stepStart6,
            success: cleanup.cleaned
        });
        
        // Finalisation workflow
        metrics.duration = Date.now() - workflowStart;
        metrics.success = true;
        
        await logBuildWorkflow('workflow-success', { 
            projectId, 
            buildId,
            finalState: 'BUILT',
            metrics 
        }, options);
        
        return {
            success: true,
            projectId,
            finalState: 'BUILT',
            buildId,
            transition,
            buildChecks,
            metrics
        };
        
    } catch (error) {
        // Gestion d'erreur avec recovery
        metrics.duration = Date.now() - workflowStart;
        metrics.success = false;
        metrics.error = error.message;
        
        await logBuildWorkflow('workflow-error', { 
            projectId, 
            buildId,
            error: error.message,
            metrics 
        }, options);
        
        // Tentative de recovery
        const recovery = await recoverBuildWorkflow(projectId, buildConfig, error, options);
        
        throw new Error(`WorkflowError: ${error.message}`);
    }
}

export default executeBuildWorkflow;

/*
 * DEPENDENCY FLOW: engines/build/workflow → transitions/build → systems/filesystem → states/draft,built
 * ARCHITECTURE: Orchestration complète workflow build avec gestion d'erreurs
 * PATTERN: executeXXXWorkflow() cohérent avec style BuzzCraft
 */

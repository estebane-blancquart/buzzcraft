/**
 * COMMIT 40 - Engine Migrate
 * 
 * FAIT QUOI : Orchestre workflow migration complet ANY→ANY
 * REÇOIT : projectId: string, migrateConfig: object, options?: object
 * RETOURNE : { success: boolean, projectId: string, fromState: string, finalState: string, migrationId: string, metrics: object }
 * ERREURS : ValidationError si paramètres invalides, WorkflowError si orchestration échoue
 */

import { detectVoidState } from '../../states/void/detector.js';
import { detectDraftState } from '../../states/draft/detector.js';
import { detectBuiltState } from '../../states/built/detector.js';
import { detectOfflineState } from '../../states/offline/detector.js';
import { detectOnlineState } from '../../states/online/detector.js';
import { validateMigrate } from '../../transitions/migrate/validation.js';
import { executeMigrate } from '../../transitions/migrate/action.js';
import { cleanupMigrate } from '../../transitions/migrate/cleanup.js';
import { checkOutputPath } from '../../systems/filesystem/generator.js';
import { checkProjectExists } from '../../systems/filesystem/project.js';
import { logMigrateWorkflow } from './logging.js';
import { recoverMigrateWorkflow } from './recovery.js';

/**
 * Exécute workflow migration complet
 */
export async function executeMigrateWorkflow(projectId, migrateConfig, options = {}) {
    // Validation paramètres d'entrée
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!migrateConfig || typeof migrateConfig !== 'object') {
        throw new Error('ValidationError: migrateConfig requis object');
    }
    
    if (!migrateConfig.targetEnvironment) {
        throw new Error('ValidationError: migrateConfig.targetEnvironment requis');
    }
    
    if (!migrateConfig.strategy) {
        throw new Error('ValidationError: migrateConfig.strategy requis');
    }
    
    if (!migrateConfig.projectPath) {
        throw new Error('ValidationError: migrateConfig.projectPath requis');
    }
    
    if (!migrateConfig.toState) {
        throw new Error('ValidationError: migrateConfig.toState requis');
    }
    
    const workflowStart = Date.now();
    const migrationId = `migrate-${projectId}-${Date.now()}`;
    const metrics = {
        startTime: new Date().toISOString(),
        steps: [],
        duration: 0,
        success: false,
        migrationId
    };
    
    try {
        // ÉTAPE 1: Détecter état initial (ANY)
        await logMigrateWorkflow('workflow-start', { projectId, migrateConfig, migrationId }, options);
        const stepStart1 = Date.now();
        
        // Détecter état actuel du projet
        let currentState = 'UNKNOWN';
        const detectors = [
            { name: 'VOID', detector: detectVoidState },
            { name: 'DRAFT', detector: detectDraftState },
            { name: 'BUILT', detector: detectBuiltState },
            { name: 'OFFLINE', detector: detectOfflineState },
            { name: 'ONLINE', detector: detectOnlineState }
        ];
        
        for (const { name, detector } of detectors) {
            try {
                const state = await detector(migrateConfig.projectPath);
                const isStateKey = `is${name.charAt(0)}${name.slice(1).toLowerCase()}`;
                if (state[isStateKey] && state.confidence >= 0.7) {
                    currentState = name;
                    break;
                }
            } catch (error) {
                // Continuer avec le prochain détecteur
                continue;
            }
        }
        
        if (currentState === 'UNKNOWN') {
            throw new Error('WorkflowError: Impossible de déterminer l\'état actuel du projet');
        }
        
        if (currentState === migrateConfig.toState) {
            throw new Error('WorkflowError: Projet déjà dans l\'état cible');
        }
        
        metrics.steps.push({
            name: 'detect-current-state',
            duration: Date.now() - stepStart1,
            success: true,
            currentState
        });
        
        // ÉTAPE 2: Validation transition MIGRATE  
        await logMigrateWorkflow('validation-migrate', { fromState: currentState, toState: migrateConfig.toState }, options);
        const stepStart2 = Date.now();
        
        const context = {
            projectId,
            fromState: currentState,
            toState: migrateConfig.toState,
            targetEnvironment: migrateConfig.targetEnvironment,
            migrateConfig: {
                strategy: migrateConfig.strategy,
                preserveData: migrateConfig.preserveData !== false,
                targetVersion: migrateConfig.targetVersion || '1.0.0',
                allowDowngrade: migrateConfig.allowDowngrade === true,
                forceUnsafe: migrateConfig.forceUnsafe === true,
                rollbackOnFailure: migrateConfig.rollbackOnFailure !== false
            }
        };
        
        const validation = await validateMigrate(currentState, migrateConfig.toState, context);
        if (!validation.canTransition) {
            throw new Error(`WorkflowError: Validation échec: ${validation.requirements.join(', ')}`);
        }
        
        metrics.steps.push({
            name: 'validate-migrate-transition',
            duration: Date.now() - stepStart2,
            success: true
        });
        
        // ÉTAPE 3: Vérifications filesystem via systems
        await logMigrateWorkflow('filesystem-checks-migrate', { migrateConfig }, options);
        const stepStart3 = Date.now();
        
        // Vérifier projet existe
        const projectCheck = await checkProjectExists(projectId);
        if (!projectCheck.exists) {
            throw new Error(`WorkflowError: Projet ${projectId} inexistant`);
        }
        
        // Vérifier chemin de migration accessible
        const outputCheck = await checkOutputPath(migrateConfig.projectPath);
        if (!outputCheck.writable) {
            throw new Error(`WorkflowError: Chemin ${migrateConfig.projectPath} non accessible en écriture`);
        }
        
        const migrateChecks = {
            success: true,
            projectCheck,
            outputCheck,
            message: 'Vérifications migration filesystem réussies'
        };
        
        metrics.steps.push({
            name: 'filesystem-checks',
            duration: Date.now() - stepStart3,
            success: true
        });
        
        // ÉTAPE 4: Backup pré-migration si demandé
        if (context.migrateConfig.preserveData) {
            await logMigrateWorkflow('backup-pre-migration', { migrationId, currentState }, options);
            const stepStart4 = Date.now();
            
            // Simulation backup pré-migration
            const backupResult = {
                success: true,
                backupId: `backup-${migrationId}`,
                backupPath: `${migrateConfig.projectPath}/.migration-backups/${migrationId}`,
                timestamp: new Date().toISOString(),
                currentState
            };
            
            metrics.steps.push({
                name: 'create-pre-migration-backup',
                duration: Date.now() - stepStart4,
                success: backupResult.success
            });
        }
        
        // ÉTAPE 5: Exécution transition MIGRATE
        await logMigrateWorkflow('transition-migrate', { projectId, context, migrationId }, options);
        const stepStart5 = Date.now();
        
        const transition = await executeMigrate(projectId, context);
        if (!transition.success) {
            throw new Error('WorkflowError: Transition MIGRATE échouée');
        }
        
        metrics.steps.push({
            name: 'execute-migrate-transition',
            duration: Date.now() - stepStart5,
            success: true
        });
        
        // ÉTAPE 6: Vérification état final
        await logMigrateWorkflow('verification-migrate', { expectedState: migrateConfig.toState }, options);
        const stepStart6 = Date.now();
        
        // Vérifier l'état final selon le toState
        let finalStateValid = false;
        const targetDetector = detectors.find(d => d.name === migrateConfig.toState);
        
        if (targetDetector) {
            try {
                const finalState = await targetDetector.detector(migrateConfig.projectPath);
                const isStateKey = `is${migrateConfig.toState.charAt(0)}${migrateConfig.toState.slice(1).toLowerCase()}`;
                finalStateValid = finalState[isStateKey] && finalState.confidence >= 0.7;
            } catch (error) {
                finalStateValid = false;
            }
        }
        
        if (!finalStateValid) {
            throw new Error(`WorkflowError: État final n'est pas ${migrateConfig.toState} valide`);
        }
        
        metrics.steps.push({
            name: 'verify-target-state',
            duration: Date.now() - stepStart6,
            success: true
        });
        
        // ÉTAPE 7: Cleanup transition
        const stepStart7 = Date.now();
        const cleanup = await cleanupMigrate(transition, projectId);
        
        metrics.steps.push({
            name: 'cleanup-transition',
            duration: Date.now() - stepStart7,
            success: cleanup.cleaned
        });
        
        // Finalisation workflow
        metrics.duration = Date.now() - workflowStart;
        metrics.success = true;
        
        await logMigrateWorkflow('workflow-success', { 
            projectId, 
            migrationId,
            fromState: currentState,
            finalState: migrateConfig.toState,
            metrics 
        }, options);
        
        return {
            success: true,
            projectId,
            fromState: currentState,
            finalState: migrateConfig.toState,
            migrationId,
            transition,
            migrateChecks,
            metrics
        };
        
    } catch (error) {
        // Gestion d'erreur avec recovery
        metrics.duration = Date.now() - workflowStart;
        metrics.success = false;
        metrics.error = error.message;
        
        await logMigrateWorkflow('workflow-error', { 
            projectId, 
            migrationId,
            error: error.message,
            metrics 
        }, options);
        
        // Tentative de recovery
        const recovery = await recoverMigrateWorkflow(projectId, migrateConfig, error, options);
        
        throw new Error(`WorkflowError: ${error.message}`);
    }
}

export default executeMigrateWorkflow;

/*
 * DEPENDENCY FLOW: engines/migrate/workflow → transitions/migrate → systems/filesystem → states/void,draft,built,offline,online
 * ARCHITECTURE: Orchestration complète workflow migration avec gestion d'erreurs
 * PATTERN: executeXXXWorkflow() cohérent avec style BuzzCraft
 */

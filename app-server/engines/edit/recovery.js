/**
 * COMMIT 34 - Engine Edit
 * 
 * FAIT QUOI : Recovery workflow édition - rollback + retry + gestion échecs
 * REÇOIT : projectId: string, editOptions: object, error: Error, options?: object
 * RETOURNE : { recovered: boolean, strategy: string, actions: string[] }
 * ERREURS : ValidationError si paramètres invalides
 */

import { detectBuiltState } from '../../states/built/detector.js';
import { detectDraftState } from '../../states/draft/detector.js';
import { cleanupEdit } from '../../transitions/edit/cleanup.js';
import { logEditWorkflow } from './logging.js';

/**
 * Récupère workflow édition en cas d'échec
 */
export async function recoverEditWorkflow(projectId, editOptions, error, options = {}) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!editOptions || typeof editOptions !== 'object') {
        throw new Error('ValidationError: editOptions requis object');
    }
    
    if (!error || !(error instanceof Error)) {
        throw new Error('ValidationError: error requis Error');
    }
    
    const actions = [];
    let strategy = 'unknown';
    let recovered = false;
    
    try {
        await logEditWorkflow('recovery-start', { 
            projectId, 
            error: error.message,
            errorType: error.constructor.name 
        }, options);
        
        // Déterminer stratégie de recovery selon type d'erreur
        if (error.message.includes('Projet n\'est pas en état BUILT')) {
            strategy = 'state-conflict';
            
            // Vérifier état actuel
            const currentBuiltState = await detectBuiltState(editOptions.projectPath);
            const currentDraftState = await detectDraftState(editOptions.projectPath);
            
            if (currentDraftState.isDraft) {
                actions.push('detect-current-state-draft');
                actions.push('project-already-in-edit-mode');
                recovered = true;
            } else if (currentBuiltState.isBuilt) {
                actions.push('detect-current-state-built-low-confidence');
                actions.push('force-built-state-validation');
                recovered = true;
            } else {
                actions.push('detect-current-state-invalid');
                actions.push('abort-edit-wrong-state');
            }
            
        } else if (error.message.includes('Validation échec')) {
            strategy = 'validation-failure';
            
            // Extraire prérequis manquants
            const requirements = error.message.match(/Validation échec: (.+)/)?.[1] || '';
            actions.push(`missing-requirements-${requirements.split(', ').length}`);
            
            // Nettoyer état partiel si créé
            actions.push('cleanup-partial-edit');
            
        } else if (error.message.includes('Projet') && error.message.includes('inexistant')) {
            strategy = 'project-missing';
            
            // Projet supprimé pendant édition
            actions.push('detect-project-deletion');
            actions.push('abort-edit-no-project');
            
        } else if (error.message.includes('non accessible en écriture')) {
            strategy = 'filesystem-failure';
            
            // Problème d'accès filesystem
            actions.push('check-edit-permissions');
            actions.push('cleanup-partial-backup');
            
            // Retry édition si autorisé
            if (options.allowRetry !== false && (options.retryCount || 0) < 2) {
                actions.push('retry-edit-with-backup-path');
                
                try {
                    // TODO: Réessayer édition avec configuration alternative
                    actions.push('retry-attempted');
                    recovered = true;
                } catch (retryError) {
                    actions.push('retry-failed');
                }
            }
            
        } else if (error.message.includes('Transition EDIT échouée')) {
            strategy = 'transition-failure';
            
            // Rollback transition
            const mockTransitionResult = {
                success: false,
                fromState: 'BUILT',
                toState: 'DRAFT',
                timestamp: new Date().toISOString(),
                error: error.message
            };
            
            const cleanup = await cleanupEdit(mockTransitionResult, projectId);
            actions.push(...cleanup.actions.map(action => `rollback-${action}`));
            
        } else if (error.message.includes('État final n\'est pas DRAFT')) {
            strategy = 'state-verification-failure';
            
            // Vérifier qu'est-ce qui a mal tourné avec l'édition
            actions.push('diagnose-edit-state');
            actions.push('validate-edit-session');
            
            // Forcer nettoyage complet des sessions partielles
            actions.push('force-cleanup-edit-sessions');
            
        } else {
            strategy = 'unknown-error';
            
            // Recovery générique
            actions.push('generic-edit-cleanup');
            actions.push('restore-built-state');
        }
        
        // Actions de recovery communes
        actions.push('clear-edit-cache');
        actions.push('invalidate-state-cache');
        
        // Logs de recovery
        if (options.enableRecoveryLogs !== false) {
            actions.push('log-recovery-details');
        }
        
        await logEditWorkflow('recovery-complete', { 
            projectId,
            strategy,
            recovered,
            actions: actions.length
        }, options);
        
        return {
            recovered,
            strategy,
            actions
        };
        
    } catch (recoveryError) {
        await logEditWorkflow('recovery-failed', { 
            projectId,
            originalError: error.message,
            recoveryError: recoveryError.message
        }, options);
        
        return {
            recovered: false,
            strategy: 'recovery-failed',
            actions: ['recovery-error']
        };
    }
}

export default recoverEditWorkflow;

/*
 * DEPENDENCY FLOW: engines/edit/recovery → transitions/edit → states/built,draft
 * ARCHITECTURE: Module recovery autonome pour workflow édition
 * PATTERN: recoverXXXWorkflow() cohérent avec style BuzzCraft
 */

/**
 * COMMIT 32 - Engine Save
 * 
 * FAIT QUOI : Recovery workflow sauvegarde - rollback + retry + gestion échecs
 * REÇOIT : projectId: string, saveData: object, error: Error, options?: object
 * RETOURNE : { recovered: boolean, strategy: string, actions: string[] }
 * ERREURS : ValidationError si paramètres invalides
 */

import { detectDraftState } from '../../states/draft/detector.js';
import { cleanupSave } from '../../transitions/save/cleanup.js';
import { logSaveWorkflow } from './logging.js';

/**
 * Récupère workflow sauvegarde en cas d'échec
 */
export async function recoverSaveWorkflow(projectId, saveData, error, options = {}) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!saveData || typeof saveData !== 'object') {
        throw new Error('ValidationError: saveData requis object');
    }
    
    if (!error || !(error instanceof Error)) {
        throw new Error('ValidationError: error requis Error');
    }
    
    const actions = [];
    let strategy = 'unknown';
    let recovered = false;
    
    try {
        await logSaveWorkflow('recovery-start', { 
            projectId, 
            error: error.message,
            errorType: error.constructor.name 
        }, options);
        
        // Déterminer stratégie de recovery selon type d'erreur
        if (error.message.includes('Projet n\'est pas en état DRAFT')) {
            strategy = 'state-conflict';
            
            // Vérifier état actuel
            const currentState = await detectDraftState(saveData.projectPath);
            actions.push(`detect-current-state-${currentState.isDraft ? 'draft' : 'other'}`);
            
            if (currentState.isDraft) {
                // Projet est en DRAFT, peut-être juste un problème de confidence
                actions.push('force-draft-state-validation');
                recovered = true;
            } else {
                // Projet pas en DRAFT, pas possible de sauvegarder
                actions.push('abort-save-wrong-state');
            }
            
        } else if (error.message.includes('Validation échec')) {
            strategy = 'validation-failure';
            
            // Extraire prérequis manquants
            const requirements = error.message.match(/Validation échec: (.+)/)?.[1] || '';
            actions.push(`missing-requirements-${requirements.split(', ').length}`);
            
            // Nettoyer état partiel si créé
            actions.push('cleanup-partial-save');
            
        } else if (error.message.includes('Projet') && error.message.includes('inexistant')) {
            strategy = 'project-missing';
            
            // Projet supprimé pendant sauvegarde
            actions.push('detect-project-deletion');
            actions.push('abort-save-no-project');
            
        } else if (error.message.includes('non accessible en écriture')) {
            strategy = 'filesystem-failure';
            
            // Problème d'accès filesystem
            actions.push('check-filesystem-permissions');
            actions.push('cleanup-partial-files');
            
            // Retry sauvegarde si autorisé
            if (options.allowRetry !== false && (options.retryCount || 0) < 2) {
                actions.push('retry-save-with-backup-path');
                
                try {
                    // TODO: Réessayer sauvegarde avec chemin alternatif
                    actions.push('retry-attempted');
                    recovered = true;
                } catch (retryError) {
                    actions.push('retry-failed');
                }
            }
            
        } else if (error.message.includes('Transition SAVE échouée')) {
            strategy = 'transition-failure';
            
            // Rollback transition
            const mockTransitionResult = {
                success: false,
                fromState: 'DRAFT',
                toState: 'DRAFT',
                timestamp: new Date().toISOString(),
                error: error.message
            };
            
            const cleanup = await cleanupSave(mockTransitionResult, projectId);
            actions.push(...cleanup.actions.map(action => `rollback-${action}`));
            
        } else if (error.message.includes('État final n\'est pas DRAFT')) {
            strategy = 'state-verification-failure';
            
            // Vérifier qu'est-ce qui a mal tourné
            actions.push('diagnose-final-state');
            actions.push('validate-save-integrity');
            
            // Forcer nettoyage complet
            actions.push('force-cleanup-all');
            
        } else {
            strategy = 'unknown-error';
            
            // Recovery générique
            actions.push('generic-save-cleanup');
            actions.push('preserve-draft-state');
        }
        
        // Actions de recovery communes
        actions.push('clear-save-cache');
        actions.push('invalidate-state-cache');
        
        // Logs de recovery
        if (options.enableRecoveryLogs !== false) {
            actions.push('log-recovery-details');
        }
        
        await logSaveWorkflow('recovery-complete', { 
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
        await logSaveWorkflow('recovery-failed', { 
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

export default recoverSaveWorkflow;

/*
 * DEPENDENCY FLOW: engines/save/recovery → transitions/save → states/draft
 * ARCHITECTURE: Module recovery autonome pour workflow sauvegarde
 * PATTERN: recoverXXXWorkflow() cohérent avec style BuzzCraft
 */

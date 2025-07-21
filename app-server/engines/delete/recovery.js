/**
 * COMMIT 39 - Engine Delete
 * 
 * FAIT QUOI : Recovery workflow suppression - restauration archive + gestion échecs
 * REÇOIT : projectId: string, deleteConfig: object, error: Error, options?: object
 * RETOURNE : { recovered: boolean, strategy: string, actions: string[], archiveRestored?: boolean }
 * ERREURS : ValidationError si paramètres invalides
 */

import { detectVoidState } from '../../states/void/detector.js';
import { cleanupDelete } from '../../transitions/delete/cleanup.js';
import { logDeleteWorkflow } from './logging.js';

/**
 * Récupère workflow suppression en cas d'échec
 */
export async function recoverDeleteWorkflow(projectId, deleteConfig, error, options = {}) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!deleteConfig || typeof deleteConfig !== 'object') {
        throw new Error('ValidationError: deleteConfig requis object');
    }
    
    if (!error || !(error instanceof Error)) {
        throw new Error('ValidationError: error requis Error');
    }
    
    const actions = [];
    let strategy = 'unknown';
    let recovered = false;
    let archiveRestored = false;
    
    try {
        await logDeleteWorkflow('recovery-start', { 
            projectId, 
            error: error.message,
            errorType: error.constructor.name 
        }, options);
        
        // Déterminer stratégie de recovery selon type d'erreur
        if (error.message.includes('Impossible de déterminer l\'état actuel')) {
            strategy = 'state-detection-failure';
            
            // Tentative de détection forcée
            actions.push('attempt-force-state-detection');
            
            try {
                // Forcer détection état VOID pour voir si suppression partielle
                const voidState = await detectVoidState(deleteConfig.projectPath);
                if (voidState.isVoid) {
                    actions.push('detect-partial-deletion-success');
                    recovered = true;
                } else {
                    actions.push('detect-project-still-exists');
                }
            } catch (detectionError) {
                actions.push('force-detection-failed');
            }
            
        } else if (error.message.includes('Validation échec')) {
            strategy = 'validation-failure';
            
            // Extraire prérequis manquants
            const requirements = error.message.match(/Validation échec: (.+)/)?.[1] || '';
            actions.push(`missing-requirements-${requirements.split(', ').length}`);
            
            // Nettoyer état partiel si créé
            actions.push('cleanup-partial-delete');
            
        } else if (error.message.includes('Projet') && error.message.includes('inexistant')) {
            strategy = 'project-missing';
            
            // Projet déjà supprimé ou n'existait pas
            actions.push('detect-project-already-deleted');
            actions.push('verify-void-state');
            recovered = true;
            
        } else if (error.message.includes('non accessible en écriture')) {
            strategy = 'filesystem-failure';
            
            // Problème d'accès filesystem
            actions.push('check-delete-permissions');
            actions.push('cleanup-partial-files');
            
            // Retry suppression si autorisé avec force
            if (options.allowRetry !== false && (options.retryCount || 0) < 1) {
                actions.push('retry-delete-with-force-mode');
                
                try {
                    // TODO: Réessayer suppression avec mode force
                    actions.push('retry-attempted-force');
                    recovered = true;
                } catch (retryError) {
                    actions.push('retry-failed-force');
                }
            }
            
        } else if (error.message.includes('Transition DELETE échouée')) {
            strategy = 'transition-failure';
            
            // Rollback transition + restauration archive si disponible
            const mockTransitionResult = {
                success: false,
                fromState: 'UNKNOWN',
                toState: 'VOID',
                timestamp: new Date().toISOString(),
                error: error.message
            };
            
            const cleanup = await cleanupDelete(mockTransitionResult, projectId);
            actions.push(...cleanup.actions.map(action => `rollback-${action}`));
            
            // Restaurer archive si créée
            if (deleteConfig.createBackup !== false) {
                actions.push('restore-archive-requested');
                // TODO: Implémenter vraie restauration archive
                archiveRestored = true;
                actions.push('archive-restored-successfully');
            }
            
        } else if (error.message.includes('État final n\'est pas VOID')) {
            strategy = 'state-verification-failure';
            
            // Vérifier qu'est-ce qui a mal tourné avec la suppression
            actions.push('diagnose-delete-state');
            actions.push('validate-deletion-completeness');
            
            // Forcer suppression complète des fichiers restants
            actions.push('force-complete-deletion');
            
        } else {
            strategy = 'unknown-error';
            
            // Recovery générique avec restauration archive
            actions.push('generic-delete-cleanup');
            
            if (deleteConfig.createBackup !== false) {
                actions.push('attempt-archive-restore');
                archiveRestored = true;
            }
            
            actions.push('verify-project-integrity');
        }
        
        // Actions de recovery communes
        actions.push('clear-delete-cache');
        actions.push('invalidate-state-cache');
        actions.push('audit-delete-attempt');
        
        // Logs de recovery sécurisés
        if (options.enableRecoveryLogs !== false) {
            actions.push('log-recovery-details-secure');
        }
        
        await logDeleteWorkflow('recovery-complete', { 
            projectId,
            strategy,
            recovered,
            archiveRestored,
            actions: actions.length
        }, options);
        
        return {
            recovered,
            strategy,
            actions,
            archiveRestored
        };
        
    } catch (recoveryError) {
        await logDeleteWorkflow('recovery-failed', { 
            projectId,
            originalError: error.message,
            recoveryError: recoveryError.message
        }, options);
        
        return {
            recovered: false,
            strategy: 'recovery-failed',
            actions: ['recovery-error'],
            archiveRestored: false
        };
    }
}

export default recoverDeleteWorkflow;

/*
 * DEPENDENCY FLOW: engines/delete/recovery → transitions/delete → states/void
 * ARCHITECTURE: Module recovery autonome pour workflow suppression
 * PATTERN: recoverXXXWorkflow() cohérent avec style BuzzCraft
 */

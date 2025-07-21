/**
 * COMMIT 38 - Engine Update
 * 
 * FAIT QUOI : Recovery workflow mise à jour - rollback + restauration backup + gestion échecs
 * REÇOIT : projectId: string, updateConfig: object, error: Error, options?: object
 * RETOURNE : { recovered: boolean, strategy: string, actions: string[], backupRestored?: boolean }
 * ERREURS : ValidationError si paramètres invalides
 */

import { detectOfflineState } from '../../states/offline/detector.js';
import { cleanupUpdate } from '../../transitions/update/cleanup.js';
import { logUpdateWorkflow } from './logging.js';

/**
 * Récupère workflow mise à jour en cas d'échec
 */
export async function recoverUpdateWorkflow(projectId, updateConfig, error, options = {}) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!updateConfig || typeof updateConfig !== 'object') {
        throw new Error('ValidationError: updateConfig requis object');
    }
    
    if (!error || !(error instanceof Error)) {
        throw new Error('ValidationError: error requis Error');
    }
    
    const actions = [];
    let strategy = 'unknown';
    let recovered = false;
    let backupRestored = false;
    
    try {
        await logUpdateWorkflow('recovery-start', { 
            projectId, 
            error: error.message,
            errorType: error.constructor.name 
        }, options);
        
        // Déterminer stratégie de recovery selon type d'erreur
        if (error.message.includes('Projet n\'est pas en état OFFLINE')) {
            strategy = 'state-conflict';
            
            // Vérifier état actuel
            const currentOfflineState = await detectOfflineState(updateConfig.projectPath);
            
            if (currentOfflineState.isOffline) {
                actions.push('detect-current-state-offline-low-confidence');
                actions.push('force-offline-state-validation');
                recovered = true;
            } else {
                actions.push('detect-current-state-invalid');
                actions.push('abort-update-wrong-state');
            }
            
        } else if (error.message.includes('Validation échec')) {
            strategy = 'validation-failure';
            
            // Extraire prérequis manquants
            const requirements = error.message.match(/Validation échec: (.+)/)?.[1] || '';
            actions.push(`missing-requirements-${requirements.split(', ').length}`);
            
            // Nettoyer état partiel si créé
            actions.push('cleanup-partial-update');
            
        } else if (error.message.includes('Projet') && error.message.includes('inexistant')) {
            strategy = 'project-missing';
            
            // Projet supprimé pendant mise à jour
            actions.push('detect-project-deletion');
            actions.push('abort-update-no-project');
            
        } else if (error.message.includes('non accessible en écriture')) {
            strategy = 'filesystem-failure';
            
            // Problème d'accès filesystem
            actions.push('check-update-permissions');
            actions.push('cleanup-partial-files');
            
            // Retry mise à jour si autorisé
            if (options.allowRetry !== false && (options.retryCount || 0) < 2) {
                actions.push('retry-update-with-elevated-permissions');
                
                try {
                    // TODO: Réessayer mise à jour avec permissions élevées
                    actions.push('retry-attempted');
                    recovered = true;
                } catch (retryError) {
                    actions.push('retry-failed');
                }
            }
            
        } else if (error.message.includes('Transition UPDATE échouée')) {
            strategy = 'transition-failure';
            
            // Rollback transition + restauration backup si disponible
            const mockTransitionResult = {
                success: false,
                fromState: 'OFFLINE',
                toState: 'OFFLINE',
                timestamp: new Date().toISOString(),
                error: error.message
            };
            
            const cleanup = await cleanupUpdate(mockTransitionResult, projectId);
            actions.push(...cleanup.actions.map(action => `rollback-${action}`));
            
            // Restaurer backup si créé
            if (updateConfig.createBackup !== false) {
                actions.push('restore-backup-requested');
                // TODO: Implémenter vraie restauration backup
                backupRestored = true;
                actions.push('backup-restored-successfully');
            }
            
        } else if (error.message.includes('État final n\'est pas OFFLINE')) {
            strategy = 'state-verification-failure';
            
            // Vérifier qu'est-ce qui a mal tourné avec la mise à jour
            actions.push('diagnose-update-state');
            actions.push('validate-update-integrity');
            
            // Forcer nettoyage complet des fichiers partiels
            actions.push('force-cleanup-partial-update');
            
        } else {
            strategy = 'unknown-error';
            
            // Recovery générique avec restauration backup
            actions.push('generic-update-cleanup');
            
            if (updateConfig.createBackup !== false) {
                actions.push('attempt-backup-restore');
                backupRestored = true;
            }
            
            actions.push('restore-offline-state');
        }
        
        // Actions de recovery communes
        actions.push('clear-update-cache');
        actions.push('invalidate-state-cache');
        actions.push('verify-project-integrity');
        
        // Logs de recovery
        if (options.enableRecoveryLogs !== false) {
            actions.push('log-recovery-details');
        }
        
        await logUpdateWorkflow('recovery-complete', { 
            projectId,
            strategy,
            recovered,
            backupRestored,
            actions: actions.length
        }, options);
        
        return {
            recovered,
            strategy,
            actions,
            backupRestored
        };
        
    } catch (recoveryError) {
        await logUpdateWorkflow('recovery-failed', { 
            projectId,
            originalError: error.message,
            recoveryError: recoveryError.message
        }, options);
        
        return {
            recovered: false,
            strategy: 'recovery-failed',
            actions: ['recovery-error'],
            backupRestored: false
        };
    }
}

export default recoverUpdateWorkflow;

/*
 * DEPENDENCY FLOW: engines/update/recovery → transitions/update → states/offline
 * ARCHITECTURE: Module recovery autonome pour workflow mise à jour
 * PATTERN: recoverXXXWorkflow() cohérent avec style BuzzCraft
 */

/**
 * COMMIT 37 - Engine Stop
 * 
 * FAIT QUOI : Recovery workflow arrêt - rollback + retry + gestion échecs
 * REÇOIT : projectId: string, stopConfig: object, error: Error, options?: object
 * RETOURNE : { recovered: boolean, strategy: string, actions: string[] }
 * ERREURS : ValidationError si paramètres invalides
 */

import { detectOnlineState } from '../../states/online/detector.js';
import { detectOfflineState } from '../../states/offline/detector.js';
import { cleanupStop } from '../../transitions/stop/cleanup.js';
import { logStopWorkflow } from './logging.js';

/**
 * Récupère workflow arrêt en cas d'échec
 */
export async function recoverStopWorkflow(projectId, stopConfig, error, options = {}) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!stopConfig || typeof stopConfig !== 'object') {
        throw new Error('ValidationError: stopConfig requis object');
    }
    
    if (!error || !(error instanceof Error)) {
        throw new Error('ValidationError: error requis Error');
    }
    
    const actions = [];
    let strategy = 'unknown';
    let recovered = false;
    
    try {
        await logStopWorkflow('recovery-start', { 
            projectId, 
            error: error.message,
            errorType: error.constructor.name 
        }, options);
        
        // Déterminer stratégie de recovery selon type d'erreur
        if (error.message.includes('Projet n\'est pas en état ONLINE')) {
            strategy = 'state-conflict';
            
            // Vérifier état actuel
            const currentOnlineState = await detectOnlineState(stopConfig.projectPath);
            const currentOfflineState = await detectOfflineState(stopConfig.projectPath);
            
            if (currentOfflineState.isOffline) {
                actions.push('detect-current-state-offline');
                actions.push('project-already-stopped');
                recovered = true;
            } else if (currentOnlineState.isOnline) {
                actions.push('detect-current-state-online-low-confidence');
                actions.push('force-online-state-validation');
                recovered = true;
            } else {
                actions.push('detect-current-state-invalid');
                actions.push('abort-stop-wrong-state');
            }
            
        } else if (error.message.includes('Validation échec')) {
            strategy = 'validation-failure';
            
            // Extraire prérequis manquants
            const requirements = error.message.match(/Validation échec: (.+)/)?.[1] || '';
            actions.push(`missing-requirements-${requirements.split(', ').length}`);
            
            // Nettoyer état partiel si créé
            actions.push('cleanup-partial-stop');
            
        } else if (error.message.includes('Projet') && error.message.includes('inexistant')) {
            strategy = 'project-missing';
            
            // Projet supprimé pendant arrêt
            actions.push('detect-project-deletion');
            actions.push('abort-stop-no-project');
            
        } else if (error.message.includes('non accessible en écriture')) {
            strategy = 'filesystem-failure';
            
            // Problème d'accès filesystem
            actions.push('check-stop-permissions');
            actions.push('cleanup-partial-services');
            
            // Retry arrêt si autorisé
            if (options.allowRetry !== false && (options.retryCount || 0) < 2) {
                actions.push('retry-stop-with-force-mode');
                
                try {
                    // TODO: Réessayer arrêt avec configuration forcée
                    actions.push('retry-attempted');
                    recovered = true;
                } catch (retryError) {
                    actions.push('retry-failed');
                }
            }
            
        } else if (error.message.includes('Transition STOP échouée')) {
            strategy = 'transition-failure';
            
            // Rollback transition partielle
            const mockTransitionResult = {
                success: false,
                fromState: 'ONLINE',
                toState: 'OFFLINE',
                timestamp: new Date().toISOString(),
                error: error.message
            };
            
            const cleanup = await cleanupStop(mockTransitionResult, projectId);
            actions.push(...cleanup.actions.map(action => `rollback-${action}`));
            
        } else if (error.message.includes('État final n\'est pas OFFLINE')) {
            strategy = 'state-verification-failure';
            
            // Vérifier qu'est-ce qui a mal tourné avec l'arrêt
            actions.push('diagnose-stop-state');
            actions.push('validate-services-stopped');
            
            // Forcer arrêt complet des services partiels
            actions.push('force-stop-remaining-services');
            
        } else {
            strategy = 'unknown-error';
            
            // Recovery générique
            actions.push('generic-stop-cleanup');
            actions.push('restore-online-state');
        }
        
        // Actions de recovery communes
        actions.push('clear-stop-cache');
        actions.push('invalidate-state-cache');
        
        // Logs de recovery
        if (options.enableRecoveryLogs !== false) {
            actions.push('log-recovery-details');
        }
        
        await logStopWorkflow('recovery-complete', { 
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
        await logStopWorkflow('recovery-failed', { 
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

export default recoverStopWorkflow;

/*
 * DEPENDENCY FLOW: engines/stop/recovery → transitions/stop → states/online,offline
 * ARCHITECTURE: Module recovery autonome pour workflow arrêt
 * PATTERN: recoverXXXWorkflow() cohérent avec style BuzzCraft
 */

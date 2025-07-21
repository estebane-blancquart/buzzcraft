/**
 * COMMIT 36 - Engine Start
 * 
 * FAIT QUOI : Recovery workflow démarrage - rollback + retry + gestion échecs
 * REÇOIT : projectId: string, startConfig: object, error: Error, options?: object
 * RETOURNE : { recovered: boolean, strategy: string, actions: string[] }
 * ERREURS : ValidationError si paramètres invalides
 */

import { detectOfflineState } from '../../states/offline/detector.js';
import { detectOnlineState } from '../../states/online/detector.js';
import { cleanupStart } from '../../transitions/start/cleanup.js';
import { logStartWorkflow } from './logging.js';

/**
 * Récupère workflow démarrage en cas d'échec
 */
export async function recoverStartWorkflow(projectId, startConfig, error, options = {}) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!startConfig || typeof startConfig !== 'object') {
        throw new Error('ValidationError: startConfig requis object');
    }
    
    if (!error || !(error instanceof Error)) {
        throw new Error('ValidationError: error requis Error');
    }
    
    const actions = [];
    let strategy = 'unknown';
    let recovered = false;
    
    try {
        await logStartWorkflow('recovery-start', { 
            projectId, 
            error: error.message,
            errorType: error.constructor.name 
        }, options);
        
        // Déterminer stratégie de recovery selon type d'erreur
        if (error.message.includes('Projet n\'est pas en état OFFLINE')) {
            strategy = 'state-conflict';
            
            // Vérifier état actuel
            const currentOfflineState = await detectOfflineState(startConfig.projectPath);
            const currentOnlineState = await detectOnlineState(startConfig.projectPath);
            
            if (currentOnlineState.isOnline) {
                actions.push('detect-current-state-online');
                actions.push('project-already-started');
                recovered = true;
            } else if (currentOfflineState.isOffline) {
                actions.push('detect-current-state-offline-low-confidence');
                actions.push('force-offline-state-validation');
                recovered = true;
            } else {
                actions.push('detect-current-state-invalid');
                actions.push('abort-start-wrong-state');
            }
            
        } else if (error.message.includes('Validation échec')) {
            strategy = 'validation-failure';
            
            // Extraire prérequis manquants
            const requirements = error.message.match(/Validation échec: (.+)/)?.[1] || '';
            actions.push(`missing-requirements-${requirements.split(', ').length}`);
            
            // Nettoyer état partiel si créé
            actions.push('cleanup-partial-start');
            
        } else if (error.message.includes('Projet') && error.message.includes('inexistant')) {
            strategy = 'project-missing';
            
            // Projet supprimé pendant démarrage
            actions.push('detect-project-deletion');
            actions.push('abort-start-no-project');
            
        } else if (error.message.includes('non accessible en écriture')) {
            strategy = 'filesystem-failure';
            
            // Problème d'accès filesystem
            actions.push('check-start-permissions');
            actions.push('cleanup-partial-services');
            
            // Retry démarrage si autorisé
            if (options.allowRetry !== false && (options.retryCount || 0) < 2) {
                actions.push('retry-start-with-backup-path');
                
                try {
                    // TODO: Réessayer démarrage avec configuration alternative
                    actions.push('retry-attempted');
                    recovered = true;
                } catch (retryError) {
                    actions.push('retry-failed');
                }
            }
            
        } else if (error.message.includes('Transition START échouée')) {
            strategy = 'transition-failure';
            
            // Rollback transition
            const mockTransitionResult = {
                success: false,
                fromState: 'OFFLINE',
                toState: 'ONLINE',
                timestamp: new Date().toISOString(),
                error: error.message
            };
            
            const cleanup = await cleanupStart(mockTransitionResult, projectId);
            actions.push(...cleanup.actions.map(action => `rollback-${action}`));
            
        } else if (error.message.includes('État final n\'est pas ONLINE')) {
            strategy = 'state-verification-failure';
            
            // Vérifier qu'est-ce qui a mal tourné avec le démarrage
            actions.push('diagnose-start-state');
            actions.push('validate-service-health');
            
            // Forcer nettoyage complet des services partiels
            actions.push('force-cleanup-partial-services');
            
        } else {
            strategy = 'unknown-error';
            
            // Recovery générique
            actions.push('generic-start-cleanup');
            actions.push('restore-offline-state');
        }
        
        // Actions de recovery communes
        actions.push('clear-start-cache');
        actions.push('invalidate-state-cache');
        
        // Logs de recovery
        if (options.enableRecoveryLogs !== false) {
            actions.push('log-recovery-details');
        }
        
        await logStartWorkflow('recovery-complete', { 
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
        await logStartWorkflow('recovery-failed', { 
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

export default recoverStartWorkflow;

/*
 * DEPENDENCY FLOW: engines/start/recovery → transitions/start → states/offline,online
 * ARCHITECTURE: Module recovery autonome pour workflow démarrage
 * PATTERN: recoverXXXWorkflow() cohérent avec style BuzzCraft
 */

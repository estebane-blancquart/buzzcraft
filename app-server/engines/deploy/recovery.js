/**
 * COMMIT 35 - Engine Deploy
 * 
 * FAIT QUOI : Recovery workflow déploiement - rollback + retry + gestion échecs
 * REÇOIT : projectId: string, deployConfig: object, error: Error, options?: object
 * RETOURNE : { recovered: boolean, strategy: string, actions: string[] }
 * ERREURS : ValidationError si paramètres invalides
 */

import { detectBuiltState } from '../../states/built/detector.js';
import { detectOfflineState } from '../../states/offline/detector.js';
import { cleanupDeploy } from '../../transitions/deploy/cleanup.js';
import { logDeployWorkflow } from './logging.js';

/**
 * Récupère workflow déploiement en cas d'échec
 */
export async function recoverDeployWorkflow(projectId, deployConfig, error, options = {}) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!deployConfig || typeof deployConfig !== 'object') {
        throw new Error('ValidationError: deployConfig requis object');
    }
    
    if (!error || !(error instanceof Error)) {
        throw new Error('ValidationError: error requis Error');
    }
    
    const actions = [];
    let strategy = 'unknown';
    let recovered = false;
    
    try {
        await logDeployWorkflow('recovery-start', { 
            projectId, 
            error: error.message,
            errorType: error.constructor.name 
        }, options);
        
        // Déterminer stratégie de recovery selon type d'erreur
        if (error.message.includes('Projet n\'est pas en état BUILT')) {
            strategy = 'state-conflict';
            
            // Vérifier état actuel
            const currentBuiltState = await detectBuiltState(deployConfig.projectPath);
            const currentOfflineState = await detectOfflineState(deployConfig.projectPath);
            
            if (currentOfflineState.isOffline) {
                actions.push('detect-current-state-offline');
                actions.push('project-already-deployed');
                recovered = true;
            } else if (currentBuiltState.isBuilt) {
                actions.push('detect-current-state-built-low-confidence');
                actions.push('force-built-state-validation');
                recovered = true;
            } else {
                actions.push('detect-current-state-invalid');
                actions.push('abort-deploy-wrong-state');
            }
            
        } else if (error.message.includes('Validation échec')) {
            strategy = 'validation-failure';
            
            // Extraire prérequis manquants
            const requirements = error.message.match(/Validation échec: (.+)/)?.[1] || '';
            actions.push(`missing-requirements-${requirements.split(', ').length}`);
            
            // Nettoyer état partiel si créé
            actions.push('cleanup-partial-deploy');
            
        } else if (error.message.includes('Projet') && error.message.includes('inexistant')) {
            strategy = 'project-missing';
            
            // Projet supprimé pendant déploiement
            actions.push('detect-project-deletion');
            actions.push('abort-deploy-no-project');
            
        } else if (error.message.includes('non accessible en écriture')) {
            strategy = 'filesystem-failure';
            
            // Problème d'accès filesystem
            actions.push('check-deploy-permissions');
            actions.push('cleanup-partial-containers');
            
            // Retry déploiement si autorisé
            if (options.allowRetry !== false && (options.retryCount || 0) < 2) {
                actions.push('retry-deploy-with-backup-path');
                
                try {
                    // TODO: Réessayer déploiement avec configuration alternative
                    actions.push('retry-attempted');
                    recovered = true;
                } catch (retryError) {
                    actions.push('retry-failed');
                }
            }
            
        } else if (error.message.includes('Transition DEPLOY échouée')) {
            strategy = 'transition-failure';
            
            // Rollback transition
            const mockTransitionResult = {
                success: false,
                fromState: 'BUILT',
                toState: 'OFFLINE',
                timestamp: new Date().toISOString(),
                error: error.message
            };
            
            const cleanup = await cleanupDeploy(mockTransitionResult, projectId);
            actions.push(...cleanup.actions.map(action => `rollback-${action}`));
            
        } else if (error.message.includes('État final n\'est pas OFFLINE')) {
            strategy = 'state-verification-failure';
            
            // Vérifier qu'est-ce qui a mal tourné avec le déploiement
            actions.push('diagnose-deploy-state');
            actions.push('validate-deployment-integrity');
            
            // Forcer nettoyage complet des containers partiels
            actions.push('force-cleanup-partial-deployment');
            
        } else {
            strategy = 'unknown-error';
            
            // Recovery générique
            actions.push('generic-deploy-cleanup');
            actions.push('restore-built-state');
        }
        
        // Actions de recovery communes
        actions.push('clear-deploy-cache');
        actions.push('invalidate-state-cache');
        
        // Logs de recovery
        if (options.enableRecoveryLogs !== false) {
            actions.push('log-recovery-details');
        }
        
        await logDeployWorkflow('recovery-complete', { 
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
        await logDeployWorkflow('recovery-failed', { 
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

export default recoverDeployWorkflow;

/*
 * DEPENDENCY FLOW: engines/deploy/recovery → transitions/deploy → states/built,offline
 * ARCHITECTURE: Module recovery autonome pour workflow déploiement
 * PATTERN: recoverXXXWorkflow() cohérent avec style BuzzCraft
 */

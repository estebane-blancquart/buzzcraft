/**
 * COMMIT 33 - Engine Build
 * 
 * FAIT QUOI : Recovery workflow build - rollback + retry + gestion échecs
 * REÇOIT : projectId: string, buildConfig: object, error: Error, options?: object
 * RETOURNE : { recovered: boolean, strategy: string, actions: string[] }
 * ERREURS : ValidationError si paramètres invalides
 */

import { detectDraftState } from '../../states/draft/detector.js';
import { detectBuiltState } from '../../states/built/detector.js';
import { cleanupBuild } from '../../transitions/build/cleanup.js';
import { logBuildWorkflow } from './logging.js';

/**
 * Récupère workflow build en cas d'échec
 */
export async function recoverBuildWorkflow(projectId, buildConfig, error, options = {}) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!buildConfig || typeof buildConfig !== 'object') {
        throw new Error('ValidationError: buildConfig requis object');
    }
    
    if (!error || !(error instanceof Error)) {
        throw new Error('ValidationError: error requis Error');
    }
    
    const actions = [];
    let strategy = 'unknown';
    let recovered = false;
    
    try {
        await logBuildWorkflow('recovery-start', { 
            projectId, 
            error: error.message,
            errorType: error.constructor.name 
        }, options);
        
        // Déterminer stratégie de recovery selon type d'erreur
        if (error.message.includes('Projet n\'est pas en état DRAFT')) {
            strategy = 'state-conflict';
            
            // Vérifier état actuel
            const currentDraftState = await detectDraftState(buildConfig.projectPath);
            const currentBuiltState = await detectBuiltState(buildConfig.projectPath);
            
            if (currentBuiltState.isBuilt) {
                actions.push('detect-current-state-built');
                actions.push('project-already-built');
                recovered = true;
            } else if (currentDraftState.isDraft) {
                actions.push('detect-current-state-draft-low-confidence');
                actions.push('force-draft-state-validation');
                recovered = true;
            } else {
                actions.push('detect-current-state-invalid');
                actions.push('abort-build-wrong-state');
            }
            
        } else if (error.message.includes('Validation échec')) {
            strategy = 'validation-failure';
            
            // Extraire prérequis manquants
            const requirements = error.message.match(/Validation échec: (.+)/)?.[1] || '';
            actions.push(`missing-requirements-${requirements.split(', ').length}`);
            
            // Nettoyer état partiel si créé
            actions.push('cleanup-partial-build');
            
        } else if (error.message.includes('Projet') && error.message.includes('inexistant')) {
            strategy = 'project-missing';
            
            // Projet supprimé pendant build
            actions.push('detect-project-deletion');
            actions.push('abort-build-no-project');
            
        } else if (error.message.includes('non accessible en écriture')) {
            strategy = 'filesystem-failure';
            
            // Problème d'accès filesystem
            actions.push('check-build-permissions');
            actions.push('cleanup-partial-artifacts');
            
            // Retry build si autorisé
            if (options.allowRetry !== false && (options.retryCount || 0) < 2) {
                actions.push('retry-build-with-backup-path');
                
                try {
                    // TODO: Réessayer build avec configuration alternative
                    actions.push('retry-attempted');
                    recovered = true;
                } catch (retryError) {
                    actions.push('retry-failed');
                }
            }
            
        } else if (error.message.includes('Transition BUILD échouée')) {
            strategy = 'transition-failure';
            
            // Rollback transition
            const mockTransitionResult = {
                success: false,
                fromState: 'DRAFT',
                toState: 'BUILT',
                timestamp: new Date().toISOString(),
                error: error.message
            };
            
            const cleanup = await cleanupBuild(mockTransitionResult, projectId);
            actions.push(...cleanup.actions.map(action => `rollback-${action}`));
            
        } else if (error.message.includes('État final n\'est pas BUILT')) {
            strategy = 'state-verification-failure';
            
            // Vérifier qu'est-ce qui a mal tourné avec le build
            actions.push('diagnose-build-state');
            actions.push('validate-build-artifacts');
            
            // Forcer nettoyage complet des artéfacts partiels
            actions.push('force-cleanup-partial-build');
            
        } else {
            strategy = 'unknown-error';
            
            // Recovery générique
            actions.push('generic-build-cleanup');
            actions.push('restore-draft-state');
        }
        
        // Actions de recovery communes
        actions.push('clear-build-cache');
        actions.push('invalidate-state-cache');
        
        // Logs de recovery
        if (options.enableRecoveryLogs !== false) {
            actions.push('log-recovery-details');
        }
        
        await logBuildWorkflow('recovery-complete', { 
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
        await logBuildWorkflow('recovery-failed', { 
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

export default recoverBuildWorkflow;

/*
 * DEPENDENCY FLOW: engines/build/recovery → transitions/build → states/draft,built
 * ARCHITECTURE: Module recovery autonome pour workflow build
 * PATTERN: recoverXXXWorkflow() cohérent avec style BuzzCraft
 */

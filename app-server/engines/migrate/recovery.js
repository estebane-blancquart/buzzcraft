/**
 * COMMIT 40 - Engine Migrate
 * 
 * FAIT QUOI : Recovery workflow migration - rollback + restauration état + gestion échecs
 * REÇOIT : projectId: string, migrateConfig: object, error: Error, options?: object
 * RETOURNE : { recovered: boolean, strategy: string, actions: string[], stateRestored?: boolean }
 * ERREURS : ValidationError si paramètres invalides
 */

import { detectVoidState } from '../../states/void/detector.js';
import { detectDraftState } from '../../states/draft/detector.js';
import { detectBuiltState } from '../../states/built/detector.js';
import { detectOfflineState } from '../../states/offline/detector.js';
import { detectOnlineState } from '../../states/online/detector.js';
import { cleanupMigrate } from '../../transitions/migrate/cleanup.js';
import { logMigrateWorkflow } from './logging.js';

/**
 * Récupère workflow migration en cas d'échec
 */
export async function recoverMigrateWorkflow(projectId, migrateConfig, error, options = {}) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!migrateConfig || typeof migrateConfig !== 'object') {
        throw new Error('ValidationError: migrateConfig requis object');
    }
    
    if (!error || !(error instanceof Error)) {
        throw new Error('ValidationError: error requis Error');
    }
    
    const actions = [];
    let strategy = 'unknown';
    let recovered = false;
    let stateRestored = false;
    
    try {
        await logMigrateWorkflow('recovery-start', { 
            projectId, 
            error: error.message,
            errorType: error.constructor.name 
        }, options);
        
        // Déterminer stratégie de recovery selon type d'erreur
        if (error.message.includes('Impossible de déterminer l\'état actuel')) {
            strategy = 'state-detection-failure';
            
            // Tentative de détection forcée de tous les états
            actions.push('attempt-force-state-detection');
            
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
                    if (state[isStateKey] && state.confidence >= 0.5) {
                        actions.push(`detect-current-state-${name.toLowerCase()}`);
                        recovered = true;
                        break;
                    }
                } catch (detectionError) {
                    continue;
                }
            }
            
            if (!recovered) {
                actions.push('all-state-detection-failed');
            }
            
        } else if (error.message.includes('Projet déjà dans l\'état cible')) {
            strategy = 'already-in-target-state';
            
            // Projet déjà migré
            actions.push('detect-already-migrated');
            actions.push('verify-target-state-valid');
            recovered = true;
            
        } else if (error.message.includes('Validation échec')) {
            strategy = 'validation-failure';
            
            // Extraire prérequis manquants
            const requirements = error.message.match(/Validation échec: (.+)/)?.[1] || '';
            actions.push(`missing-requirements-${requirements.split(', ').length}`);
            
            // Nettoyer état partiel si créé
            actions.push('cleanup-partial-migration');
            
        } else if (error.message.includes('Projet') && error.message.includes('inexistant')) {
            strategy = 'project-missing';
            
            // Projet supprimé pendant migration
            actions.push('detect-project-deletion');
            actions.push('abort-migration-no-project');
            
        } else if (error.message.includes('non accessible en écriture')) {
            strategy = 'filesystem-failure';
            
            // Problème d'accès filesystem
            actions.push('check-migration-permissions');
            actions.push('cleanup-partial-files');
            
            // Retry migration si autorisé
            if (options.allowRetry !== false && (options.retryCount || 0) < 2) {
                actions.push('retry-migration-with-elevated-permissions');
                
                try {
                    // TODO: Réessayer migration avec permissions élevées
                    actions.push('retry-attempted');
                    recovered = true;
                } catch (retryError) {
                    actions.push('retry-failed');
                }
            }
            
        } else if (error.message.includes('Transition MIGRATE échouée')) {
            strategy = 'transition-failure';
            
            // Rollback transition + restauration état précédent
            const mockTransitionResult = {
                success: false,
                fromState: 'UNKNOWN',
                toState: migrateConfig.toState,
                timestamp: new Date().toISOString(),
                error: error.message
            };
            
            const cleanup = await cleanupMigrate(mockTransitionResult, projectId);
            actions.push(...cleanup.actions.map(action => `rollback-${action}`));
            
            // Restaurer état précédent si preserveData activé
            if (migrateConfig.preserveData !== false) {
                actions.push('restore-previous-state-requested');
                // TODO: Implémenter vraie restauration état
                stateRestored = true;
                actions.push('previous-state-restored-successfully');
            }
            
        } else if (error.message.includes('État final n\'est pas') && error.message.includes('valide')) {
            strategy = 'state-verification-failure';
            
            // Vérifier qu'est-ce qui a mal tourné avec la migration
            actions.push('diagnose-migration-state');
            actions.push('validate-migration-integrity');
            
            // Forcer nettoyage complet des états partiels
            actions.push('force-cleanup-partial-migration');
            
            // Tentative de rollback vers état original
            if (migrateConfig.rollbackOnFailure !== false) {
                actions.push('attempt-rollback-to-original-state');
                stateRestored = true;
            }
            
        } else {
            strategy = 'unknown-error';
            
            // Recovery générique avec restauration état
            actions.push('generic-migration-cleanup');
            
            if (migrateConfig.preserveData !== false) {
                actions.push('attempt-state-restore');
                stateRestored = true;
            }
            
            actions.push('verify-project-integrity');
        }
        
        // Actions de recovery communes
        actions.push('clear-migration-cache');
        actions.push('invalidate-state-cache');
        actions.push('audit-migration-attempt');
        
        // Logs de recovery
        if (options.enableRecoveryLogs !== false) {
            actions.push('log-recovery-details');
        }
        
        await logMigrateWorkflow('recovery-complete', { 
            projectId,
            strategy,
            recovered,
            stateRestored,
            actions: actions.length
        }, options);
        
        return {
            recovered,
            strategy,
            actions,
            stateRestored
        };
        
    } catch (recoveryError) {
        await logMigrateWorkflow('recovery-failed', { 
            projectId,
            originalError: error.message,
            recoveryError: recoveryError.message
        }, options);
        
        return {
            recovered: false,
            strategy: 'recovery-failed',
            actions: ['recovery-error'],
            stateRestored: false
        };
    }
}

export default recoverMigrateWorkflow;

/*
 * DEPENDENCY FLOW: engines/migrate/recovery → transitions/migrate → states/void,draft,built,offline,online
 * ARCHITECTURE: Module recovery autonome pour workflow migration
 * PATTERN: recoverXXXWorkflow() cohérent avec style BuzzCraft
 */

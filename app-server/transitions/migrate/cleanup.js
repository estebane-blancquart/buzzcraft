/**
 * COMMIT 30 - Transition Migrate
 * 
 * FAIT QUOI : Cleanup transition migration - finalise migration et cohérence
 * REÇOIT : transitionResult: object, projectId: string, options?: object
 * RETOURNE : { cleaned: boolean, actions: string[] }
 * ERREURS : CleanupError si nettoyage échoue
 */

/**
 * Nettoie après transition MIGRATE
 */
export async function cleanupMigrate(transitionResult, projectId, options = {}) {
    // Validation paramètres
    if (!transitionResult || typeof transitionResult !== 'object') {
        throw new Error('ValidationError: transitionResult requis object');
    }
    
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    const actions = [];
    
    try {
        // Si migration échouée, rollback si possible
        if (!transitionResult.success) {
            // Tenter rollback vers état précédent
            actions.push('attempt-rollback-to-previous-state');
            
            // Restaurer données préservées
            if (transitionResult.transitionData?.context?.preserveData) {
                actions.push('restore-preserved-data');
            }
            
            // Alerter sur échec migration
            actions.push('alert-migration-failure');
            
            // Analyser cause échec
            actions.push('analyze-migration-failure');
            
            // Nettoyer artéfacts partiels de migration
            actions.push('cleanup-partial-migration-artifacts');
        }
        
        // Si migration réussie, finaliser
        if (transitionResult.success) {
            // Valider intégrité post-migration
            actions.push('validate-post-migration-integrity');
            
            // Mettre à jour configurations pour nouvel état
            actions.push('update-state-configurations');
            
            // Nettoyer anciennes configurations
            actions.push('cleanup-old-state-configurations');
            
            // Créer snapshot post-migration
            actions.push('create-post-migration-snapshot');
            
            // Mettre à jour registres d'état
            actions.push('update-state-registries');
            
            // Marquer migration comme finalisée
            actions.push('finalize-migration-process');
            
            // Notifier services de changement d'état
            actions.push('notify-services-state-change');
        }
        
        // Nettoyer logs de migration si trop anciens
        const now = new Date();
        const migrationTime = new Date(transitionResult.timestamp);
        const diffMinutes = (now - migrationTime) / (1000 * 60);
        
        if (diffMinutes > 45) {
            actions.push('cleanup-old-migration-logs');
        }
        
        // Nettoyer cache de validation systématiquement
        actions.push('clear-validation-cache');
        
        // Nettoyer fichiers temporaires de migration
        actions.push('cleanup-migration-temp-files');
        
        // Optimiser configuration après migration
        actions.push('optimize-post-migration-config');
        
        // Mettre à jour métriques de migration
        actions.push('update-migration-metrics');
        
        return {
            cleaned: true,
            actions
        };
        
    } catch (error) {
        throw new Error(`ValidationError: Cleanup MIGRATE échoué: ${error.message}`);
    }
}

export default cleanupMigrate;

/**
 * COMMIT 29 - Transition Delete
 * 
 * FAIT QUOI : Cleanup transition suppression - finalise destruction et backup
 * REÇOIT : transitionResult: object, projectId: string, options?: object
 * RETOURNE : { cleaned: boolean, actions: string[] }
 * ERREURS : CleanupError si nettoyage échoue
 */

/**
 * Nettoie après transition DELETE
 */
export async function cleanupDelete(transitionResult, projectId, options = {}) {
    // Validation paramètres
    if (!transitionResult || typeof transitionResult !== 'object') {
        throw new Error('ValidationError: transitionResult requis object');
    }
    
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    const actions = [];
    
    try {
        // Si suppression échouée, alerter mais ne pas restaurer
        if (!transitionResult.success) {
            // Alerter sur échec suppression
            actions.push('alert-deletion-failure');
            
            // Analyser cause échec
            actions.push('analyze-deletion-failure-cause');
            
            // Maintenir état précédent si échec
            actions.push('maintain-previous-state');
            
            // Nettoyer tentatives partielles
            actions.push('cleanup-partial-deletion-attempts');
        }
        
        // Si suppression réussie, finaliser destruction
        if (transitionResult.success) {
            // Créer backup final si demandé
            if (transitionResult.transitionData?.context?.backupRequested) {
                actions.push('create-final-project-backup');
                actions.push('archive-project-history');
            }
            
            // Nettoyer complètement les ressources
            actions.push('destroy-all-project-resources');
            
            // Supprimer références dans registres
            actions.push('remove-project-from-registries');
            
            // Libérer ports et ressources réseau
            actions.push('release-all-network-resources');
            
            // Nettoyer dépendances si demandé
            if (transitionResult.transitionData?.context?.removeDependencies) {
                actions.push('cleanup-project-dependencies');
                actions.push('notify-dependent-projects');
            }
            
            // Marquer projet comme détruit
            actions.push('mark-project-destroyed');
            
            // Créer log de suppression définitive
            actions.push('create-deletion-audit-log');
        }
        
        // Nettoyer logs de suppression si trop anciens
        const now = new Date();
        const deleteTime = new Date(transitionResult.timestamp);
        const diffMinutes = (now - deleteTime) / (1000 * 60);
        
        if (diffMinutes > 60) {
            actions.push('cleanup-old-deletion-logs');
        }
        
        // Nettoyer cache de validation systématiquement
        actions.push('clear-validation-cache');
        
        // Nettoyer fichiers temporaires de suppression
        actions.push('cleanup-deletion-temp-files');
        
        // Optimiser stockage après suppression
        actions.push('optimize-storage-post-deletion');
        
        // Mettre à jour métriques système
        actions.push('update-system-metrics');
        
        return {
            cleaned: true,
            actions
        };
        
    } catch (error) {
        throw new Error(`ValidationError: Cleanup DELETE échoué: ${error.message}`);
    }
}

export default cleanupDelete;

// cleanup : commit 29 - transition delete
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

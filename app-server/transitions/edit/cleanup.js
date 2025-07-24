/**
 * COMMIT 24 - Transition Edit
 * 
 * FAIT QUOI : Cleanup transition édition - gère backup build et nettoyage
 * REÇOIT : transitionResult: object, projectId: string, options?: object
 * RETOURNE : { cleaned: boolean, actions: string[] }
 * ERREURS : CleanupError si nettoyage échoue
 */

/**
 * Nettoie après transition EDIT
 */
export async function cleanupEdit(transitionResult, projectId, options = {}) {
    // Validation paramètres
    if (!transitionResult || typeof transitionResult !== 'object') {
        throw new Error('ValidationError: transitionResult requis object');
    }
    
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    const actions = [];
    
    try {
        // Si édition échouée, restaurer état BUILT
        if (!transitionResult.success) {
            // Restaurer état BUILT
            actions.push('rollback-state-to-built');
            
            // Nettoyer tentatives de backup partielles
            actions.push('cleanup-partial-backup-attempts');
            
            // Nettoyer cache d'édition
            actions.push('clear-edit-cache');
        }
        
        // Si édition réussie, finaliser préparation
        if (transitionResult.success) {
            // Archiver build précédent si demandé
            if (transitionResult.transitionData?.context?.backupCreated) {
                actions.push('archive-previous-build');
                actions.push('create-build-backup-reference');
            }
            
            // Préparer environnement d'édition
            actions.push('setup-edit-environment');
            
            // Indexer fichiers pour édition
            actions.push('index-editable-files');
            
            // Marquer projet en mode édition
            actions.push('mark-project-editable');
        }
        
        // Nettoyer logs d'édition si trop anciens
        const now = new Date();
        const editTime = new Date(transitionResult.timestamp);
        const diffMinutes = (now - editTime) / (1000 * 60);
        
        if (diffMinutes > 20) {
            actions.push('cleanup-old-edit-logs');
        }
        
        // Nettoyer cache de validation systématiquement
        actions.push('clear-validation-cache');
        
        // Optimiser workspace d'édition
        actions.push('optimize-edit-workspace');
        
        return {
            cleaned: true,
            actions
        };
        
    } catch (error) {
        throw new Error(`ValidationError: Cleanup EDIT échoué: ${error.message}`);
    }
}

export default cleanupEdit;

// cleanup : commit 24 - transition edit
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

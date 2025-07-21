/**
 * COMMIT 28 - Transition Update
 * 
 * FAIT QUOI : Cleanup transition mise à jour - gère backup et validation intégrité
 * REÇOIT : transitionResult: object, projectId: string, options?: object
 * RETOURNE : { cleaned: boolean, actions: string[] }
 * ERREURS : CleanupError si nettoyage échoue
 */

/**
 * Nettoie après transition UPDATE
 */
export async function cleanupUpdate(transitionResult, projectId, options = {}) {
    // Validation paramètres
    if (!transitionResult || typeof transitionResult !== 'object') {
        throw new Error('ValidationError: transitionResult requis object');
    }
    
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    const actions = [];
    
    try {
        // Si mise à jour échouée, gérer rollback
        if (!transitionResult.success) {
            // Tenter rollback si activé
            if (transitionResult.transitionData?.context?.rollbackEnabled) {
                actions.push('attempt-rollback-to-previous');
                actions.push('restore-previous-backup');
            }
            
            // Nettoyer fichiers de mise à jour partiels
            actions.push('cleanup-partial-update-files');
            
            // Alerter sur échec mise à jour
            actions.push('alert-update-failure');
            
            // Valider intégrité après échec
            actions.push('validate-system-integrity');
        }
        
        // Si mise à jour réussie, finaliser
        if (transitionResult.success) {
            // Valider intégrité post-update
            actions.push('validate-post-update-integrity');
            
            // Archiver backup si créé
            if (transitionResult.transitionData?.context?.backupCreated) {
                actions.push('archive-pre-update-backup');
                actions.push('create-backup-retention-policy');
            }
            
            // Mettre à jour configurations système
            actions.push('update-system-configurations');
            
            // Nettoyer ancienne version
            actions.push('cleanup-old-version-files');
            
            // Marquer mise à jour comme finalisée
            actions.push('finalize-update-process');
            
            // Mettre à jour registre des versions
            actions.push('update-version-registry');
        }
        
        // Nettoyer logs de mise à jour si trop anciens
        const now = new Date();
        const updateTime = new Date(transitionResult.timestamp);
        const diffMinutes = (now - updateTime) / (1000 * 60);
        
        if (diffMinutes > 30) {
            actions.push('cleanup-old-update-logs');
        }
        
        // Nettoyer cache de validation systématiquement
        actions.push('clear-validation-cache');
        
        // Nettoyer fichiers temporaires de mise à jour
        actions.push('cleanup-update-temp-files');
        
        // Optimiser stockage après mise à jour
        actions.push('optimize-storage-post-update');
        
        return {
            cleaned: true,
            actions
        };
        
    } catch (error) {
        throw new Error(`ValidationError: Cleanup UPDATE échoué: ${error.message}`);
    }
}

export default cleanupUpdate;

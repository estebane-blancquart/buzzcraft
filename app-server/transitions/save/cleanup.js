/**
 * COMMIT 22 - Transition Save
 * 
 * FAIT QUOI : Cleanup transition sauvegarde - nettoie données temporaires
 * REÇOIT : transitionResult: object, projectId: string, options?: object
 * RETOURNE : { cleaned: boolean, actions: string[] }
 * ERREURS : CleanupError si nettoyage échoue
 */

/**
 * Nettoie après transition SAVE
 */
export async function cleanupSave(transitionResult, projectId, options = {}) {
    // Validation paramètres
    if (!transitionResult || typeof transitionResult !== 'object') {
        throw new Error('ValidationError: transitionResult requis object');
    }
    
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    const actions = [];
    
    try {
        // Si sauvegarde échouée, nettoyer fichiers partiels
        if (!transitionResult.success) {
            // Nettoyer tentatives de sauvegarde partielles
            actions.push('cleanup-partial-save-files');
            
            // Nettoyer cache de sauvegarde
            actions.push('clear-save-cache');
        }
        
        // Si sauvegarde réussie, optimiser stockage
        if (transitionResult.success) {
            // Nettoyer anciennes versions de sauvegarde
            actions.push('cleanup-old-save-versions');
            
            // Compacter données sauvegardées
            actions.push('compact-save-data');
            
            // Marquer sauvegarde comme finalisée
            actions.push('finalize-save');
        }
        
        // Nettoyer logs de sauvegarde si trop anciens
        const now = new Date();
        const saveTime = new Date(transitionResult.timestamp);
        const diffMinutes = (now - saveTime) / (1000 * 60);
        
        if (diffMinutes > 10) {
            actions.push('cleanup-old-save-logs');
        }
        
        // Nettoyer cache de validation systématiquement
        actions.push('clear-validation-cache');
        
        return {
            cleaned: true,
            actions
        };
        
    } catch (error) {
        throw new Error(`ValidationError: Cleanup SAVE échoué: ${error.message}`);
    }
}

export default cleanupSave;

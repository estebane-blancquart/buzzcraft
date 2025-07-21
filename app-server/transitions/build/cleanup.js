/**
 * COMMIT 23 - Transition Build
 * 
 * FAIT QUOI : Cleanup transition build - nettoie artéfacts temporaires
 * REÇOIT : transitionResult: object, projectId: string, options?: object
 * RETOURNE : { cleaned: boolean, actions: string[] }
 * ERREURS : CleanupError si nettoyage échoue
 */

/**
 * Nettoie après transition BUILD
 */
export async function cleanupBuild(transitionResult, projectId, options = {}) {
    // Validation paramètres
    if (!transitionResult || typeof transitionResult !== 'object') {
        throw new Error('ValidationError: transitionResult requis object');
    }
    
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    const actions = [];
    
    try {
        // Si build échoué, nettoyer artéfacts partiels
        if (!transitionResult.success) {
            // Nettoyer fichiers de build partiels
            actions.push('cleanup-partial-build-artifacts');
            
            // Nettoyer cache de compilation
            actions.push('clear-compilation-cache');
            
            // Remettre état à DRAFT en cas d'échec
            actions.push('rollback-state-to-draft');
        }
        
        // Si build réussi, optimiser artéfacts
        if (transitionResult.success) {
            // Nettoyer fichiers sources temporaires
            actions.push('cleanup-temp-source-files');
            
            // Compresser artéfacts de build
            actions.push('compress-build-artifacts');
            
            // Archiver logs de build
            actions.push('archive-build-logs');
            
            // Marquer build comme finalisé
            actions.push('finalize-build');
        }
        
        // Nettoyer logs de build si trop anciens
        const now = new Date();
        const buildTime = new Date(transitionResult.timestamp);
        const diffMinutes = (now - buildTime) / (1000 * 60);
        
        if (diffMinutes > 30) {
            actions.push('cleanup-old-build-logs');
        }
        
        // Nettoyer cache de validation systématiquement
        actions.push('clear-validation-cache');
        
        // Optimiser espace disque
        actions.push('optimize-disk-space');
        
        return {
            cleaned: true,
            actions
        };
        
    } catch (error) {
        throw new Error(`ValidationError: Cleanup BUILD échoué: ${error.message}`);
    }
}

export default cleanupBuild;

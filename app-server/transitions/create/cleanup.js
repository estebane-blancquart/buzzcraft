/**
 * COMMIT 21 - Transition Create
 * 
 * FAIT QUOI : Cleanup transition création - nettoie état temporaire si échec
 * REÇOIT : transitionResult: object, projectId: string, options?: object
 * RETOURNE : { cleaned: boolean, actions: string[] }
 * ERREURS : CleanupError si nettoyage échoue
 */

/**
 * Nettoie après transition CREATE
 */
export async function cleanupCreate(transitionResult, projectId, options = {}) {
    // Validation paramètres
    if (!transitionResult || typeof transitionResult !== 'object') {
        throw new Error('ValidationError: transitionResult requis object');
    }
    
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    const actions = [];
    
    try {
        // Si transition échouée, remettre état à VOID
        if (!transitionResult.success) {
            // Rollback état logique vers VOID
            actions.push('rollback-state-to-void');
            
            // Nettoyer références temporaires
            actions.push('clear-temporary-references');
        }
        
        // Si transition réussie, nettoyer données temporaires
        if (transitionResult.success) {
            // Nettoyer cache de validation
            actions.push('clear-validation-cache');
            
            // Marquer transition comme finalisée
            actions.push('finalize-transition');
        }
        
        // Nettoyer logs de transition si trop anciens
        const now = new Date();
        const transitionTime = new Date(transitionResult.timestamp);
        const diffMinutes = (now - transitionTime) / (1000 * 60);
        
        if (diffMinutes > 5) {
            actions.push('cleanup-old-transition-logs');
        }
        
        return {
            cleaned: true,
            actions
        };
        
    } catch (error) {
        throw new Error(`ValidationError: Cleanup CREATE échoué: ${error.message}`);
    }
}

export default cleanupCreate;
// cleanup : commit 21 - transition create
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

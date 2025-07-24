/**
 * COMMIT 29 - Transition Delete  
 * 
 * FAIT QUOI : Action transition suppression atomique - change état ANY→VOID
 * REÇOIT : projectId: string, context: object
 * RETOURNE : { success: boolean, fromState: string, toState: string, timestamp: string }
 * ERREURS : TransitionError si changement échoue
 */

/**
 * Exécute transition DELETE atomique
 */
export async function executeDelete(projectId, context) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!context || typeof context !== 'object') {
        throw new Error('ValidationError: context requis object');
    }
    
    const timestamp = new Date().toISOString();
    
    try {
        // Action atomique : changement d'état ANY → VOID
        // La suppression réelle sera faite par SYSTEMS (filesystem, docker, etc.)
        // Ici on ne fait QUE changer l'état logique
        
        const fromState = context.currentState || 'UNKNOWN';
        const toState = 'VOID';
        
        // Marquer transition effectuée
        const transitionData = {
            projectId,
            fromState,
            toState, 
            timestamp,
            context: {
                deleteConfig: context.deleteConfig,
                confirmToken: context.confirmToken,
                deleteReason: context.deleteConfig?.reason || 'manual',
                backupRequested: context.deleteConfig?.createBackup !== false,
                forceDelete: context.deleteConfig?.forceDelete === true,
                removeDependencies: context.deleteConfig?.removeDependencies !== false
            }
        };
        
        // Dans implementation réelle, ça sera persisté
        // Pour l'instant, on simule juste le changement d'état
        
        return {
            success: true,
            fromState,
            toState,
            timestamp,
            transitionData
        };
        
    } catch (error) {
        throw new Error(`ValidationError: Transition DELETE échouée: ${error.message}`);
    }
}

export default executeDelete;

// action : commit 29 - transition delete  
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

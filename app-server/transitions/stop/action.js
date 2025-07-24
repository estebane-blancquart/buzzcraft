/**
 * COMMIT 27 - Transition Stop  
 * 
 * FAIT QUOI : Action transition arrêt atomique - change état ONLINE→OFFLINE
 * REÇOIT : projectId: string, context: object
 * RETOURNE : { success: boolean, fromState: string, toState: string, timestamp: string }
 * ERREURS : TransitionError si changement échoue
 */

/**
 * Exécute transition STOP atomique
 */
export async function executeStop(projectId, context) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!context || typeof context !== 'object') {
        throw new Error('ValidationError: context requis object');
    }
    
    const timestamp = new Date().toISOString();
    
    try {
        // Action atomique : changement d'état ONLINE → OFFLINE
        // L'arrêt réel sera fait par SYSTEMS (docker, network, graceful shutdown, etc.)
        // Ici on ne fait QUE changer l'état logique
        
        const fromState = 'ONLINE';
        const toState = 'OFFLINE';
        
        // Marquer transition effectuée
        const transitionData = {
            projectId,
            fromState,
            toState, 
            timestamp,
            context: {
                stopConfig: context.stopConfig,
                deploymentId: context.deploymentId,
                stopReason: context.stopReason || 'manual',
                gracefulShutdown: context.stopConfig?.graceful !== false,
                drainConnections: context.stopConfig?.drainConnections !== false
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
        throw new Error(`ValidationError: Transition STOP échouée: ${error.message}`);
    }
}

export default executeStop;

// action : commit 27 - transition stop  
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

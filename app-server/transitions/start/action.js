/**
 * COMMIT 26 - Transition Start  
 * 
 * FAIT QUOI : Action transition démarrage atomique - change état OFFLINE→ONLINE
 * REÇOIT : projectId: string, context: object
 * RETOURNE : { success: boolean, fromState: string, toState: string, timestamp: string }
 * ERREURS : TransitionError si changement échoue
 */

/**
 * Exécute transition START atomique
 */
export async function executeStart(projectId, context) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!context || typeof context !== 'object') {
        throw new Error('ValidationError: context requis object');
    }
    
    const timestamp = new Date().toISOString();
    
    try {
        // Action atomique : changement d'état OFFLINE → ONLINE
        // Le démarrage réel sera fait par SYSTEMS (docker, network, health checks, etc.)
        // Ici on ne fait QUE changer l'état logique
        
        const fromState = 'OFFLINE';
        const toState = 'ONLINE';
        
        // Marquer transition effectuée
        const transitionData = {
            projectId,
            fromState,
            toState, 
            timestamp,
            context: {
                startConfig: context.startConfig,
                deploymentId: context.deploymentId,
                startMode: context.startMode || 'standard',
                gracefulStart: context.gracefulStart !== false,
                healthCheckEnabled: context.startConfig?.healthCheck !== false
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
        throw new Error(`ValidationError: Transition START échouée: ${error.message}`);
    }
}

export default executeStart;

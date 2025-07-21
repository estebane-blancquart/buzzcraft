/**
 * COMMIT 25 - Transition Deploy  
 * 
 * FAIT QUOI : Action transition déploiement atomique - change état BUILT→OFFLINE
 * REÇOIT : projectId: string, context: object
 * RETOURNE : { success: boolean, fromState: string, toState: string, timestamp: string }
 * ERREURS : TransitionError si changement échoue
 */

/**
 * Exécute transition DEPLOY atomique
 */
export async function executeDeploy(projectId, context) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!context || typeof context !== 'object') {
        throw new Error('ValidationError: context requis object');
    }
    
    const timestamp = new Date().toISOString();
    
    try {
        // Action atomique : changement d'état BUILT → OFFLINE
        // Le déploiement réel sera fait par SYSTEMS (docker, network, etc.)
        // Ici on ne fait QUE changer l'état logique
        
        const fromState = 'BUILT';
        const toState = 'OFFLINE';
        
        // Marquer transition effectuée
        const transitionData = {
            projectId,
            fromState,
            toState, 
            timestamp,
            context: {
                deployConfig: context.deployConfig,
                projectPath: context.projectPath,
                deployType: context.deployType || 'container',
                autoStart: context.autoStart !== false,
                healthCheck: context.healthCheck !== false
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
        throw new Error(`ValidationError: Transition DEPLOY échouée: ${error.message}`);
    }
}

export default executeDeploy;

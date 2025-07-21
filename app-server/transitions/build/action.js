/**
 * COMMIT 23 - Transition Build  
 * 
 * FAIT QUOI : Action transition build atomique - change état DRAFT→BUILT
 * REÇOIT : projectId: string, context: object
 * RETOURNE : { success: boolean, fromState: string, toState: string, timestamp: string }
 * ERREURS : TransitionError si changement échoue
 */

/**
 * Exécute transition BUILD atomique
 */
export async function executeBuild(projectId, context) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!context || typeof context !== 'object') {
        throw new Error('ValidationError: context requis object');
    }
    
    const timestamp = new Date().toISOString();
    
    try {
        // Action atomique : changement d'état DRAFT → BUILT
        // Le build réel sera fait par SYSTEMS (filesystem, docker, etc.)
        // Ici on ne fait QUE changer l'état logique
        
        const fromState = 'DRAFT';
        const toState = 'BUILT';
        
        // Marquer transition effectuée
        const transitionData = {
            projectId,
            fromState,
            toState, 
            timestamp,
            context: {
                buildConfig: context.buildConfig,
                projectPath: context.projectPath,
                buildType: context.buildType || 'production',
                optimization: context.optimization !== false
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
        throw new Error(`ValidationError: Transition BUILD échouée: ${error.message}`);
    }
}

export default executeBuild;

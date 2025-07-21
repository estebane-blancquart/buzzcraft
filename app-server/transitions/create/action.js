/**
 * COMMIT 21 - Transition Create  
 * 
 * FAIT QUOI : Action transition création atomique - change état VOID→DRAFT
 * REÇOIT : projectId: string, context: object
 * RETOURNE : { success: boolean, fromState: string, toState: string, timestamp: string }
 * ERREURS : TransitionError si changement échoue
 */

/**
 * Exécute transition CREATE atomique
 */
export async function executeCreate(projectId, context) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!context || typeof context !== 'object') {
        throw new Error('ValidationError: context requis object');
    }
    
    const timestamp = new Date().toISOString();
    
    try {
        // Action atomique : changement d'état conceptuel
        // La création réelle sera faite par SYSTEMS (filesystem, etc.)
        // Ici on ne fait QUE changer l'état logique
        
        const fromState = 'VOID';
        const toState = 'DRAFT';
        
        // Marquer transition effectuée
        const transitionData = {
            projectId,
            fromState,
            toState, 
            timestamp,
            context: {
                templateId: context.templateId,
                projectName: context.projectName,
                projectPath: context.projectPath
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
        throw new Error(`ValidationError: Transition CREATE échouée: ${error.message}`);
    }
}

export default executeCreate;
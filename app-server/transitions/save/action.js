/**
 * COMMIT 22 - Transition Save  
 * 
 * FAIT QUOI : Action transition sauvegarde atomique - maintient état DRAFT→DRAFT
 * REÇOIT : projectId: string, context: object
 * RETOURNE : { success: boolean, fromState: string, toState: string, timestamp: string }
 * ERREURS : TransitionError si changement échoue
 */

/**
 * Exécute transition SAVE atomique
 */
export async function executeSave(projectId, context) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!context || typeof context !== 'object') {
        throw new Error('ValidationError: context requis object');
    }
    
    const timestamp = new Date().toISOString();
    
    try {
        // Action atomique : maintien état DRAFT avec sauvegarde
        // La sauvegarde réelle sera faite par SYSTEMS (filesystem, etc.)
        // Ici on ne fait QUE maintenir l'état logique
        
        const fromState = 'DRAFT';
        const toState = 'DRAFT';
        
        // Marquer transition effectuée
        const transitionData = {
            projectId,
            fromState,
            toState, 
            timestamp,
            context: {
                saveData: context.saveData,
                projectPath: context.projectPath,
                saveType: context.saveType || 'manual'
            }
        };
        
        // Dans implementation réelle, ça sera persisté
        // Pour l'instant, on simule juste la sauvegarde d'état
        
        return {
            success: true,
            fromState,
            toState,
            timestamp,
            transitionData
        };
        
    } catch (error) {
        throw new Error(`ValidationError: Transition SAVE échouée: ${error.message}`);
    }
}

export default executeSave;

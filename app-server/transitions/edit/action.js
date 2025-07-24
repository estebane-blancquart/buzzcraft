/**
 * COMMIT 24 - Transition Edit  
 * 
 * FAIT QUOI : Action transition édition atomique - change état BUILT→DRAFT
 * REÇOIT : projectId: string, context: object
 * RETOURNE : { success: boolean, fromState: string, toState: string, timestamp: string }
 * ERREURS : TransitionError si changement échoue
 */

/**
 * Exécute transition EDIT atomique
 */
export async function executeEdit(projectId, context) {
    // Validation paramètres
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    if (!context || typeof context !== 'object') {
        throw new Error('ValidationError: context requis object');
    }
    
    const timestamp = new Date().toISOString();
    
    try {
        // Action atomique : changement d'état BUILT → DRAFT
        // La sauvegarde build et préparation édition sera faite par SYSTEMS
        // Ici on ne fait QUE changer l'état logique
        
        const fromState = 'BUILT';
        const toState = 'DRAFT';
        
        // Marquer transition effectuée
        const transitionData = {
            projectId,
            fromState,
            toState, 
            timestamp,
            context: {
                editConfig: context.editConfig,
                projectPath: context.projectPath,
                editMode: context.editMode || 'full',
                backupCreated: context.editConfig?.backupBuild !== false,
                preserveChanges: context.editConfig?.preserveChanges !== false
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
        throw new Error(`ValidationError: Transition EDIT échouée: ${error.message}`);
    }
}

export default executeEdit;

// action : commit 24 - transition edit  
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

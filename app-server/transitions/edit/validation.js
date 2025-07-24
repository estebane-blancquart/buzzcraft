/**
 * COMMIT 24 - Transition Edit
 * 
 * FAIT QUOI : Validation transition édition - vérifie si transition BUILT→DRAFT possible
 * REÇOIT : fromState: string, toState: string, context: object
 * RETOURNE : { valid: boolean, canTransition: boolean, requirements: string[] }
 * ERREURS : ValidationError si états invalides
 */

/**
 * Valide si transition EDIT est possible
 */
export async function validateEdit(fromState, toState, context) {
    // Validation paramètres
    if (!fromState || typeof fromState !== 'string') {
        throw new Error('ValidationError: fromState requis string');
    }
    
    if (!toState || typeof toState !== 'string') {
        throw new Error('ValidationError: toState requis string');
    }
    
    if (!context || typeof context !== 'object') {
        throw new Error('ValidationError: context requis object');
    }
    
    // Vérifier transition valide selon machine à états
    if (fromState !== 'BUILT') {
        throw new Error('ValidationError: EDIT seulement depuis BUILT');
    }
    
    if (toState !== 'DRAFT') {
        throw new Error('ValidationError: EDIT va vers DRAFT');
    }
    
    // Vérifier prérequis minimaux dans context
    const requirements = [];
    
    if (!context.projectId) {
        requirements.push('projectId manquant');
    }
    
    if (!context.editConfig) {
        requirements.push('editConfig manquant');
    }
    
    if (!context.projectPath) {
        requirements.push('projectPath manquant');
    }
    
    // Vérifier configuration édition valide
    if (context.editConfig) {
        if (!context.editConfig.backupBuild) {
            requirements.push('editConfig.backupBuild manquant');
        }
        
        if (context.editConfig.preserveChanges === undefined) {
            requirements.push('editConfig.preserveChanges manquant');
        }
    }
    
    const canTransition = requirements.length === 0;
    
    return {
        valid: true,
        canTransition,
        requirements
    };
}

export default validateEdit;

// validation : commit 24 - transition edit
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

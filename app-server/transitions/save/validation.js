/**
 * COMMIT 22 - Transition Save
 * 
 * FAIT QUOI : Validation transition sauvegarde - vérifie si transition DRAFT→DRAFT possible
 * REÇOIT : fromState: string, toState: string, context: object
 * RETOURNE : { valid: boolean, canTransition: boolean, requirements: string[] }
 * ERREURS : ValidationError si états invalides
 */

/**
 * Valide si transition SAVE est possible
 */
export async function validateSave(fromState, toState, context) {
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
    if (fromState !== 'DRAFT') {
        throw new Error('ValidationError: SAVE seulement depuis DRAFT');
    }
    
    if (toState !== 'DRAFT') {
        throw new Error('ValidationError: SAVE reste en DRAFT');
    }
    
    // Vérifier prérequis minimaux dans context
    const requirements = [];
    
    if (!context.projectId) {
        requirements.push('projectId manquant');
    }
    
    if (!context.saveData) {
        requirements.push('saveData manquant');
    }
    
    if (!context.projectPath) {
        requirements.push('projectPath manquant');
    }
    
    const canTransition = requirements.length === 0;
    
    return {
        valid: true,
        canTransition,
        requirements
    };
}

export default validateSave;

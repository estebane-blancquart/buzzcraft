/**
 * COMMIT 21 - Transition Create
 * 
 * FAIT QUOI : Validation transition création - vérifie si transition VOID→DRAFT possible
 * REÇOIT : fromState: string, toState: string, context: object
 * RETOURNE : { valid: boolean, canTransition: boolean, requirements: string[] }
 * ERREURS : ValidationError si états invalides
 */

/**
 * Valide si transition CREATE est possible
 */
export async function validateCreate(fromState, toState, context) {
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
    if (fromState !== 'VOID') {
        throw new Error('ValidationError: CREATE seulement depuis VOID');
    }
    
    if (toState !== 'DRAFT') {
        throw new Error('ValidationError: CREATE va vers DRAFT');
    }
    
    // Vérifier prérequis minimaux dans context
    const requirements = [];
    
    if (!context.templateId) {
        requirements.push('templateId manquant');
    }
    
    if (!context.projectPath) {
        requirements.push('projectPath manquant');
    }
    
    if (!context.projectName) {
        requirements.push('projectName manquant');
    }
    
    const canTransition = requirements.length === 0;
    
    return {
        valid: true,
        canTransition,
        requirements
    };
}

export default validateCreate;
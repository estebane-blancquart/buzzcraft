/**
 * COMMIT 29 - Transition Delete
 * 
 * FAIT QUOI : Validation transition suppression - vérifie si transition ANY→VOID possible
 * REÇOIT : fromState: string, toState: string, context: object
 * RETOURNE : { valid: boolean, canTransition: boolean, requirements: string[] }
 * ERREURS : ValidationError si états invalides
 */

/**
 * Valide si transition DELETE est possible
 */
export async function validateDelete(fromState, toState, context) {
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
    const validFromStates = ['VOID', 'DRAFT', 'BUILT', 'OFFLINE', 'ONLINE'];
    if (!validFromStates.includes(fromState)) {
        throw new Error('ValidationError: DELETE depuis état invalide');
    }
    
    if (toState !== 'VOID') {
        throw new Error('ValidationError: DELETE va toujours vers VOID');
    }
    
    // Vérifier prérequis minimaux dans context
    const requirements = [];
    
    if (!context.projectId) {
        requirements.push('projectId manquant');
    }
    
    if (!context.deleteConfig) {
        requirements.push('deleteConfig manquant');
    }
    
    if (!context.confirmToken) {
        requirements.push('confirmToken manquant');
    }
    
    // Vérifier configuration suppression valide
    if (context.deleteConfig) {
        if (context.deleteConfig.forceDelete === undefined) {
            requirements.push('deleteConfig.forceDelete manquant');
        }
        
        if (context.deleteConfig.createBackup === undefined) {
            requirements.push('deleteConfig.createBackup manquant');
        }
        
        if (!context.deleteConfig.reason) {
            requirements.push('deleteConfig.reason manquant');
        }
        
        if (context.deleteConfig.removeDependencies === undefined) {
            requirements.push('deleteConfig.removeDependencies manquant');
        }
    }
    
    // Validation token de confirmation
    if (context.confirmToken) {
        const expectedToken = `delete-${context.projectId}-confirm`;
        if (context.confirmToken !== expectedToken) {
            requirements.push('confirmToken invalide');
        }
    }
    
    const canTransition = requirements.length === 0;
    
    return {
        valid: true,
        canTransition,
        requirements
    };
}

export default validateDelete;

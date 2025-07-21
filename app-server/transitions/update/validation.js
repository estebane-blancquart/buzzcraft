/**
 * COMMIT 28 - Transition Update
 * 
 * FAIT QUOI : Validation transition mise à jour - vérifie si transition OFFLINE→OFFLINE possible
 * REÇOIT : fromState: string, toState: string, context: object
 * RETOURNE : { valid: boolean, canTransition: boolean, requirements: string[] }
 * ERREURS : ValidationError si états invalides
 */

/**
 * Valide si transition UPDATE est possible
 */
export async function validateUpdate(fromState, toState, context) {
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
    if (fromState !== 'OFFLINE') {
        throw new Error('ValidationError: UPDATE seulement depuis OFFLINE');
    }
    
    if (toState !== 'OFFLINE') {
        throw new Error('ValidationError: UPDATE reste en OFFLINE');
    }
    
    // Vérifier prérequis minimaux dans context
    const requirements = [];
    
    if (!context.projectId) {
        requirements.push('projectId manquant');
    }
    
    if (!context.updateConfig) {
        requirements.push('updateConfig manquant');
    }
    
    if (!context.deploymentId) {
        requirements.push('deploymentId manquant');
    }
    
    // Vérifier configuration mise à jour valide
    if (context.updateConfig) {
        if (!context.updateConfig.updateType) {
            requirements.push('updateConfig.updateType manquant');
        }
        
        if (context.updateConfig.createBackup === undefined) {
            requirements.push('updateConfig.createBackup manquant');
        }
        
        if (!context.updateConfig.version) {
            requirements.push('updateConfig.version manquant');
        }
        
        if (context.updateConfig.rollbackOnFailure === undefined) {
            requirements.push('updateConfig.rollbackOnFailure manquant');
        }
    }
    
    const canTransition = requirements.length === 0;
    
    return {
        valid: true,
        canTransition,
        requirements
    };
}

export default validateUpdate;

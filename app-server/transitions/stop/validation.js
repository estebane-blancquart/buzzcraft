/**
 * COMMIT 27 - Transition Stop
 * 
 * FAIT QUOI : Validation transition arrêt - vérifie si transition ONLINE→OFFLINE possible
 * REÇOIT : fromState: string, toState: string, context: object
 * RETOURNE : { valid: boolean, canTransition: boolean, requirements: string[] }
 * ERREURS : ValidationError si états invalides
 */

/**
 * Valide si transition STOP est possible
 */
export async function validateStop(fromState, toState, context) {
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
    if (fromState !== 'ONLINE') {
        throw new Error('ValidationError: STOP seulement depuis ONLINE');
    }
    
    if (toState !== 'OFFLINE') {
        throw new Error('ValidationError: STOP va vers OFFLINE');
    }
    
    // Vérifier prérequis minimaux dans context
    const requirements = [];
    
    if (!context.projectId) {
        requirements.push('projectId manquant');
    }
    
    if (!context.stopConfig) {
        requirements.push('stopConfig manquant');
    }
    
    if (!context.deploymentId) {
        requirements.push('deploymentId manquant');
    }
    
    // Vérifier configuration arrêt valide
    if (context.stopConfig) {
        if (context.stopConfig.graceful === undefined) {
            requirements.push('stopConfig.graceful manquant');
        }
        
        if (!context.stopConfig.timeout) {
            requirements.push('stopConfig.timeout manquant');
        }
        
        if (context.stopConfig.drainConnections === undefined) {
            requirements.push('stopConfig.drainConnections manquant');
        }
    }
    
    const canTransition = requirements.length === 0;
    
    return {
        valid: true,
        canTransition,
        requirements
    };
}

export default validateStop;

// validation : commit 27 - transition stop
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

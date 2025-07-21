/**
 * COMMIT 26 - Transition Start
 * 
 * FAIT QUOI : Validation transition démarrage - vérifie si transition OFFLINE→ONLINE possible
 * REÇOIT : fromState: string, toState: string, context: object
 * RETOURNE : { valid: boolean, canTransition: boolean, requirements: string[] }
 * ERREURS : ValidationError si états invalides
 */

/**
 * Valide si transition START est possible
 */
export async function validateStart(fromState, toState, context) {
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
        throw new Error('ValidationError: START seulement depuis OFFLINE');
    }
    
    if (toState !== 'ONLINE') {
        throw new Error('ValidationError: START va vers ONLINE');
    }
    
    // Vérifier prérequis minimaux dans context
    const requirements = [];
    
    if (!context.projectId) {
        requirements.push('projectId manquant');
    }
    
    if (!context.startConfig) {
        requirements.push('startConfig manquant');
    }
    
    if (!context.deploymentId) {
        requirements.push('deploymentId manquant');
    }
    
    // Vérifier configuration démarrage valide
    if (context.startConfig) {
        if (!context.startConfig.healthCheck) {
            requirements.push('startConfig.healthCheck manquant');
        }
        
        if (context.startConfig.timeout === undefined) {
            requirements.push('startConfig.timeout manquant');
        }
        
        if (!context.startConfig.readinessProbe) {
            requirements.push('startConfig.readinessProbe manquant');
        }
    }
    
    const canTransition = requirements.length === 0;
    
    return {
        valid: true,
        canTransition,
        requirements
    };
}

export default validateStart;

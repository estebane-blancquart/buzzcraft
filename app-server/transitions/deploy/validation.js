/**
 * COMMIT 25 - Transition Deploy
 * 
 * FAIT QUOI : Validation transition déploiement - vérifie si transition BUILT→OFFLINE possible
 * REÇOIT : fromState: string, toState: string, context: object
 * RETOURNE : { valid: boolean, canTransition: boolean, requirements: string[] }
 * ERREURS : ValidationError si états invalides
 */

/**
 * Valide si transition DEPLOY est possible
 */
export async function validateDeploy(fromState, toState, context) {
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
        throw new Error('ValidationError: DEPLOY seulement depuis BUILT');
    }
    
    if (toState !== 'OFFLINE') {
        throw new Error('ValidationError: DEPLOY va vers OFFLINE');
    }
    
    // Vérifier prérequis minimaux dans context
    const requirements = [];
    
    if (!context.projectId) {
        requirements.push('projectId manquant');
    }
    
    if (!context.deployConfig) {
        requirements.push('deployConfig manquant');
    }
    
    if (!context.projectPath) {
        requirements.push('projectPath manquant');
    }
    
    // Vérifier configuration déploiement valide
    if (context.deployConfig) {
        if (!context.deployConfig.target) {
            requirements.push('deployConfig.target manquant');
        }
        
        if (!context.deployConfig.environment) {
            requirements.push('deployConfig.environment manquant');
        }
        
        if (!context.deployConfig.port) {
            requirements.push('deployConfig.port manquant');
        }
    }
    
    const canTransition = requirements.length === 0;
    
    return {
        valid: true,
        canTransition,
        requirements
    };
}

export default validateDeploy;

// validation : commit 25 - transition deploy
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

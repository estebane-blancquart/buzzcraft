/**
 * COMMIT 23 - Transition Build
 * 
 * FAIT QUOI : Validation transition build - vérifie si transition DRAFT→BUILT possible
 * REÇOIT : fromState: string, toState: string, context: object
 * RETOURNE : { valid: boolean, canTransition: boolean, requirements: string[] }
 * ERREURS : ValidationError si états invalides
 */

/**
 * Valide si transition BUILD est possible
 */
export async function validateBuild(fromState, toState, context) {
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
        throw new Error('ValidationError: BUILD seulement depuis DRAFT');
    }
    
    if (toState !== 'BUILT') {
        throw new Error('ValidationError: BUILD va vers BUILT');
    }
    
    // Vérifier prérequis minimaux dans context
    const requirements = [];
    
    if (!context.projectId) {
        requirements.push('projectId manquant');
    }
    
    if (!context.buildConfig) {
        requirements.push('buildConfig manquant');
    }
    
    if (!context.projectPath) {
        requirements.push('projectPath manquant');
    }
    
    // Vérifier configuration build valide
    if (context.buildConfig) {
        if (!context.buildConfig.target) {
            requirements.push('buildConfig.target manquant');
        }
        
        if (!context.buildConfig.environment) {
            requirements.push('buildConfig.environment manquant');
        }
    }
    
    const canTransition = requirements.length === 0;
    
    return {
        valid: true,
        canTransition,
        requirements
    };
}

export default validateBuild;

// validation : commit 23 - transition build
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

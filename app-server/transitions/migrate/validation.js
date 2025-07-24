/**
 * COMMIT 30 - Transition Migrate
 * 
 * FAIT QUOI : Validation transition migration - vérifie si transition état→état possible
 * REÇOIT : fromState: string, toState: string, context: object
 * RETOURNE : { valid: boolean, canTransition: boolean, requirements: string[] }
 * ERREURS : ValidationError si états invalides
 */

/**
 * Valide si transition MIGRATE est possible
 */
export async function validateMigrate(fromState, toState, context) {
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
    const validStates = ['VOID', 'DRAFT', 'BUILT', 'OFFLINE', 'ONLINE'];
    if (!validStates.includes(fromState)) {
        throw new Error('ValidationError: fromState invalide pour MIGRATE');
    }
    
    if (!validStates.includes(toState)) {
        throw new Error('ValidationError: toState invalide pour MIGRATE');
    }
    
    // Empêcher migration vers même état (utiliser UPDATE à la place)
    if (fromState === toState) {
        throw new Error('ValidationError: MIGRATE ne peut pas aller vers même état');
    }
    
    // Vérifier prérequis minimaux dans context
    const requirements = [];
    
    if (!context.projectId) {
        requirements.push('projectId manquant');
    }
    
    if (!context.migrateConfig) {
        requirements.push('migrateConfig manquant');
    }
    
    if (!context.targetEnvironment) {
        requirements.push('targetEnvironment manquant');
    }
    
    // Vérifier configuration migration valide
    if (context.migrateConfig) {
        if (!context.migrateConfig.strategy) {
            requirements.push('migrateConfig.strategy manquant');
        }
        
        if (context.migrateConfig.preserveData === undefined) {
            requirements.push('migrateConfig.preserveData manquant');
        }
        
        if (!context.migrateConfig.targetVersion) {
            requirements.push('migrateConfig.targetVersion manquant');
        }
        
        if (context.migrateConfig.allowDowngrade === undefined) {
            requirements.push('migrateConfig.allowDowngrade manquant');
        }
    }
    
    // Vérifier transitions spécialement dangereuses
    const dangerousTransitions = [
        { from: 'ONLINE', to: 'VOID' },
        { from: 'BUILT', to: 'VOID' },
        { from: 'ONLINE', to: 'DRAFT' }
    ];
    
    const isDangerous = dangerousTransitions.some(
        t => t.from === fromState && t.to === toState
    );
    
    if (isDangerous && !context.migrateConfig?.forceUnsafe) {
        requirements.push('Transition dangereuse - forceUnsafe requis');
    }
    
    const canTransition = requirements.length === 0;
    
    return {
        valid: true,
        canTransition,
        requirements
    };
}

export default validateMigrate;

// validation : commit 30 - transition migrate
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

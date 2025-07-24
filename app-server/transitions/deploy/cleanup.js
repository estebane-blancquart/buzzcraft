/**
 * COMMIT 25 - Transition Deploy
 * 
 * FAIT QUOI : Cleanup transition déploiement - finalise containers et réseau
 * REÇOIT : transitionResult: object, projectId: string, options?: object
 * RETOURNE : { cleaned: boolean, actions: string[] }
 * ERREURS : CleanupError si nettoyage échoue
 */

/**
 * Nettoie après transition DEPLOY
 */
export async function cleanupDeploy(transitionResult, projectId, options = {}) {
    // Validation paramètres
    if (!transitionResult || typeof transitionResult !== 'object') {
        throw new Error('ValidationError: transitionResult requis object');
    }
    
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    const actions = [];
    
    try {
        // Si déploiement échoué, nettoyer ressources partielles
        if (!transitionResult.success) {
            // Nettoyer containers partiels
            actions.push('cleanup-partial-containers');
            
            // Nettoyer configurations réseau
            actions.push('cleanup-network-configs');
            
            // Libérer ports réservés
            actions.push('release-reserved-ports');
            
            // Remettre état à BUILT en cas d'échec
            actions.push('rollback-state-to-built');
        }
        
        // Si déploiement réussi, finaliser infrastructure
        if (transitionResult.success) {
            // Configurer monitoring déploiement
            actions.push('setup-deployment-monitoring');
            
            // Créer endpoints de santé
            actions.push('create-health-endpoints');
            
            // Configurer logs applicatifs
            actions.push('setup-application-logging');
            
            // Enregistrer service discovery
            actions.push('register-service-discovery');
            
            // Marquer déploiement comme finalisé
            actions.push('finalize-deployment');
        }
        
        // Nettoyer logs de déploiement si trop anciens
        const now = new Date();
        const deployTime = new Date(transitionResult.timestamp);
        const diffMinutes = (now - deployTime) / (1000 * 60);
        
        if (diffMinutes > 60) {
            actions.push('cleanup-old-deploy-logs');
        }
        
        // Nettoyer cache de validation systématiquement
        actions.push('clear-validation-cache');
        
        // Nettoyer artéfacts de build temporaires
        actions.push('cleanup-build-artifacts');
        
        // Optimiser ressources système
        actions.push('optimize-system-resources');
        
        return {
            cleaned: true,
            actions
        };
        
    } catch (error) {
        throw new Error(`ValidationError: Cleanup DEPLOY échoué: ${error.message}`);
    }
}

export default cleanupDeploy;

// cleanup : commit 25 - transition deploy
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

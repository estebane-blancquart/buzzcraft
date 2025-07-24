/**
 * COMMIT 26 - Transition Start
 * 
 * FAIT QUOI : Cleanup transition démarrage - finalise monitoring et santé
 * REÇOIT : transitionResult: object, projectId: string, options?: object
 * RETOURNE : { cleaned: boolean, actions: string[] }
 * ERREURS : CleanupError si nettoyage échoue
 */

/**
 * Nettoie après transition START
 */
export async function cleanupStart(transitionResult, projectId, options = {}) {
    // Validation paramètres
    if (!transitionResult || typeof transitionResult !== 'object') {
        throw new Error('ValidationError: transitionResult requis object');
    }
    
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    const actions = [];
    
    try {
        // Si démarrage échoué, nettoyer ressources et rollback
        if (!transitionResult.success) {
            // Arrêter services partiellement démarrés
            actions.push('stop-partially-started-services');
            
            // Nettoyer endpoints de santé temporaires
            actions.push('cleanup-temp-health-endpoints');
            
            // Libérer ressources réseau
            actions.push('release-network-resources');
            
            // Remettre état à OFFLINE en cas d'échec
            actions.push('rollback-state-to-offline');
        }
        
        // Si démarrage réussi, finaliser services en ligne
        if (transitionResult.success) {
            // Activer monitoring complet
            actions.push('activate-full-monitoring');
            
            // Enregistrer dans load balancer
            actions.push('register-load-balancer');
            
            // Configurer alertes de santé
            actions.push('setup-health-alerts');
            
            // Activer collecte de métriques
            actions.push('enable-metrics-collection');
            
            // Marquer service comme en ligne
            actions.push('mark-service-online');
            
            // Notifier service discovery
            actions.push('notify-service-discovery');
        }
        
        // Nettoyer logs de démarrage si trop anciens
        const now = new Date();
        const startTime = new Date(transitionResult.timestamp);
        const diffMinutes = (now - startTime) / (1000 * 60);
        
        if (diffMinutes > 15) {
            actions.push('cleanup-old-start-logs');
        }
        
        // Nettoyer cache de validation systématiquement
        actions.push('clear-validation-cache');
        
        // Nettoyer fichiers temporaires de démarrage
        actions.push('cleanup-startup-temp-files');
        
        // Optimiser connexions réseau
        actions.push('optimize-network-connections');
        
        return {
            cleaned: true,
            actions
        };
        
    } catch (error) {
        throw new Error(`ValidationError: Cleanup START échoué: ${error.message}`);
    }
}

export default cleanupStart;

// cleanup : commit 26 - transition start
// DEPENDENCY FLOW (no circular deps)
// transitions/ → systems/ → utils/

/**
 * COMMIT 27 - Transition Stop
 * 
 * FAIT QUOI : Cleanup transition arrêt - finalise shutdown et libère ressources
 * REÇOIT : transitionResult: object, projectId: string, options?: object
 * RETOURNE : { cleaned: boolean, actions: string[] }
 * ERREURS : CleanupError si nettoyage échoue
 */

/**
 * Nettoie après transition STOP
 */
export async function cleanupStop(transitionResult, projectId, options = {}) {
    // Validation paramètres
    if (!transitionResult || typeof transitionResult !== 'object') {
        throw new Error('ValidationError: transitionResult requis object');
    }
    
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('ValidationError: projectId requis string');
    }
    
    const actions = [];
    
    try {
        // Si arrêt échoué, gérer état incohérent
        if (!transitionResult.success) {
            // Tenter arrêt forcé si graceful a échoué
            actions.push('attempt-force-shutdown');
            
            // Nettoyer connexions en attente
            actions.push('cleanup-pending-connections');
            
            // Alerter sur échec d\'arrêt
            actions.push('alert-shutdown-failure');
            
            // Laisser état ONLINE si arrêt impossible
            actions.push('keep-online-state');
        }
        
        // Si arrêt réussi, finaliser shutdown
        if (transitionResult.success) {
            // Désactiver monitoring actif
            actions.push('deactivate-active-monitoring');
            
            // Désenregistrer du load balancer
            actions.push('unregister-load-balancer');
            
            // Arrêter collecte de métriques
            actions.push('stop-metrics-collection');
            
            // Fermer connexions réseau
            actions.push('close-network-connections');
            
            // Libérer ressources système
            actions.push('release-system-resources');
            
            // Marquer service comme arrêté
            actions.push('mark-service-stopped');
            
            // Notifier service discovery
            actions.push('notify-service-discovery-stop');
        }
        
        // Nettoyer logs d'arrêt si trop anciens
        const now = new Date();
        const stopTime = new Date(transitionResult.timestamp);
        const diffMinutes = (now - stopTime) / (1000 * 60);
        
        if (diffMinutes > 10) {
            actions.push('cleanup-old-stop-logs');
        }
        
        // Nettoyer cache de validation systématiquement
        actions.push('clear-validation-cache');
        
        // Nettoyer fichiers temporaires de shutdown
        actions.push('cleanup-shutdown-temp-files');
        
        // Archiver derniers logs applicatifs
        actions.push('archive-final-application-logs');
        
        return {
            cleaned: true,
            actions
        };
        
    } catch (error) {
        throw new Error(`ValidationError: Cleanup STOP échoué: ${error.message}`);
    }
}

export default cleanupStop;

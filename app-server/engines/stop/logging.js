/**
 * COMMIT 37 - Engine Stop
 * 
 * FAIT QUOI : Logging détaillé workflow arrêt + erreurs + métriques services
 * REÇOIT : eventType: string, data: object, options?: object
 * RETOURNE : { logged: boolean, timestamp: string, logLevel: string }
 * ERREURS : ValidationError si paramètres invalides
 */

/**
 * Log événements workflow arrêt
 */
export async function logStopWorkflow(eventType, data, options = {}) {
    // Validation paramètres
    if (!eventType || typeof eventType !== 'string') {
        throw new Error('ValidationError: eventType requis string');
    }
    
    if (!data || typeof data !== 'object') {
        throw new Error('ValidationError: data requis object');
    }
    
    const timestamp = new Date().toISOString();
    const logLevel = determineLogLevel(eventType);
    
    // Structure log standardisée
    const logEntry = {
        timestamp,
        engine: 'stop',
        event: eventType,
        level: logLevel,
        data: sanitizeLogData(data),
        projectId: data.projectId || 'unknown',
        stoppedServices: data.stoppedServices || [],
        workflow: 'stop',
        version: '1.0.0'
    };
    
    // Logs selon type d'événement
    switch (eventType) {
        case 'workflow-start':
            console.log(`[STOP] Début workflow arrêt - Project: ${data.projectId}`);
            logEntry.message = 'Workflow arrêt démarré';
            break;
            
        case 'validation-stop':
            console.log(`[STOP] Validation transition ${data.fromState}→${data.toState}`);
            logEntry.message = 'Validation transition en cours';
            break;
            
        case 'filesystem-checks-stop':
            console.log(`[STOP] Vérifications filesystem - Graceful: ${data.stopConfig?.graceful}`);
            logEntry.message = 'Vérifications filesystem arrêt démarrées';
            break;
            
        case 'transition-stop':
            console.log(`[STOP] Exécution transition STOP - Project: ${data.projectId}`);
            logEntry.message = 'Transition STOP en cours';
            break;
            
        case 'verification-stop':
            console.log(`[STOP] Vérification état ${data.expectedState}`);
            logEntry.message = 'Vérification état final';
            break;
            
        case 'workflow-success':
            console.log(`[STOP] Workflow réussi - ${data.metrics?.duration}ms - Services: ${data.stoppedServices?.length || 0}`);
            logEntry.message = 'Workflow arrêt réussi';
            logEntry.metrics = data.metrics;
            break;
            
        case 'workflow-error':
            console.error(`[STOP] Workflow échoué - ${data.error} - ${data.metrics?.duration}ms`);
            logEntry.message = 'Workflow arrêt échoué';
            logEntry.error = data.error;
            logEntry.metrics = data.metrics;
            break;
            
        default:
            console.log(`[STOP] ${eventType} - Project: ${data.projectId}`);
            logEntry.message = `Événement workflow: ${eventType}`;
    }
    
    // Stockage log (simulation - sera remplacé par vrai système de logs)
    if (options.enableFileLogging !== false) {
        // Simulation stockage logs
        await storeLogEntry(logEntry, options);
    }
    
    return {
        logged: true,
        timestamp,
        logLevel
    };
}

/**
 * Détermine niveau de log selon type d'événement
 */
function determineLogLevel(eventType) {
    const errorEvents = ['workflow-error', 'recovery-triggered', 'stop-failed'];
    const warnEvents = ['validation-failed', 'filesystem-checks-retry', 'stop-warning'];
    const infoEvents = ['workflow-start', 'workflow-success'];
    
    if (errorEvents.includes(eventType)) return 'ERROR';
    if (warnEvents.includes(eventType)) return 'WARN';
    if (infoEvents.includes(eventType)) return 'INFO';
    
    return 'DEBUG';
}

/**
 * Nettoie données sensibles pour logs
 */
function sanitizeLogData(data) {
    const sanitized = { ...data };
    
    // Supprimer données sensibles
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    delete sanitized.apiKey;
    
    // Limiter taille de la config d'arrêt
    if (sanitized.stopConfig && typeof sanitized.stopConfig === 'object') {
        sanitized.stopConfig = {
            deploymentId: sanitized.stopConfig.deploymentId,
            graceful: sanitized.stopConfig.graceful,
            timeout: sanitized.stopConfig.timeout,
            drainConnections: sanitized.stopConfig.drainConnections,
            saveState: sanitized.stopConfig.saveState,
            backupBeforeStop: sanitized.stopConfig.backupBeforeStop,
            stopReason: sanitized.stopConfig.stopReason,
            projectPath: sanitized.stopConfig.projectPath?.length > 100 
                ? `${sanitized.stopConfig.projectPath.substring(0, 100)}...` 
                : sanitized.stopConfig.projectPath
        };
    }
    
    return sanitized;
}

/**
 * Stocke entrée de log
 */
async function storeLogEntry(logEntry, options) {
    // Simulation stockage - sera remplacé par vrai système
    const logFile = options.logFile || '/tmp/buzzcraft-stop-workflow.log';
    
    // Simulation écriture fichier
    const logLine = `[${logEntry.timestamp}] ${logEntry.level} ${logEntry.message}\n`;
    
    try {
        // TODO: Remplacer par vraie écriture fichier
        if (options.verbose) {
            console.debug(`LOG: ${logLine.trim()}`);
        }
        
        return { stored: true, location: logFile };
    } catch (error) {
        console.warn(`Erreur stockage log: ${error.message}`);
        return { stored: false, error: error.message };
    }
}

export default logStopWorkflow;

/*
 * DEPENDENCY FLOW: engines/stop/logging → independent (aucune dépendance BuzzCraft)
 * ARCHITECTURE: Module logging autonome pour workflow arrêt
 * PATTERN: logXXXWorkflow() cohérent avec style BuzzCraft
 */

/**
 * Enhanced Logger - Format unifié Node ↔ Console Dashboard
 * @description Système de logs standardisé avec correlation tracking
 */

/**
 * Génère un ID de workflow unique
 * @returns {string} Workflow ID au format wf_timestamp_random
 */
export function generateWorkflowId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `wf_${timestamp}_${random}`;
}

/**
 * Log enrichi avec metadata pour correlation Dashboard ↔ Node
 * @param {string} module - Module name (ROUTES, BUILD, DEPLOY, etc.)
 * @param {number} callNumber - CALL number (0-13) 
 * @param {string} action - Action description
 * @param {string} status - Status (SUCCESS/FAILED/STARTED)
 * @param {object} metadata - Additional data
 */
export function logCall(module, callNumber, action, status, metadata = {}) {
  const timestamp = new Date().toISOString();
  const workflowId = metadata.workflowId || 'unknown';
  const duration = metadata.duration ? ` | Duration: ${metadata.duration}ms` : '';
  const project = metadata.projectId ? ` | Project: ${metadata.projectId}` : '';
  const extra = metadata.extra ? ` | ${metadata.extra}` : '';
  
  const logMessage = `[${module}] CALL ${callNumber}: ${action} - ${status} | Workflow: ${workflowId}${project}${duration}${extra}`;
  console.log(logMessage);
  
  // Retourner le message formaté pour potentiel broadcast
  return {
    timestamp,
    module,
    callNumber,
    action,
    status,
    workflowId,
    message: logMessage,
    metadata
  };
}

/**
 * Log de workflow complet avec timing
 * @param {string} action - Workflow action (CREATE, BUILD, DEPLOY, etc.)
 * @param {string} status - SUCCESS/FAILED/STARTED
 * @param {object} metadata - Metadata (projectId, workflowId, duration, etc.)
 */
export function logWorkflow(action, status, metadata = {}) {
  const workflowId = metadata.workflowId || 'unknown';
  const duration = metadata.duration ? ` | Duration: ${metadata.duration}ms` : '';
  const project = metadata.projectId ? ` | Project: ${metadata.projectId}` : '';
  const error = metadata.error ? ` | Error: ${metadata.error}` : '';
  
  const logMessage = `[WORKFLOW] ${action} ${status}${project} | Workflow: ${workflowId}${duration}${error}`;
  console.log(logMessage);
  
  return {
    timestamp: new Date().toISOString(),
    action,
    status,
    workflowId,
    message: logMessage,
    metadata
  };
}

/**
 * Log d'erreur standardisé
 * @param {string} module - Module qui génère l'erreur
 * @param {string} error - Message d'erreur
 * @param {object} context - Contexte de l'erreur
 */
export function logError(module, error, context = {}) {
  const workflowId = context.workflowId || 'unknown';
  const project = context.projectId ? ` | Project: ${context.projectId}` : '';
  const call = context.callNumber ? ` | Call: ${context.callNumber}` : '';
  
  const logMessage = `[${module}] ERROR: ${error} | Workflow: ${workflowId}${project}${call}`;
  console.error(logMessage);
  
  return {
    timestamp: new Date().toISOString(),
    module,
    error,
    workflowId,
    message: logMessage,
    context
  };
}

console.log('[ENHANCED-LOGGER] Enhanced logger utility loaded');

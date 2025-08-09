/*
 * [MOCK] FAIT QUOI : Process toutes les données parsées en données système
 * REÇOIT : requestData: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si requestData manquant
 */

export async function process(requestData) {
  console.log(`[MOCK] request processor called for action: ${requestData.action}`);
  
  if (!requestData) {
    throw new Error('ValidationError: requestData required');
  }
  
  const { action, projectId, config } = requestData;
  
  // Base data for all actions
  const processedData = {
    action,
    projectId,
    projectPath: `./app-server/outputs/projects/${projectId}`,
  };
  
  // Action-specific processing
  switch (action) {
    case 'CREATE':
      processedData.config = {
        ...config,
        name: config.name || projectId,
        template: config.template || 'basic'
      };
      break;
      
    case 'BUILD':
    case 'DEPLOY':
    case 'START':
    case 'STOP':
    case 'DELETE':
      processedData.config = config || {};
      break;
      
    case 'UPDATE':
      processedData.config = {
        ...config,
        version: config.version || '1.1.0'
      };
      break;
      
    default:
      return {
        success: false,
        error: `Unknown action: ${action}`
      };
  }
  
  return {
    success: true,
    data: processedData
  };
}
/*
 * [MOCK] FAIT QUOI : Process toutes les données parsées en données utilisateur finales
 * REÇOIT : responseData: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si responseData manquant
 */

export async function process(responseData) {
  console.log(`[MOCK] response processor called for action: ${responseData.data?.action}`);
  
  if (!responseData) {
    throw new Error('ValidationError: responseData required');
  }
  
  if (!responseData.success) {
    return {
      success: false,
      error: responseData.error
    };
  }
  
  const { action, message, project } = responseData.data;
  
  // Base response structure
  const processedResponse = {
    message,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
  
  // Action-specific response formatting
  switch (action) {
    case 'CREATE':
      processedResponse.project = project;
      break;
      
    case 'BUILD':
      processedResponse.build = {
        fromState: project.fromState,
        toState: project.toState,
        servicesGenerated: responseData.data.servicesGenerated || 4,
        duration: project.duration
      };
      break;
      
    case 'DEPLOY':
      processedResponse.deploy = {
        fromState: project.fromState,
        toState: project.toState,
        duration: project.duration
      };
      break;
      
    case 'START':
      processedResponse.start = {
        fromState: project.fromState,
        toState: project.toState,
        duration: project.duration
      };
      break;
      
    case 'STOP':
      processedResponse.stop = {
        fromState: project.fromState,
        toState: project.toState,
        duration: project.duration
      };
      break;
      
    case 'DELETE':
      processedResponse.delete = {
        fromState: project.fromState,
        toState: project.toState,
        duration: project.duration
      };
      break;
      
    case 'UPDATE':
      processedResponse.update = {
        fromState: project.fromState,
        toState: project.toState,
        duration: project.duration
      };
      break;
      
    default:
      processedResponse.result = project;
  }
  
  return {
    success: true,
    data: processedResponse
  };
}
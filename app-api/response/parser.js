/*
 * [MOCK] FAIT QUOI : Parse tous les résultats de workflow en réponse HTTP
 * REÇOIT : workflowResult: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si workflowResult manquant
 */

export async function response(workflowResult) {
  console.log(`[MOCK] response parser called`);
  
  if (!workflowResult) {
    throw new Error('ValidationError: workflowResult required');
  }
  
  if (!workflowResult.success) {
    return {
      success: false,
      error: workflowResult.error
    };
  }
  
  const { projectId, fromState, toState, duration } = workflowResult.data;
  
  // Determine action from states transition
  let action = 'UNKNOWN';
  if (fromState === 'VOID' && toState === 'DRAFT') action = 'CREATE';
  else if (fromState === 'DRAFT' && toState === 'BUILT') action = 'BUILD';
  else if (fromState === 'BUILT' && toState === 'OFFLINE') action = 'DEPLOY';
  else if (fromState === 'OFFLINE' && toState === 'ONLINE') action = 'START';
  else if (fromState === 'ONLINE' && toState === 'OFFLINE') action = 'STOP';
  else if (toState === 'VOID') action = 'DELETE';
  else if (fromState === toState) action = 'UPDATE';
  
  // Generate appropriate message
  const messages = {
    CREATE: `Project ${projectId} created successfully`,
    BUILD: `Project ${projectId} built successfully`,
    DEPLOY: `Project ${projectId} deployed successfully`,
    START: `Project ${projectId} started successfully`,
    STOP: `Project ${projectId} stopped successfully`,
    DELETE: `Project ${projectId} deleted successfully`,
    UPDATE: `Project ${projectId} updated successfully`
  };
  
  return {
    success: true,
    data: {
      message: messages[action] || `Project ${projectId} processed successfully`,
      project: {
        id: projectId,
        fromState,
        toState,
        duration
      },
      action,
      ...workflowResult.data
    }
  };
}
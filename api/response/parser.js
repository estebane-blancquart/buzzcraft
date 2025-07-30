/*
 * FAIT QUOI : Parse les résultats de workflow en réponse HTTP
 * REÇOIT : workflowResult: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si workflowResult manquant
 */

export async function createResponse(workflowResult) {
  if (!workflowResult) {
    throw new Error('ValidationError: workflowResult required');
  }
  
  if (!workflowResult.success) {
    return {
      success: false,
      error: workflowResult.error
    };
  }
  
  return {
    success: true,
    data: {
      message: `Project ${workflowResult.data.projectId} created successfully`,
      project: {
        id: workflowResult.data.projectId,
        fromState: workflowResult.data.fromState,
        toState: workflowResult.data.toState,
        duration: workflowResult.data.duration
      }
    }
  };
}
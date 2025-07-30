/*
 * FAIT QUOI : Parse les requêtes HTTP pour workflow CREATE
 * REÇOIT : req: Request (Express)
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si données manquantes
 */

export async function createRequest(req) {
  if (!req.body) {
    throw new Error('ValidationError: request body required');
  }
  
  const { projectId, config = {} } = req.body;
  
  if (!projectId || typeof projectId !== 'string') {
    return {
      success: false,
      error: 'projectId must be non-empty string'
    };
  }
  
  return {
    success: true,
    data: {
      projectId,
      config
    }
  };
}
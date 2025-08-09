/*
 * [MOCK] FAIT QUOI : Orchestre workflow DEPLOY (BUILT → OFFLINE)
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function deployWorkflow(projectId, config = {}) {
  console.log(`[MOCK] deployWorkflow called for project: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }

  return {
    success: true,
    data: {
      projectId,
      fromState: 'BUILT',
      toState: 'OFFLINE',
      duration: Math.floor(Math.random() * 80) + 20
    }
  };
}
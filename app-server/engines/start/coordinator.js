/*
 * [MOCK] FAIT QUOI : Orchestre workflow START (OFFLINE → ONLINE)
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function startWorkflow(projectId, config = {}) {
  console.log(`[MOCK] startWorkflow called for project: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }

  return {
    success: true,
    data: {
      projectId,
      fromState: 'OFFLINE',
      toState: 'ONLINE',
      duration: Math.floor(Math.random() * 30) + 10
    }
  };
}
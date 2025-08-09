/*
 * [MOCK] FAIT QUOI : Orchestre workflow UPDATE (OFFLINE/ONLINE → OFFLINE/ONLINE)
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function updateWorkflow(projectId, config = {}) {
  console.log(`[MOCK] updateWorkflow called for project: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }

  return {
    success: true,
    data: {
      projectId,
      fromState: 'OFFLINE',
      toState: 'OFFLINE',
      duration: Math.floor(Math.random() * 60) + 15
    }
  };
}
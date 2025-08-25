/*
 * [MOCK] FAIT QUOI : Orchestre workflow STOP (ONLINE → OFFLINE)
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function stopWorkflow(projectId, config = {}) {
  console.log(`[MOCK] stopWorkflow called for project: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }

  return {
    success: true,
    data: {
      projectId,
      fromState: 'ONLINE',
      toState: 'OFFLINE',
      duration: Math.floor(Math.random() * 20) + 5
    }
  };
}
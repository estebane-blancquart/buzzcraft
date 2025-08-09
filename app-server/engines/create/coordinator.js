/*
 * [MOCK] FAIT QUOI : Orchestre workflow CREATE (VOID → DRAFT)
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function createWorkflow(projectId, config = {}) {
  console.log(`[MOCK] createWorkflow called for project: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }

  return {
    success: true,
    data: {
      projectId,
      fromState: 'VOID',
      toState: 'DRAFT',
      duration: Math.floor(Math.random() * 50) + 5
    }
  };
}
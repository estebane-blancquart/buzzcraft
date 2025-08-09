/*
 * [MOCK] FAIT QUOI : Orchestre workflow DELETE (ANY → VOID)
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function deleteWorkflow(projectId, config = {}) {
  console.log(`[MOCK] deleteWorkflow called for project: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }

  return {
    success: true,
    data: {
      projectId,
      fromState: 'ANY',
      toState: 'VOID',
      duration: Math.floor(Math.random() * 40) + 10
    }
  };
}
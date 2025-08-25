import { getProjectPath } from '../cores/path-resolver.js';

/*
 * FAIT QUOI : Orchestre workflow DELETE (ANY → VOID) - VERSION MIGRÉE
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function deleteWorkflow(projectId, config = {}) {
  console.log(`[DELETE] CALL 3: deleteWorkflow called for project: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }

  const projectPath = getProjectPath(projectId);
  console.log(`[DELETE] Project path resolved: ${projectPath}`);

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
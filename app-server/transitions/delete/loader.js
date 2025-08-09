/*
 * [MOCK] FAIT QUOI : Charge ressources nécessaires pour DELETE
 * REÇOIT : resourceId: string, options: object
 * RETOURNE : { loaded: boolean, data: object, dependencies: string[], metadata: object }
 * ERREURS : LoadError, DependencyError, ResourceError
 */

export async function loadProjectFiles(projectId, options = {}) {
  console.log(`[MOCK] loadProjectFiles called with: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('LoadError: projectId must be non-empty string');
  }
  
  return {
    loaded: true,
    data: { 
      projectId,
      files: '[MOCK] project files to delete'
    },
    dependencies: [],
    metadata: {}
  };
}
/*
 * [MOCK] FAIT QUOI : Charge ressources nécessaires pour UPDATE
 * REÇOIT : resourceId: string, options: object
 * RETOURNE : { loaded: boolean, data: object, dependencies: string[], metadata: object }
 * ERREURS : LoadError, DependencyError, ResourceError
 */

export async function loadCurrentVersion(projectId, options = {}) {
  console.log(`[MOCK] loadCurrentVersion called with: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('LoadError: projectId must be non-empty string');
  }
  
  return {
    loaded: true,
    data: { 
      projectId,
      currentVersion: '[MOCK] current version'
    },
    dependencies: [],
    metadata: {}
  };
}
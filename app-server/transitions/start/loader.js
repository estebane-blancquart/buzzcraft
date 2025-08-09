/*
 * [MOCK] FAIT QUOI : Charge ressources nécessaires pour START
 * REÇOIT : resourceId: string, options: object
 * RETOURNE : { loaded: boolean, data: object, dependencies: string[], metadata: object }
 * ERREURS : LoadError, DependencyError, ResourceError
 */

export async function loadContainerStatus(projectId, options = {}) {
  console.log(`[MOCK] loadContainerStatus called with: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('LoadError: projectId must be non-empty string');
  }
  
  return {
    loaded: true,
    data: { 
      projectId,
      status: '[MOCK] container status'
    },
    dependencies: [],
    metadata: {}
  };
}
/*
 * [MOCK] FAIT QUOI : Charge ressources nécessaires pour STOP
 * REÇOIT : resourceId: string, options: object
 * RETOURNE : { loaded: boolean, data: object, dependencies: string[], metadata: object }
 * ERREURS : LoadError, DependencyError, ResourceError
 */

export async function loadRunningContainers(projectId, options = {}) {
  console.log(`[MOCK] loadRunningContainers called with: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('LoadError: projectId must be non-empty string');
  }
  
  return {
    loaded: true,
    data: { 
      projectId,
      containers: '[MOCK] running containers'
    },
    dependencies: [],
    metadata: {}
  };
}
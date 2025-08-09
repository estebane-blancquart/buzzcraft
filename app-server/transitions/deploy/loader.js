/*
 * [MOCK] FAIT QUOI : Charge ressources nécessaires pour DEPLOY
 * REÇOIT : resourceId: string, options: object
 * RETOURNE : { loaded: boolean, data: object, dependencies: string[], metadata: object }
 * ERREURS : LoadError, DependencyError, ResourceError
 */

export async function loadContainerConfig(projectId, options = {}) {
  console.log(`[MOCK] loadContainerConfig called with: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('LoadError: projectId must be non-empty string');
  }
  
  return {
    loaded: true,
    data: { 
      projectId,
      config: '[MOCK] docker config'
    },
    dependencies: [],
    metadata: {}
  };
}
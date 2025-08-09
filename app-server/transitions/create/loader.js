/*
 * [MOCK] FAIT QUOI : Charge ressources nécessaires pour CREATE
 * REÇOIT : resourceId: string, options: object
 * RETOURNE : { loaded: boolean, data: object, dependencies: string[], metadata: object }
 * ERREURS : LoadError, DependencyError, ResourceError
 */

export async function loadTemplate(templateId, options = {}) {
  console.log(`[MOCK] loadTemplate called with: ${templateId}`);
  
  if (!templateId || typeof templateId !== 'string') {
    throw new Error('LoadError: templateId must be non-empty string');
  }
  
  return {
    loaded: true,
    data: { 
      templateId,
      content: '[MOCK] template content'
    },
    dependencies: [],
    metadata: {}
  };
}
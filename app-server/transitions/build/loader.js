/*
 * [MOCK] FAIT QUOI : Charge ressources nécessaires pour BUILD
 * REÇOIT : resourceId: string, options: object
 * RETOURNE : { loaded: boolean, data: object, dependencies: string[], metadata: object }
 * ERREURS : LoadError, DependencyError, ResourceError
 */

export async function loadTemplates(templateId, options = {}) {
  console.log(`[MOCK] loadTemplates called with: ${templateId}`);
  
  if (!templateId || typeof templateId !== 'string') {
    throw new Error('LoadError: templateId must be non-empty string');
  }
  
  return {
    loaded: true,
    data: { 
      templateId,
      templates: '[MOCK] handlebars templates'
    },
    dependencies: [],
    metadata: {}
  };
}
/*
 * FAIT QUOI : Génère les données d'un nouveau projet avec TOUTE la structure template
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 * ERREURS : GenerationError si paramètres invalides
 */

export async function generateProject(projectId, config, options = {}) {
  console.log(`[STEP3] generateProject called for: ${projectId}`);
  
  if (!projectId || !config) {
    throw new Error('GenerationError: projectId and config required');
  }
  
  // Récupérer les données du template si disponibles
  const templateData = options.template?.content || {};
  
  // GÉNÉRATION DONNÉES PROJET COMPLÈTE
  let projectData;
  
  if (templateData.project) {
    // Si on a un template complet, on l'utilise et on enrichit
    projectData = {
      ...templateData.project,
      id: projectId,
      name: config.name || projectId,
      template: config.template || 'basic',
      templateName: templateData.name || 'Unknown Template',
      templateDescription: templateData.description || 'No description',
      created: new Date().toISOString(),
      state: 'DRAFT'
    };
  } else {
    // Fallback : génération basique comme avant
    projectData = {
      id: projectId,
      name: config.name || projectId,
      template: config.template || 'basic',
      templateName: templateData.name || 'Unknown Template',
      templateDescription: templateData.description || 'No description',
      created: new Date().toISOString(),
      state: 'DRAFT'
    };
  }
  
  console.log(`[STEP3] Generated project with pages:`, !!projectData.pages);
  
  return {
    generated: true,
    output: projectData,
    artifacts: ['project.json'],
    metadata: {
      generatedAt: new Date().toISOString(),
      templateUsed: projectData.template,
      templateLoaded: !!templateData.name,
      hasPages: !!projectData.pages
    }
  };
}
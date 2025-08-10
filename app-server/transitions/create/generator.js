/*
 * FAIT QUOI : Génère les données d'un nouveau projet
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
  
  // GÉNÉRATION DONNÉES PROJET (enrichies par template)
  const projectData = {
    id: projectId,
    name: config.name || projectId,
    template: config.template || 'basic',
    templateName: templateData.name || 'Unknown Template',
    templateDescription: templateData.description || 'No description',
    created: new Date().toISOString(),
    state: 'DRAFT'
  };
  
  return {
    generated: true,
    output: projectData,
    artifacts: ['project.json'],
    metadata: {
      generatedAt: new Date().toISOString(),
      templateUsed: projectData.template,
      templateLoaded: !!templateData.name
    }
  };
}
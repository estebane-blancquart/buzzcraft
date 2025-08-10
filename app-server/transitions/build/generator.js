import Handlebars from 'handlebars';

/*
 * FAIT QUOI : Génère services TypeScript depuis templates Handlebars
 * REÇOIT : projectData: object, templatesData: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 * ERREURS : GenerationError si compilation Handlebars échoue
 */

export async function generateServices(projectData, templatesData, options = {}) {
  console.log(`[STEP] generateServices called for: ${projectData?.id}`);
  
  if (!projectData || !templatesData) {
    throw new Error('GenerationError: projectData and templatesData required');
  }
  
  try {
    const services = {};
    const artifacts = [];
    
    // Variables disponibles pour les templates
    const templateVariables = {
      project: {
        id: projectData.id,
        name: projectData.name,
        template: projectData.template
      }
    };
    
    // Compiler chaque template
    for (const [templatePath, templateContent] of Object.entries(templatesData.templates)) {
      console.log(`[STEP] Compiling template: ${templatePath}`);
      
      // Compiler le template Handlebars
      const template = Handlebars.compile(templateContent);
      
      // Générer le contenu avec les variables
      const compiledContent = template(templateVariables);
      
      // Déterminer le chemin de sortie (enlever .hbs)
      const outputPath = templatePath.replace('.hbs', '');
      
      // Stocker le résultat
      services[outputPath] = compiledContent;
      artifacts.push(outputPath);
    }
    
    return {
      generated: true,
      output: {
        projectId: projectData.id,
        services
      },
      artifacts,
      metadata: {
        generatedAt: new Date().toISOString(),
        templatesCompiled: artifacts.length,
        templateVariables
      }
    };
    
  } catch (error) {
    throw new Error(`GenerationError: Failed to compile templates - ${error.message}`);
  }
}
import { readPath } from '../../systems/reader.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/*
 * FAIT QUOI : Charge templates Handlebars pour génération de services
 * REÇOIT : projectId: string, options: object
 * RETOURNE : { loaded: boolean, data: object, dependencies: string[], metadata: object }
 * ERREURS : LoadError si templates introuvables
 */

export async function loadCodeTemplates(projectId, options = {}) {
  console.log(`[STEP] loadCodeTemplates called with: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('LoadError: projectId must be non-empty string');
  }
  
  try {
    // Chemin absolu depuis ce fichier
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const templatesBasePath = join(__dirname, '../../inputs/templates/code');
    
    const templates = {};
    const templatePaths = [
      'app-visitor/package.json.hbs',
      'server/package.json.hbs'
    ];
    
    // Charger chaque template
    for (const templatePath of templatePaths) {
      const fullPath = join(templatesBasePath, templatePath);
      const templateFile = await readPath(fullPath);
      
      if (!templateFile.success) {
        throw new Error(`Failed to read template: ${templateFile.error}`);
      }
      
      if (!templateFile.data.exists) {
        throw new Error(`Template ${templatePath} does not exist at ${fullPath}`);
      }
      
      // Stocker le contenu du template
      templates[templatePath] = templateFile.data.content;
    }
    
    return {
      loaded: true,
      data: { 
        projectId,
        templates,
        templatesBasePath
      },
      dependencies: templatePaths,
      metadata: {
        loadedAt: new Date().toISOString(),
        templatesCount: Object.keys(templates).length,
        templatesBasePath
      }
    };
    
  } catch (error) {
    return {
      loaded: false,
      error: error.message
    };
  }
}
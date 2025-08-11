import { readPath } from '../../systems/reader.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/*
 * FAIT QUOI : Charge templates Handlebars pour génération de services + components
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
    
    // Templates existants (services)
    const serviceTemplates = [
      'app-visitor/package.json.hbs',
      'server/package.json.hbs'
    ];
    
    // Templates components (nouveaux)
    const componentTemplates = [
      'app-visitor/components/Button.tsx.hbs',
      'app-visitor/components/Heading.tsx.hbs',
      'app-visitor/components/Image.tsx.hbs',
      'app-visitor/components/Link.tsx.hbs',
      'app-visitor/components/Paragraph.tsx.hbs',
      'app-visitor/components/Video.tsx.hbs'
    ];
    
    // Tous les templates à charger
    const allTemplates = [...serviceTemplates, ...componentTemplates];
    
    // Charger chaque template
    for (const templatePath of allTemplates) {
      const fullPath = join(templatesBasePath, templatePath);
      const templateFile = await readPath(fullPath);
      
      if (!templateFile.success) {
        console.log(`[WARNING] Template not found: ${templatePath}`);
        continue; // Skip si pas trouvé (pour l'instant)
      }
      
      if (!templateFile.data.exists) {
        console.log(`[WARNING] Template ${templatePath} does not exist at ${fullPath}`);
        continue; // Skip si pas trouvé
      }
      
      // Stocker le contenu du template
      templates[templatePath] = templateFile.data.content;
      console.log(`[STEP] Loaded template: ${templatePath}`);
    }
    
    return {
      loaded: true,
      data: { 
        projectId,
        templates,
        templatesBasePath
      },
      dependencies: allTemplates,
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
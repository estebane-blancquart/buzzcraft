import { readPath } from '../../systems/reader.js';
import { readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/*
 * FAIT QUOI : Découverte automatique et chargement de tous les templates Handlebars
 * REÇOIT : projectId: string, options: object
 * RETOURNE : { loaded: boolean, data: object, dependencies: string[], metadata: object }
 * ERREURS : LoadError si templates directory inaccessible
 */

export async function loadCodeTemplates(projectId, options = {}) {
  console.log(`[TEMPLATE] loadCodeTemplates called with: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('LoadError: projectId must be non-empty string');
  }
  
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const templatesBasePath = join(__dirname, '../../inputs/templates/code');
    
    const templates = {};
    const dependencies = [];
    
    // Auto-découverte récursive des templates .hbs
    async function discoverTemplates(currentPath, relativePath = '') {
      try {
        const items = await readdir(currentPath, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = join(currentPath, item.name);
          const relativeItemPath = relativePath ? join(relativePath, item.name) : item.name;
          
          if (item.isDirectory()) {
            // Récursion dans les sous-dossiers
            await discoverTemplates(fullPath, relativeItemPath);
          } else if (item.isFile() && item.name.endsWith('.hbs')) {
            // Template trouvé !
            console.log(`[TEMPLATE] Discovered: ${relativeItemPath}`);
            
            const templateFile = await readPath(fullPath);
            
            if (templateFile.success && templateFile.data.exists) {
              templates[relativeItemPath] = templateFile.data.content;
              dependencies.push(relativeItemPath);
            } else {
              console.log(`[WARNING] Failed to read template: ${relativeItemPath}`);
            }
          }
        }
      } catch (error) {
        console.log(`[WARNING] Cannot access directory: ${currentPath} - ${error.message}`);
      }
    }
    
    // Découvrir tous les templates
    await discoverTemplates(templatesBasePath);
    
    console.log(`[TEMPLATE] Auto-discovered ${Object.keys(templates).length} templates`);
    
    return {
      loaded: true,
      data: { 
        projectId,
        templates,
        templatesBasePath
      },
      dependencies,
      metadata: {
        loadedAt: new Date().toISOString(),
        templatesCount: Object.keys(templates).length,
        templatesBasePath,
        autoDiscovered: true
      }
    };
    
  } catch (error) {
    return {
      loaded: false,
      error: error.message
    };
  }
}

/*
 * FAIT QUOI : Découverte des templates de structure disponibles
 * REÇOIT : options: object
 * RETOURNE : { loaded: boolean, data: object }
 * ERREURS : LoadError si structure templates inaccessibles
 */

export async function discoverAvailableTemplates(options = {}) {
  console.log(`[TEMPLATE] Discovering available project templates`);
  
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const structureBasePath = join(__dirname, '../../inputs/templates/structure/projects');
    
    const availableTemplates = [];
    
    const items = await readdir(structureBasePath, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isFile() && item.name.endsWith('.json')) {
        const templateId = item.name.replace('.json', '');
        const templatePath = join(structureBasePath, item.name);
        
        try {
          const templateFile = await readPath(templatePath);
          if (templateFile.success && templateFile.data.exists) {
            const templateData = JSON.parse(templateFile.data.content);
            
            availableTemplates.push({
              id: templateId,
              name: templateData.project?.name || templateId,
              description: templateData.project?.description || 'No description',
              path: templatePath
            });
            
            console.log(`[TEMPLATE] Found template: ${templateId}`);
          }
        } catch (error) {
          console.log(`[WARNING] Invalid template ${templateId}: ${error.message}`);
        }
      }
    }
    
    return {
      loaded: true,
      data: {
        templates: availableTemplates,
        count: availableTemplates.length
      },
      dependencies: availableTemplates.map(t => t.path),
      metadata: {
        discoveredAt: new Date().toISOString(),
        basePath: structureBasePath
      }
    };
    
  } catch (error) {
    return {
      loaded: false,
      error: error.message
    };
  }
}
import { readPath } from '../../systems/reader.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/*
 * FAIT QUOI : Charge template de projet depuis inputs/templates/structure/projects/
 * REÇOIT : templateId: string, options: object
 * RETOURNE : { loaded: boolean, data: object, dependencies: string[], metadata: object }
 * ERREURS : LoadError si template introuvable
 */

export async function loadTemplate(templateId, options = {}) {
  console.log(`[STEP4] loadTemplate called with: ${templateId}`);
  
  if (!templateId || typeof templateId !== 'string') {
    throw new Error('LoadError: templateId must be non-empty string');
  }
  
  try {
    // Chemin absolu depuis ce fichier
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const templatePath = join(__dirname, '../../inputs/templates/structure/projects', `${templateId}.json`);
    
    // Lire le fichier template avec reader.js
    const templateFile = await readPath(templatePath);
    
    if (!templateFile.success) {
      throw new Error(`Failed to read template: ${templateFile.error}`);
    }
    
    if (!templateFile.data.exists) {
      throw new Error(`Template ${templateId} does not exist at ${templatePath}`);
    }
    
    // Parser le JSON
    let templateContent;
    try {
      templateContent = JSON.parse(templateFile.data.content);
    } catch (parseError) {
      throw new Error(`Invalid JSON in template ${templateId}: ${parseError.message}`);
    }
    
    return {
      loaded: true,
      data: { 
        templateId,
        templatePath,
        content: templateContent
      },
      dependencies: [],
      metadata: {
        loadedAt: new Date().toISOString(),
        templatePath,
        fileSize: templateFile.data.content.length
      }
    };
    
  } catch (error) {
    return {
      loaded: false,
      error: error.message
    };
  }
}
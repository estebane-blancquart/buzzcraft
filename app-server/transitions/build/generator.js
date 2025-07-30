import { readPath } from '../../systems/reader.js';
import Handlebars from 'handlebars';

/*
 * FAIT QUOI : Génère les 4 services TypeScript depuis templates
 * REÇOIT : projectData: object, templateData: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si données manquantes
 */

export async function generateServices(projectData, templateData) {
  if (!projectData || !templateData) {
    throw new Error('ValidationError: projectData and templateData required');
  }
  
  try {
    const services = {};
    
    // Générer app-visitor
    const textTemplate = await readPath('./app-server/inputs/templates/code/app-visitor/src/components/Text.tsx.hbs');
    const buttonTemplate = await readPath('./app-server/inputs/templates/code/app-visitor/src/components/Button.tsx.hbs');
    
    if (!textTemplate.success || !buttonTemplate.success) {
      return {
        success: false,
        error: 'Template files not found'
      };
    }
    
    // Compiler templates avec données projet
    const textCompiled = Handlebars.compile(textTemplate.data.content);
    const buttonCompiled = Handlebars.compile(buttonTemplate.data.content);
    
    // Variables pour compilation
    const context = {
      project: projectData,
      content: {
        content: "Welcome to " + projectData.name
      },
      styleOptions: {
        size: "xl",
        color: "white",
        bg: "blue-600"
      }
    };
    
    services['app-visitor'] = {
      'src/components/Text.tsx': textCompiled(context),
      'src/components/Button.tsx': buttonCompiled(context),
      'package.json': JSON.stringify({
        name: `${projectData.id}-visitor`,
        version: "1.0.0",
        type: "module",
        dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0"
        }
      }, null, 2)
    };
    
    return {
      success: true,
      data: { services }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
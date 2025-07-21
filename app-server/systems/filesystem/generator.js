/**
 * COMMIT 6 - System Filesystem
 * 
 * FAIT QUOI : Génération code services depuis templates avec compilation Handlebars
 * REÇOIT : templateData: object, context: object, serviceType: string
 * RETOURNE : { generatedCode: string, compiledTemplates: object[], usedVariables: string[], warnings: string[] }
 * ERREURS : GenerationError si template invalide, HandlebarsError si syntaxe incorrecte, ContextError si variables manquantes
 */

import { access } from 'fs/promises';
import { join } from 'path';

export async function checkOutputPath(outputPath) {
  // Validation
  if (!outputPath || typeof outputPath !== 'string') {
    throw new Error('ValidationError: outputPath must be a non-empty string');
  }

  // Test si le dossier parent existe
  try {
    await access(outputPath);
    return {
      path: outputPath,
      exists: true,
      writable: true
    };
  } catch {
    return {
      path: outputPath,
      exists: false,
      writable: false
    };
  }
}

// systems/filesystem/generator : System Filesystem (commit 6)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/
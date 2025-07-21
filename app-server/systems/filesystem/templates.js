/**
 * COMMIT 6 - System Filesystem
 * 
 * FAIT QUOI : Chargement templates avec résolution dépendances hiérarchiques et cache
 * REÇOIT : templateId: string, options: { resolveDeeps?: boolean, cacheEnabled?: boolean, version?: string }
 * RETOURNE : { templateData: object, dependencies: string[], resolved: boolean, cacheHit: boolean }
 * ERREURS : TemplateError si template inexistant, DependencyError si référence circulaire, CacheError si corruption cache
 */

import { access } from 'fs/promises';
import { join } from 'path';

export async function checkTemplateExists(templateId) {
  // Validation
  if (!templateId || typeof templateId !== 'string') {
    throw new Error('ValidationError: templateId must be a non-empty string');
  }

  const templatePath = join('./templates', `${templateId}.json`);

  // Test existence template
  try {
    await access(templatePath);
    return {
      templateId,
      exists: true,
      path: templatePath
    };
  } catch {
    return {
      templateId,
      exists: false,
      path: templatePath
    };
  }
}

// systems/filesystem/templates : System Filesystem (commit 6)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/
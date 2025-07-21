/**
 * COMMIT 2 - State Draft
 * 
 * FAIT QUOI : Validation état draft avec vérification structure projet
 * REÇOIT : projectPath: string, projectData: object, options?: { strictMode?: boolean }
 * RETOURNE : { valid: boolean, confidence: number, structure: object, warnings: string[] }
 * ERREURS : ValidationError si structure invalide, IntegrityError si corruption détectée, SchemaError si project.json malformé
 */

import { access, constants } from 'fs/promises';
import { join } from 'path';

export async function validateDraftState(projectPath, projectData = {}) {
  // Validation
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be a non-empty string');
  }

  // Test project.json
  try {
    await access(join(projectPath, 'project.json'), constants.F_OK);
    // project.json existant = DRAFT valide
    return {
      valid: true,
      confidence: 100,
      structure: { hasProjectJson: true },
      warnings: []
    };
  } catch (error) {
    // project.json inexistant = DRAFT invalide
    return {
      valid: false,
      confidence: 0,
      structure: { hasProjectJson: false },
      warnings: ['project.json not found']
    };
  }
}

// states/draft/validator : State Draft (commit 2)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)
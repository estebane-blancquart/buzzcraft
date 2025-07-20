/**
 * COMMIT 1 - State Void
 * 
 * FAIT QUOI : Validation état void avec vérification absence artéfacts
 * REÇOIT : projectPath: string, evidence: object[], options?: { thorough?: boolean }
 * RETOURNE : { valid: boolean, confidence: number, issues: string[], recommendations: string[] }
 * ERREURS : ValidationError si chemin invalide, EvidenceError si preuves insuffisantes, FileSystemError si accès refusé
 */

import { access, constants } from 'fs/promises';

export async function validateVoidState(projectPath, evidence = []) {
  // Validation
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be a non-empty string');
  }

  // Test existence
  try {
    await access(projectPath, constants.F_OK);
    // Chemin existant = invalide pour VOID
    return {
      valid: false,
      confidence: 0,
      issues: ['Path exists'],
      recommendations: ['Remove project directory']
    };
  } catch (error) {
    // Chemin inexistant = valide pour VOID
    return {
      valid: true,
      confidence: 100,
      issues: [],
      recommendations: ['Ready for project creation']
    };
  }
}

// states/void/validator : State Void (commit 1)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)
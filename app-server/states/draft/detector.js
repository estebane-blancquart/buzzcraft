/**
 * COMMIT 2 - State Draft
 * 
 * FAIT QUOI : Détection état draft avec validation project.json
 * REÇOIT : projectPath: string, options?: { validateSchema?: boolean, checkIntegrity?: boolean }
 * RETOURNE : { state: 'DRAFT'|'CONTINUE', confidence: number, evidence: string[], projectData: object }
 * ERREURS : ValidationError si JSON invalide, SchemaError si structure incorrecte, FileSystemError si corruption
 */

// states/draft/detector : State Draft (commit 2)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)

// TODO: Implémentation du module
export default function StateDraft() {
    throw new Error('Module State Draft pas encore implémenté');
}

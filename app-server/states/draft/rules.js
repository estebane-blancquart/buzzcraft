/**
 * COMMIT 2 - State Draft
 * 
 * FAIT QUOI : Règles état draft définissant workflows d'édition
 * REÇOIT : currentState: string, operation: string, context?: object
 * RETOURNE : { allowed: boolean, operations: string[], safeguards: string[], requirements: string[] }
 * ERREURS : StateError si état incompatible, OperationError si opération interdite, SafeguardError si sécurité violée
 */

// states/draft/rules : State Draft (commit 2)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)

// TODO: Implémentation du module
export default function StateDraft() {
    throw new Error('Module State Draft pas encore implémenté');
}

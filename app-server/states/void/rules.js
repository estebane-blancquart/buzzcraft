/**
 * COMMIT 1 - State Void
 * 
 * FAIT QUOI : Règles état void définissant transitions autorisées
 * REÇOIT : currentState: string, targetState: string, context?: object
 * RETOURNE : { allowed: boolean, transitions: string[], restrictions: string[], reasons: string[] }
 * ERREURS : StateError si état invalide, TransitionError si transition interdite, RuleError si règle violée
 */

// states/void/rules : State Void (commit 1)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)

// TODO: Implémentation du module
export default function StateVoid() {
    throw new Error('Module State Void pas encore implémenté');
}

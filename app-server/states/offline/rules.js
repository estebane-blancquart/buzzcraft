/**
 * COMMIT 4 - State Offline
 * 
 * FAIT QUOI : Règles état offline définissant démarrage et arrêt services
 * REÇOIT : currentState: string, serviceOperation: string, context?: object
 * RETOURNE : { allowed: boolean, startOptions: string[], stopOptions: string[], dependencies: string[] }
 * ERREURS : StateError si service incompatible, DependencyError si dépendances manquantes, ServiceError si opération interdite
 */

// states/offline/rules : State Offline (commit 4)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)

// TODO: Implémentation du module
export default function StateOffline() {
    throw new Error('Module State Offline pas encore implémenté');
}

/**
 * COMMIT 3 - State Built
 * 
 * FAIT QUOI : Règles état built définissant déploiement et retour édition
 * REÇOIT : currentState: string, targetOperation: string, context?: object
 * RETOURNE : { allowed: boolean, deployOptions: string[], editOptions: string[], constraints: string[] }
 * ERREURS : StateError si transition invalide, DeploymentError si déploiement impossible, EditError si retour édition bloqué
 */

// states/built/rules : State Built (commit 3)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)

// TODO: Implémentation du module
export default function StateBuilt() {
    throw new Error('Module State Built pas encore implémenté');
}

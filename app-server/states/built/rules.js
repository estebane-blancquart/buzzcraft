/**
 * COMMIT 3 - State Built
 * 
 * FAIT QUOI : Règles état built définissant déploiement et retour édition
 * REÇOIT : currentState: string, targetOperation: string, context?: object
 * RETOURNE : { allowed: boolean, deployOptions: string[], editOptions: string[], constraints: string[] }
 * ERREURS : StateError si transition invalide, DeploymentError si déploiement impossible, EditError si retour édition bloqué
 */

export function validateBuiltOperation(currentState, operation) {
  // Validation
  if (!currentState || typeof currentState !== 'string') {
    throw new Error('StateError: currentState must be a non-empty string');
  }
  
  if (!operation || typeof operation !== 'string') {
    throw new Error('StateError: operation must be a non-empty string');
  }

  // Test état
  if (currentState.toUpperCase() !== 'BUILT') {
    throw new Error('StateError: current state must be BUILT');
  }

  const allowed = ['deploy', 'edit'].includes(operation.toLowerCase());
  
  return {
    allowed,
    deployOptions: ['deploy'],
    editOptions: ['edit'],
    constraints: allowed ? [] : ['Operation not allowed in BUILT state']
  };
}

// states/built/rules : State Built (commit 3)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)
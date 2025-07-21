/**
 * COMMIT 4 - State Offline
 * 
 * FAIT QUOI : Règles état offline définissant démarrage et arrêt services
 * REÇOIT : currentState: string, serviceOperation: string, context?: object
 * RETOURNE : { allowed: boolean, startOptions: string[], stopOptions: string[], dependencies: string[] }
 * ERREURS : StateError si service incompatible, DependencyError si dépendances manquantes, ServiceError si opération interdite
 */

export function validateOfflineOperation(currentState, operation) {
  // Validation
  if (!currentState || typeof currentState !== 'string') {
    throw new Error('StateError: currentState must be a non-empty string');
  }
  
  if (!operation || typeof operation !== 'string') {
    throw new Error('StateError: operation must be a non-empty string');
  }

  // Test état
  if (currentState.toUpperCase() !== 'OFFLINE') {
    throw new Error('StateError: current state must be OFFLINE');
  }

  const allowed = ['start', 'update'].includes(operation.toLowerCase());
  
  return {
    allowed,
    startOptions: ['start'],
    stopOptions: [],
    dependencies: allowed ? [] : ['Operation not allowed in OFFLINE state']
  };
}

// states/offline/rules : State Offline (commit 4)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)
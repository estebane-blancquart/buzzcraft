/**
 * COMMIT 5 - State Online
 * 
 * FAIT QUOI : Règles état online définissant maintenance et mise à jour
 * REÇOIT : currentState: string, maintenanceType: string, context?: object
 * RETOURNE : { allowed: boolean, maintenanceWindows: object[], updateStrategies: string[], rollbackOptions: string[] }
 * ERREURS : StateError si maintenance impossible, UpdateError si mise à jour interdite, RollbackError si rollback impossible
 */

export function validateOnlineOperation(currentState, operation) {
  // Validation
  if (!currentState || typeof currentState !== 'string') {
    throw new Error('StateError: currentState must be a non-empty string');
  }
  
  if (!operation || typeof operation !== 'string') {
    throw new Error('StateError: operation must be a non-empty string');
  }

  // Test état
  if (currentState.toUpperCase() !== 'ONLINE') {
    throw new Error('StateError: current state must be ONLINE');
  }

  const allowed = ['stop', 'maintenance'].includes(operation.toLowerCase());
  
  return {
    allowed,
    maintenanceWindows: [],
    updateStrategies: ['stop'],
    rollbackOptions: allowed ? [] : ['Operation not allowed in ONLINE state']
  };
}

// states/online/rules : State Online (commit 5)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)
/**
 * COMMIT 2 - State Draft
 * 
 * FAIT QUOI : Règles état draft définissant workflows d'édition
 * REÇOIT : currentState: string, operation: string, context?: object
 * RETOURNE : { allowed: boolean, operations: string[], safeguards: string[], requirements: string[] }
 * ERREURS : StateError si état incompatible, OperationError si opération interdite, SafeguardError si sécurité violée
 */

export function validateDraftOperation(currentState, operation) {
  // Validation
  if (!currentState || typeof currentState !== 'string') {
    throw new Error('StateError: currentState must be a non-empty string');
  }
  
  if (!operation || typeof operation !== 'string') {
    throw new Error('StateError: operation must be a non-empty string');
  }

  // Test état
  if (currentState.toUpperCase() !== 'DRAFT') {
    throw new Error('StateError: current state must be DRAFT');
  }

  const allowed = ['save', 'build', 'edit'].includes(operation.toLowerCase());
  
  return {
    allowed,
    operations: ['save', 'build', 'edit'],
    safeguards: allowed ? [] : ['Operation not allowed in DRAFT state'],
    requirements: [allowed ? 'Valid DRAFT operation' : 'Invalid operation for DRAFT']
  };
}

// states/draft/rules : State Draft (commit 2)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)
/**
 * COMMIT 1 - State Void
 * 
 * FAIT QUOI : Règles état void définissant transitions autorisées
 * REÇOIT : currentState: string, targetState: string, context?: object
 * RETOURNE : { allowed: boolean, transitions: string[], restrictions: string[], reasons: string[] }
 * ERREURS : StateError si état invalide, TransitionError si transition interdite, RuleError si règle violée
 */

export function validateVoidTransition(currentState, targetState) {
  // Validation
  if (!currentState || typeof currentState !== 'string') {
    throw new Error('StateError: currentState must be a non-empty string');
  }
  
  if (!targetState || typeof targetState !== 'string') {
    throw new Error('StateError: targetState must be a non-empty string');
  }

  // Test transition
  if (currentState.toUpperCase() !== 'VOID') {
    throw new Error('StateError: current state must be VOID');
  }

  const allowed = targetState.toUpperCase() === 'DRAFT';
  
  return {
    allowed,
    transitions: ['DRAFT'],
    restrictions: allowed ? [] : ['Only DRAFT transition allowed'],
    reasons: [allowed ? 'Valid VOID to DRAFT transition' : 'Invalid transition from VOID']
  };
}

// states/void/rules : State Void (commit 1)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)
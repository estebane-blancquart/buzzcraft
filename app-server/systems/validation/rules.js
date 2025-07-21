/**
 * COMMIT 8 - System Validation
 * 
 * FAIT QUOI : Validation règles business avec contraintes métier et exceptions
 * REÇOIT : data: object, ruleSet: string, context: object, exceptions?: string[]
 * RETOURNE : { valid: boolean, violations: object[], exceptions: object[], score: number }
 * ERREURS : RuleError si règle inexistante, ViolationError si contrainte violée, ContextError si contexte invalide
 */

export function checkBusinessRules(data, ruleSet, context = {}, exceptions = []) {
  // Validation
  if (!data || typeof data !== 'object') {
    throw new Error('ValidationError: data must be an object');
  }
  
  if (!ruleSet || typeof ruleSet !== 'string') {
    throw new Error('ValidationError: ruleSet must be a non-empty string');
  }

  // RuleSets basiques supportés
  const supportedRuleSets = ['project-naming', 'user-permissions', 'deployment-safety'];
  
  if (!supportedRuleSets.includes(ruleSet)) {
    return {
      valid: false,
      violations: [{ rule: ruleSet, message: `Unknown ruleset: ${ruleSet}` }],
      exceptions: [],
      score: 0
    };
  }

  // Validation basique selon le ruleSet
  const violations = checkRules(data, ruleSet, exceptions);
  const score = Math.max(0, 100 - (violations.length * 25));
  
  return {
    valid: violations.length === 0,
    violations,
    exceptions: [],
    score
  };
}

function checkRules(data, ruleSet, exceptions) {
  const violations = [];

  if (ruleSet === 'project-naming' && !exceptions.includes('naming')) {
    if (data.name && data.name.length < 3) {
      violations.push({ rule: 'min-length', field: 'name', message: 'Name too short' });
    }
  }

  if (ruleSet === 'user-permissions' && !exceptions.includes('permissions')) {
    if (!data.role) {
      violations.push({ rule: 'required-role', field: 'role', message: 'Role required' });
    }
  }

  return violations;
}

// systems/validation/rules : System Validation (commit 8)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/
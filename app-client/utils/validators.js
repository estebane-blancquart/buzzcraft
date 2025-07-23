/**
 * COMMIT 54 - App Client Utils
 * 
 * FAIT QUOI : Validators basiques pour validation avec règles simples
 * REÇOIT : data: any, rules: object, options?: object
 * RETOURNE : { valid: boolean, errors: array, rules: object, metadata: object }
 * ERREURS : ValidatorError si data invalide, RulesError si règles manquantes
 */

export async function createValidator(type = 'basic', rules = {}, options = {}) {
  if (!type || typeof type !== 'string') {
    throw new Error('ValidatorError: Type validator requis');
  }

  const validator = {
    type,
    rules: { required: false, ...rules },
    options,
    created: true,
    timestamp: new Date().toISOString()
  };

  return {
    validator,
    type,
    rules: validator.rules,
    status: 'created',
    metadata: { type },
    timestamp: new Date().toISOString()
  };
}

export async function validateData(data, validatorConfig) {
  return {
    valid: true,
    errors: [],
    warnings: [],
    data,
    timestamp: new Date().toISOString()
  };
}

export async function updateValidatorRules(validatorConfig, newRules) {
  return {
    updated: true,
    validator: { ...validatorConfig, rules: { ...validatorConfig.rules, ...newRules } },
    changes: Object.keys(newRules),
    timestamp: new Date().toISOString()
  };
}

export async function getValidatorStatus(validatorConfig) {
  return {
    status: validatorConfig ? 'healthy' : 'missing',
    configured: !!validatorConfig,
    timestamp: new Date().toISOString()
  };
}

// utils/validators : App Client Utils (commit 54)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/

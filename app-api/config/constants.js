/*
 * FAIT QUOI : Constantes partagées pour l'API BuzzCraft
 * REÇOIT : Rien (module de constantes)
 * RETOURNE : Exports de constantes
 * ERREURS : Aucune (constantes statiques)
 */

// Templates disponibles (utilisés par validation + frontend)
export const TEMPLATES = ['basic', 'test-button'];

// Pattern validation ID projet
export const PROJECT_ID_PATTERN = /^[a-z0-9-]+$/;

// États possibles d'un projet
export const VALID_STATES = ['VOID', 'DRAFT', 'BUILT', 'OFFLINE', 'ONLINE'];

// Limites validation
export const VALIDATION_LIMITS = {
  PROJECT_ID_MIN_LENGTH: 3,
  PROJECT_NAME_MIN_LENGTH: 2
};

// Messages d'erreur standardisés
export const ERROR_MESSAGES = {
  PROJECT_ID_REQUIRED: 'projectId must be a non-empty string',
  PROJECT_ID_INVALID: 'projectId must contain only lowercase letters, numbers, and hyphens',
  PROJECT_ID_TOO_SHORT: `projectId must be at least ${VALIDATION_LIMITS.PROJECT_ID_MIN_LENGTH} characters`,
  CONFIG_REQUIRED: 'config must be an object',
  CONFIG_NAME_REQUIRED: 'config.name must be a non-empty string',
  CONFIG_NAME_TOO_SHORT: `config.name must be at least ${VALIDATION_LIMITS.PROJECT_NAME_MIN_LENGTH} characters`,
  TEMPLATE_INVALID: `config.template must be one of: ${TEMPLATES.join(', ')}`
};
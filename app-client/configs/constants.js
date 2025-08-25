/*
 * FAIT QUOI : Constantes centralisées pour éliminer magic strings
 * REÇOIT : Rien (export seulement)
 * RETOURNE : Constantes organisées par domaine
 * ERREURS : Aucune (définitions statiques)
 */

// === ÉTATS PROJETS ===
export const PROJECT_STATES = {
  VOID: 'VOID',
  DRAFT: 'DRAFT', 
  BUILT: 'BUILT',
  OFFLINE: 'OFFLINE',
  ONLINE: 'ONLINE'
};

// === ACTIONS PROJETS ===
export const PROJECT_ACTIONS = {
  CREATE: 'CREATE',
  EDIT: 'EDIT',
  BUILD: 'BUILD',
  DEPLOY: 'DEPLOY', 
  START: 'START',
  STOP: 'STOP',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  REVERT: 'REVERT'
};

// === TYPES MESSAGES CONSOLE ===
export const MESSAGE_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error'
};

// === DEVICES RESPONSIVE ===
export const DEVICES = {
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  MOBILE: 'mobile'
};

// === TYPES ÉLÉMENTS ===
export const ELEMENT_TYPES = {
  PAGE: 'page',
  SECTION: 'section', 
  DIV: 'div',
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
  BUTTON: 'button',
  IMAGE: 'image',
  VIDEO: 'video',
  LINK: 'link',
  FORM: 'form',
  LIST: 'list'
};

// === COLONNES RESPONSIVE ===
export const RESPONSIVE_COLUMNS = {
  DESKTOP: [1, 2, 3],
  TABLET: [1, 2],
  MOBILE: [1]
};

// === VALIDATIONS FORMULAIRES ===
export const VALIDATION_RULES = {
  PROJECT_ID: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-z0-9-]+$/
  },
  PROJECT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100
  }
};

// === MESSAGES UI ===
export const UI_MESSAGES = {
  LOADING: 'Chargement...',
  SELECT_ELEMENT: 'Sélectionnez un élément',
  CONFIRM_DELETE: 'Cette action est irréversible.',
  UNSAVED_CHANGES: 'Vous avez des modifications non sauvegardées. Quitter quand même ?'
};

// === TIMEOUTS & DELAYS ===
export const TIMING = {
  AUTO_SAVE_DELAY: 2000,
  LOADING_MIN_DURATION: 500,
  NOTIFICATION_DURATION: 3000
};

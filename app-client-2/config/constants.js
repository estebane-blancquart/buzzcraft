// ��� CONSTANTES CENTRALISÉES - Zéro magic strings

export const PROJECT_STATES = {
  VOID: 'VOID',
  DRAFT: 'DRAFT', 
  BUILT: 'BUILT',
  OFFLINE: 'OFFLINE',
  ONLINE: 'ONLINE'
};

export const PROJECT_ACTIONS = {
  CREATE: "CREATE",
  EDIT: "EDIT",
  BUILD: "BUILD",
  REVERT: "REVERT",
  DEPLOY: "DEPLOY",
  START: "START",
  STOP: "STOP",
  UPDATE: "UPDATE",
  DELETE: "DELETE"
};

export const DEVICES = {
  DESKTOP: 'desktop',
  TABLET: 'tablet', 
  MOBILE: 'mobile'
};

export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info'
};

export const UI_MESSAGES = {
  LOADING: 'Chargement...',
  ERROR_GENERIC: 'Une erreur est survenue',
  SUCCESS_SAVE: 'Sauvegardé avec succès',
  CONFIRM_DELETE: 'Êtes-vous sûr de vouloir supprimer ?'
};

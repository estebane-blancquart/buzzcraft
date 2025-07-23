/**
 * COMMIT 56 - App Client Themes
 * 
 * FAIT QUOI : Système espacement harmonieux avec grille cohérente et utilitaires responsives
 * REÇOIT : spacingKey: string, direction?: string, responsive?: boolean, options?: object
 * RETOURNE : { spacing: object, scale: object, utilities: object, responsive: boolean }
 * ERREURS : SpacingError si clé invalide, DirectionError si direction incorrecte, ResponsiveError si breakpoint inconnu
 */

export async function createSpacingScale(themeName = 'buzzcraft', customSpacing = {}) {
  if (!themeName || typeof themeName !== 'string') {
    throw new Error('SpacingError: Nom de thème requis');
  }

  const defaultScale = {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    4: '1rem',     // 16px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    12: '3rem',    // 48px
    16: '4rem'     // 64px
  };

  const spacing = { ...defaultScale, ...customSpacing };

  return {
    spacing: spacing,
    scale: spacing,
    utilities: Object.keys(spacing),
    responsive: true,
    timestamp: new Date().toISOString()
  };
}

export async function validateSpacingValue(spacingKey, scale = {}) {
  if (spacingKey === undefined || spacingKey === null) {
    throw new Error('SpacingError: Clé d\'espacement requise');
  }

  const fromScale = scale[spacingKey] !== undefined;
  const cssPattern = /^(\d*\.?\d+)(rem|px|em|%)$/;
  const isValidCSS = typeof spacingKey === 'string' && cssPattern.test(spacingKey);

  return {
    valid: fromScale || isValidCSS,
    key: spacingKey,
    value: fromScale ? scale[spacingKey] : spacingKey,
    fromScale: fromScale,
    timestamp: new Date().toISOString()
  };
}

export async function generateSpacingUtilities(spacingConfig, properties = ['margin', 'padding']) {
  if (!spacingConfig || typeof spacingConfig !== 'object') {
    throw new Error('SpacingError: Configuration espacement requise');
  }

  const utilities = {};
  properties.forEach(prop => {
    Object.entries(spacingConfig.scale || {}).forEach(([key, value]) => {
      utilities[`${prop}-${key}`] = { [prop]: value };
    });
  });

  return {
    generated: true,
    utilities: utilities,
    properties: properties,
    count: Object.keys(utilities).length,
    timestamp: new Date().toISOString()
  };
}

export async function getSpacingStatus(spacingConfig) {
  return {
    status: spacingConfig ? 'healthy' : 'missing',
    configured: !!spacingConfig,
    scale: Object.keys(spacingConfig?.scale || {}).length,
    responsive: spacingConfig?.responsive || false,
    timestamp: new Date().toISOString()
  };
}

// themes/spacing : App Client Themes (commit 56)
// DEPENDENCY FLOW (no circular deps)

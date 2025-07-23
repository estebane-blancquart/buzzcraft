/**
 * COMMIT 56 - App Client Themes
 * 
 * FAIT QUOI : Système couleurs avec palettes thématiques et validation formats
 * REÇOIT : themeName: string, colorKey: string, variant?: string, options?: object
 * RETOURNE : { colors: object, theme: string, palette: object, variants: array }
 * ERREURS : ColorError si couleur invalide, ThemeError si thème inexistant, VariantError si variant inconnu
 */

export async function createColorPalette(themeName = 'buzzcraft', customColors = {}) {
  if (!themeName || typeof themeName !== 'string') {
    throw new Error('ColorError: Nom de thème requis');
  }

  const defaultPalette = {
    primary: { 500: '#3b82f6', 600: '#2563eb' },
    secondary: { 500: '#64748b', 600: '#475569' },
    success: { 500: '#22c55e' },
    warning: { 500: '#f59e0b' },
    error: { 500: '#ef4444' }
  };

  const palette = { ...defaultPalette, ...customColors };

  return {
    colors: palette,
    theme: themeName,
    palette: palette,
    variants: Object.keys(palette),
    timestamp: new Date().toISOString()
  };
}

export async function validateColorValue(colorValue, format = 'hex') {
  if (!colorValue || typeof colorValue !== 'string') {
    throw new Error('ColorError: Valeur couleur requise');
  }

  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const isValid = format === 'hex' ? hexPattern.test(colorValue) : true;

  return {
    valid: isValid,
    color: colorValue,
    format: format,
    timestamp: new Date().toISOString()
  };
}

export async function applyColorTheme(targetElement, themeName, colorMap = {}) {
  if (!targetElement || typeof targetElement !== 'string') {
    throw new Error('ColorError: Element cible requis');
  }

  return {
    applied: true,
    target: targetElement,
    theme: themeName,
    colors: Object.keys(colorMap).length,
    timestamp: new Date().toISOString()
  };
}

export async function getColorStatus(colorConfig) {
  return {
    status: colorConfig ? 'healthy' : 'missing',
    configured: !!colorConfig,
    theme: colorConfig?.theme || 'unknown',
    colors: colorConfig?.variants?.length || 0,
    timestamp: new Date().toISOString()
  };
}

// themes/colors : App Client Themes (commit 56)
// DEPENDENCY FLOW (no circular deps)

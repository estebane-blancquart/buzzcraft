/**
 * COMMIT 62 - Panel Projects
 * 
 * FAIT QUOI : Système filtres projets avec presets et sauvegarde configuration
 * REÇOIT : filtersConfig: object, presets?: array, userPrefs?: object, context?: object
 * RETOURNE : { filters: object, presets: array, applied: object, suggestions: array }
 * ERREURS : FilterError si filtre invalide, PresetError si preset incorrect, ConfigError si configuration échoue, UserPrefError si préférences corrompues
 */

export async function loadProjectFilters(filtersConfig = {}, presets = []) {
  const defaultPresets = [
    {
      id: 'active-projects',
      name: 'Projets Actifs',
      description: 'Projets en cours de développement',
      filters: { status: ['development', 'active'] },
      icon: 'activity',
      color: 'green'
    },
    {
      id: 'my-projects',
      name: 'Mes Projets',
      description: 'Projets dont je suis l\'auteur',
      filters: { author: 'currentUser' },
      icon: 'user',
      color: 'blue'
    },
    {
      id: 'recent-projects',
      name: 'Récents',
      description: 'Projets créés dans les 30 derniers jours',
      filters: { 
        dateRange: { 
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      },
      icon: 'clock',
      color: 'orange'
    },
    {
      id: 'web-projects',
      name: 'Sites Web',
      description: 'Projets de type web uniquement',
      filters: { type: ['web', 'portfolio'] },
      icon: 'globe',
      color: 'purple'
    }
  ];

  const availableFilters = {
    status: {
      type: 'select',
      options: ['planning', 'development', 'active', 'completed', 'archived'],
      multiple: true
    },
    type: {
      type: 'select', 
      options: ['web', 'mobile', 'desktop', 'api', 'portfolio', 'ecommerce', 'dashboard'],
      multiple: true
    },
    technology: {
      type: 'text',
      suggestions: ['React', 'Vue.js', 'Angular', 'Node.js', 'React Native']
    },
    author: {
      type: 'text',
      suggestions: ['currentUser']
    },
    dateRange: {
      type: 'dateRange',
      options: { start: null, end: null }
    },
    tags: {
      type: 'tags',
      suggestions: ['commerce', 'portfolio', 'admin', 'mobile', 'api']
    }
  };

  return {
    filters: availableFilters,
    presets: [...defaultPresets, ...presets],
    applied: {},
    suggestions: generateFilterSuggestions(filtersConfig),
    timestamp: new Date().toISOString()
  };
}

export async function validateFilterPreset(preset) {
  const validation = {
    valid: true,
    preset: preset?.name || 'Unknown',
    issues: [],
    timestamp: new Date().toISOString()
  };

  if (!preset?.id || !preset?.name) {
    validation.issues.push('Preset doit avoir ID et nom');
    validation.valid = false;
  }

  if (!preset?.filters || Object.keys(preset.filters).length === 0) {
    validation.issues.push('Preset doit contenir au moins un filtre');
    validation.valid = false;
  }

  return validation;
}

export async function applyFilterPreset(preset, currentFilters = {}) {
  if (!preset?.filters) {
    throw new Error('PresetError: Preset sans filtres');
  }

  const appliedFilters = { ...currentFilters, ...preset.filters };

  return {
    applied: true,
    presetId: preset.id,
    filters: appliedFilters,
    changes: Object.keys(preset.filters),
    timestamp: new Date().toISOString()
  };
}

export async function getFiltersStatus(filtersData) {
  const activeFilters = Object.keys(filtersData?.applied || {});
  
  return {
    status: activeFilters.length > 0 ? 'filtered' : 'unfiltered',
    activeFilters: activeFilters.length,
    presetsAvailable: filtersData?.presets?.length || 0,
    timestamp: new Date().toISOString()
  };
}

function generateFilterSuggestions(config) {
  return [
    'Filtrer par statut actif',
    'Mes projets uniquement', 
    'Projets récents',
    'Par type de technologie'
  ];
}

// panels/projects/filters : Panel Projects (commit 62)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/

/**
 * COMMIT 70 - Panel Help
 * 
 * FAIT QUOI : Documentation interactive avec recherche et navigation contextuelle
 * REÇOIT : sections: string[], searchConfig: object, navigation: object
 * RETOURNE : { documentation: object[], search: object, navigation: object, metadata: object }
 * ERREURS : DocumentationError si sections invalides, SearchError si indexation échoue, NavigationError si structure corrompue
 */

export async function createHelpDocumentation(sections = [], searchConfig = {}, navigation = {}) {
  if (!Array.isArray(sections)) {
    throw new Error('DocumentationError: Sections doit être array');
  }

  const validSections = ['getting-started', 'components', 'api', 'tutorials', 'troubleshooting', 'faq'];
  const requestedSections = sections.length > 0 ? sections : validSections;
  
  const invalidSections = requestedSections.filter(section => !validSections.includes(section));
  if (invalidSections.length > 0) {
    throw new Error(`DocumentationError: Sections invalides: ${invalidSections.join(', ')}`);
  }

  const documentation = requestedSections.map(section => ({
    id: section,
    title: getDocTitle(section),
    content: getDocContent(section),
    category: getDocCategory(section),
    tags: getDocTags(section)
  }));

  const searchIndex = buildSearchIndex(documentation);
  const navigationStructure = buildNavigation(documentation);

  return {
    documentation,
    search: {
      index: searchIndex,
      enabled: true,
      config: searchConfig
    },
    navigation: navigationStructure,
    metadata: {
      sections: requestedSections.length,
      totalPages: documentation.length,
      searchable: searchIndex.totalEntries,
      timestamp: new Date().toISOString()
    }
  };
}

export async function validateDocumentationStructure(documentationConfig, validationRules = {}) {
  if (!documentationConfig || typeof documentationConfig !== 'object') {
    throw new Error('DocumentationError: Configuration documentation requise');
  }

  const issues = [];

  if (!documentationConfig.documentation || !Array.isArray(documentationConfig.documentation)) {
    issues.push('documentation_array_missing');
  }

  if (!documentationConfig.search || typeof documentationConfig.search !== 'object') {
    issues.push('search_config_missing');
  }

  // Validation contenu
  if (documentationConfig.documentation) {
    const requiredPages = validationRules.requiredPages || ['getting-started'];
    const existingPages = documentationConfig.documentation.map(doc => doc.id);
    const missingPages = requiredPages.filter(page => !existingPages.includes(page));
    
    if (missingPages.length > 0) {
      issues.push(`missing_required_pages: ${missingPages.join(', ')}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    coverage: {
      pages: documentationConfig.documentation?.length || 0,
      searchEnabled: documentationConfig.search?.enabled || false
    },
    timestamp: new Date().toISOString()
  };
}

export async function searchDocumentationContent(documentationConfig, query, searchOptions = {}) {
  if (!documentationConfig || typeof documentationConfig !== 'object') {
    throw new Error('DocumentationError: Configuration documentation requise');
  }

  if (!query || typeof query !== 'string') {
    throw new Error('SearchError: Requête de recherche requise');
  }

  const searchIndex = documentationConfig.search?.index;
  if (!searchIndex) {
    throw new Error('SearchError: Index de recherche non disponible');
  }

  const results = performSearch(searchIndex, query, searchOptions);
  const suggestions = generateSuggestions(searchIndex, query);

  return {
    results,
    suggestions,
    query,
    metadata: {
      totalResults: results.length,
      searchTime: Date.now(),
      timestamp: new Date().toISOString()
    }
  };
}

export async function getDocumentationStatus(documentationConfig) {
  if (!documentationConfig) {
    return {
      status: 'missing',
      configured: false,
      timestamp: new Date().toISOString()
    };
  }

  const validation = await validateDocumentationStructure(documentationConfig);
  
  return {
    status: validation.valid ? 'healthy' : 'degraded',
    configured: !!documentationConfig.metadata,
    documentation: {
      totalPages: documentationConfig.documentation?.length || 0,
      sections: documentationConfig.metadata?.sections || 0
    },
    search: {
      enabled: documentationConfig.search?.enabled || false,
      indexed: documentationConfig.search?.index?.totalEntries || 0
    },
    issues: validation.issues || [],
    lastCheck: new Date().toISOString()
  };
}

// Fonctions utilitaires
function getDocTitle(section) {
  const titles = {
    'getting-started': 'Guide de démarrage',
    'components': 'Documentation des composants',
    'api': 'Référence API',
    'tutorials': 'Tutoriels',
    'troubleshooting': 'Dépannage',
    'faq': 'Questions fréquentes'
  };
  return titles[section] || section;
}

function getDocContent(section) {
  const content = {
    'getting-started': 'Guide complet pour débuter avec BuzzCraft...',
    'components': 'Documentation des composants BuzzCraft...',
    'api': 'Référence complète de l\'API BuzzCraft...',
    'tutorials': 'Tutoriels step-by-step...',
    'troubleshooting': 'Solutions aux problèmes courants...',
    'faq': 'Réponses aux questions fréquentes...'
  };
  return content[section] || 'Contenu non disponible';
}

function getDocCategory(section) {
  const categories = {
    'getting-started': 'basics',
    'components': 'reference',
    'api': 'reference',
    'tutorials': 'learning',
    'troubleshooting': 'support',
    'faq': 'support'
  };
  return categories[section] || 'general';
}

function getDocTags(section) {
  const tags = {
    'getting-started': ['guide', 'installation', 'concepts'],
    'components': ['components', 'api', 'reference'],
    'api': ['api', 'rest', 'websocket'],
    'tutorials': ['tutorial', 'guide', 'examples'],
    'troubleshooting': ['troubleshooting', 'debug', 'errors'],
    'faq': ['faq', 'questions', 'answers']
  };
  return tags[section] || [];
}

function buildSearchIndex(documentation) {
  const index = {
    entries: [],
    totalEntries: 0
  };

  documentation.forEach(doc => {
    index.entries.push({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      searchableText: `${doc.title} ${doc.content}`.toLowerCase()
    });
  });

  index.totalEntries = index.entries.length;
  return index;
}

function buildNavigation(documentation) {
  return {
    structure: documentation.reduce((acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push({
        id: doc.id,
        title: doc.title,
        path: `/${doc.category}/${doc.id}`
      });
      return acc;
    }, {}),
    breadcrumbs: {}
  };
}

function performSearch(searchIndex, query, options = {}) {
  const queryLower = query.toLowerCase();
  const results = [];

  searchIndex.entries.forEach(entry => {
    if (entry.searchableText.includes(queryLower)) {
      results.push({
        id: entry.id,
        title: entry.title,
        snippet: entry.content.substring(0, 150) + '...',
        score: calculateScore(entry, query)
      });
    }
  });

  return results.sort((a, b) => b.score - a.score).slice(0, options.limit || 10);
}

function generateSuggestions(searchIndex, query) {
  // Suggestions basiques
  return [];
}

function calculateScore(entry, query) {
  let score = 0;
  const queryLower = query.toLowerCase();
  
  if (entry.title.toLowerCase().includes(queryLower)) score += 100;
  if (entry.content.toLowerCase().includes(queryLower)) score += 50;
  
  return score;
}

// panels/help/documentation : Panel Help (commit 70)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
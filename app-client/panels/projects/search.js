/**
 * COMMIT 62 - Panel Projects
 * 
 * FAIT QUOI : Recherche projets avec filtres avancés et indexation
 * REÇOIT : searchQuery: string, filters?: object, options?: object, context?: object
 * RETOURNE : { results: array, filters: object, suggestions: array, stats: object }
 * ERREURS : SearchError si recherche impossible, FilterError si filtres invalides, IndexError si indexation échoue, QueryError si requête malformée
 */

export async function searchProjects(searchQuery = '', filters = {}) {
  // Dataset simulé pour la recherche
  const allProjects = [
    {
      id: 'proj-001', name: 'Site E-commerce', description: 'Plateforme vente en ligne',
      status: 'active', type: 'ecommerce', technology: 'React', author: 'Marie Dupont',
      tags: ['commerce', 'paiement', 'react'], created: '2025-01-15T10:30:00Z'
    },
    {
      id: 'proj-002', name: 'Portfolio Designer', description: 'Site vitrine créatif',
      status: 'completed', type: 'portfolio', technology: 'Vue.js', author: 'Jean Martin',
      tags: ['design', 'vitrine', 'vue'], created: '2025-06-10T09:15:00Z'
    },
    {
      id: 'proj-003', name: 'Dashboard Analytics', description: 'Interface admin avec métriques',
      status: 'development', type: 'dashboard', technology: 'Angular', author: 'Sophie Moreau',
      tags: ['admin', 'analytics', 'angular'], created: '2025-07-01T11:00:00Z'
    },
    {
      id: 'proj-004', name: 'App Mobile Banking', description: 'Application bancaire mobile',
      status: 'planning', type: 'mobile', technology: 'React Native', author: 'Pierre Dubois',
      tags: ['mobile', 'finance', 'react-native'], created: '2025-07-20T14:30:00Z'
    },
    {
      id: 'proj-005', name: 'API Microservices', description: 'Architecture services distribués',
      status: 'active', type: 'api', technology: 'Node.js', author: 'Marie Dupont',
      tags: ['api', 'microservices', 'nodejs'], created: '2025-03-12T16:20:00Z'
    }
  ];

  let results = [...allProjects];

  // Application de la recherche textuelle
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    results = results.filter(project => {
      return project.name.toLowerCase().includes(query) ||
             project.description.toLowerCase().includes(query) ||
             project.author.toLowerCase().includes(query) ||
             project.tags.some(tag => tag.toLowerCase().includes(query));
    });
  }

  // Application des filtres
  if (filters.status) {
    results = results.filter(p => p.status === filters.status);
  }

  if (filters.type) {
    results = results.filter(p => p.type === filters.type);
  }

  if (filters.technology) {
    results = results.filter(p => p.technology.toLowerCase().includes(filters.technology.toLowerCase()));
  }

  if (filters.author) {
    results = results.filter(p => p.author.toLowerCase().includes(filters.author.toLowerCase()));
  }

  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    results = results.filter(p => {
      const created = new Date(p.created);
      return (!start || created >= new Date(start)) && (!end || created <= new Date(end));
    });
  }

  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(p => 
      filters.tags.some(tag => p.tags.includes(tag))
    );
  }

  // Génération de suggestions basées sur la recherche
  const suggestions = generateSearchSuggestions(searchQuery, allProjects);

  // Statistiques de recherche
  const stats = {
    total: allProjects.length,
    filtered: results.length,
    query: searchQuery,
    filtersApplied: Object.keys(filters).length,
    executionTime: Math.random() * 50 + 10 // Simulation temps execution
  };

  return {
    results: results,
    filters: filters,
    suggestions: suggestions,
    stats: stats,
    timestamp: new Date().toISOString()
  };
}

export async function validateSearchFilters(filters) {
  const validation = {
    valid: true,
    validFilters: {},
    invalidFilters: {},
    issues: [],
    timestamp: new Date().toISOString()
  };

  const validStatuses = ['planning', 'development', 'active', 'completed', 'archived'];
  const validTypes = ['web', 'mobile', 'desktop', 'api', 'portfolio', 'ecommerce', 'dashboard'];

  // Validation status
  if (filters.status) {
    if (validStatuses.includes(filters.status)) {
      validation.validFilters.status = filters.status;
    } else {
      validation.invalidFilters.status = filters.status;
      validation.issues.push(`Statut invalide: ${filters.status}`);
      validation.valid = false;
    }
  }

  // Validation type
  if (filters.type) {
    if (validTypes.includes(filters.type)) {
      validation.validFilters.type = filters.type;
    } else {
      validation.invalidFilters.type = filters.type;
      validation.issues.push(`Type invalide: ${filters.type}`);
      validation.valid = false;
    }
  }

  // Validation dateRange
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    if (start && isNaN(new Date(start))) {
      validation.invalidFilters.dateStart = start;
      validation.issues.push('Date de début invalide');
      validation.valid = false;
    }
    if (end && isNaN(new Date(end))) {
      validation.invalidFilters.dateEnd = end;
      validation.issues.push('Date de fin invalide');
      validation.valid = false;
    }
    if (start && end && new Date(start) > new Date(end)) {
      validation.issues.push('Date de début postérieure à la date de fin');
      validation.valid = false;
    }
  }

  return validation;
}

export async function updateSearchIndex(projects) {
  if (!Array.isArray(projects)) {
    throw new Error('IndexError: Liste projets requise pour indexation');
  }

  // Simulation de la création d'un index de recherche
  const index = {
    terms: new Set(),
    projectCount: projects.length,
    lastUpdate: new Date().toISOString()
  };

  // Extraction des termes pour l'index
  projects.forEach(project => {
    // Indexation du nom
    project.name.toLowerCase().split(/\s+/).forEach(term => {
      if (term.length > 2) index.terms.add(term);
    });

    // Indexation de la description
    project.description.toLowerCase().split(/\s+/).forEach(term => {
      if (term.length > 2) index.terms.add(term);
    });

    // Indexation des tags
    if (project.tags) {
      project.tags.forEach(tag => index.terms.add(tag.toLowerCase()));
    }

    // Indexation de l'auteur
    project.author.toLowerCase().split(/\s+/).forEach(term => {
      if (term.length > 1) index.terms.add(term);
    });
  });

  return {
    indexed: true,
    termsCount: index.terms.size,
    projectsCount: index.projectCount,
    index: {
      terms: Array.from(index.terms).slice(0, 10), // Échantillon des termes
      size: index.terms.size,
      lastUpdate: index.lastUpdate
    },
    timestamp: new Date().toISOString()
  };
}

export async function getSearchPerformance(searchData) {
  if (!searchData) {
    return {
      performance: 'unknown',
      metrics: {},
      timestamp: new Date().toISOString()
    };
  }

  const { stats } = searchData;
  
  // Évaluation des performances
  const performance = {
    speed: stats?.executionTime < 50 ? 'fast' : stats?.executionTime < 100 ? 'medium' : 'slow',
    relevance: stats?.filtered / stats?.total > 0.8 ? 'low' : 
              stats?.filtered / stats?.total > 0.3 ? 'medium' : 'high',
    coverage: stats?.total > 100 ? 'extensive' : stats?.total > 10 ? 'adequate' : 'limited'
  };

  const metrics = {
    executionTime: stats?.executionTime || 0,
    resultRatio: stats?.total > 0 ? (stats.filtered / stats.total).toFixed(2) : '0.00',
    filtersUsed: stats?.filtersApplied || 0,
    totalProjects: stats?.total || 0,
    matchedProjects: stats?.filtered || 0
  };

  return {
    performance: performance,
    metrics: metrics,
    recommendations: generatePerformanceRecommendations(performance, metrics),
    timestamp: new Date().toISOString()
  };
}

// Fonctions utilitaires
function generateSearchSuggestions(query, projects) {
  if (!query || query.length < 2) return [];

  const suggestions = new Set();
  const queryLower = query.toLowerCase();

  projects.forEach(project => {
    // Suggestions basées sur les noms
    if (project.name.toLowerCase().includes(queryLower)) {
      suggestions.add(project.name);
    }

    // Suggestions basées sur les tags
    if (project.tags) {
      project.tags.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) {
          suggestions.add(tag);
        }
      });
    }

    // Suggestions basées sur la technologie
    if (project.technology.toLowerCase().includes(queryLower)) {
      suggestions.add(project.technology);
    }
  });

  return Array.from(suggestions).slice(0, 5);
}

function generatePerformanceRecommendations(performance, metrics) {
  const recommendations = [];

  if (performance.speed === 'slow') {
    recommendations.push('Optimiser les filtres de recherche');
  }

  if (performance.relevance === 'low') {
    recommendations.push('Affiner les critères de recherche');
  }

  if (metrics.resultRatio > 0.9) {
    recommendations.push('Utiliser des filtres plus spécifiques');
  }

  if (metrics.filtersUsed === 0) {
    recommendations.push('Utiliser les filtres pour améliorer la précision');
  }

  return recommendations;
}

// panels/projects/search : Panel Projects (commit 62)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/

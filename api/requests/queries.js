/**
 * COMMIT 42 - API Requests
 * 
 * FAIT QUOI : Gestion requêtes API recherche et filtrage avec agrégation et pagination avancée
 * REÇOIT : req: Request, res: Response, queryType: string, filters: object
 * RETOURNE : { success: boolean, results: object[], aggregations: object, timing: number }
 * ERREURS : QueryValidationError si requête invalide, SearchError si recherche échoue, FilterError si filtre incorrect
 */

export async function searchProjectsRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const query = req.query.q || '';
    const filters = extractFilters(req.query);
    const pagination = extractPagination(req.query);
    const sorting = extractSorting(req.query);

    if (query.length > 0 && query.length < 2) {
      throw new Error('QueryValidationError: Query doit contenir au moins 2 caractères');
    }

    // Mock de résultats recherche
    const mockResults = [
      {
        id: 'proj-1',
        name: 'my-awesome-project',
        description: 'A great project with React',
        state: 'ONLINE',
        template: 'react',
        score: 0.95,
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'proj-2',
        name: 'vue-dashboard',
        description: 'Dashboard built with Vue.js',
        state: 'BUILT',
        template: 'vue',
        score: 0.87,
        createdAt: '2024-01-20T14:30:00Z'
      }
    ];

    // Appliquer filtres
    let filteredResults = applyFilters(mockResults, filters);
    
    // Appliquer tri
    filteredResults = applySorting(filteredResults, sorting);
    
    // Appliquer pagination
    const paginatedResults = applyPagination(filteredResults, pagination);

    // Calculer agrégations
    const aggregations = calculateAggregations(filteredResults);

    const response = {
      success: true,
      results: paginatedResults,
      aggregations,
      metadata: {
        endpoint: 'GET /api/queries/projects/search',
        timing: Date.now() - startTime,
        query: {
          text: query,
          filters,
          sorting,
          pagination
        },
        total: filteredResults.length
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleQueryRequestError(error, res, startTime, 'SEARCH_PROJECTS');
  }
}

export async function aggregateProjectsRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const groupBy = req.query.groupBy || 'state';
    const metrics = (req.query.metrics || 'count').split(',');
    const filters = extractFilters(req.query);

    if (!['state', 'template', 'created_month', 'status'].includes(groupBy)) {
      throw new Error(`QueryValidationError: GroupBy '${groupBy}' non supporté`);
    }

    // Mock données pour agrégation
    const mockData = [
      { state: 'DRAFT', template: 'react', created: '2024-01', status: 'active' },
      { state: 'BUILT', template: 'vue', created: '2024-01', status: 'active' },
      { state: 'ONLINE', template: 'react', created: '2024-02', status: 'active' },
      { state: 'DRAFT', template: 'angular', created: '2024-02', status: 'paused' }
    ];

    const aggregation = performAggregation(mockData, groupBy, metrics, filters);

    const response = {
      success: true,
      aggregation: {
        groupBy,
        metrics,
        results: aggregation.results,
        summary: aggregation.summary
      },
      metadata: {
        endpoint: 'GET /api/queries/projects/aggregate',
        timing: Date.now() - startTime,
        dataPoints: mockData.length,
        filters
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleQueryRequestError(error, res, startTime, 'AGGREGATE_PROJECTS');
  }
}

export async function getProjectStatsRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const period = req.query.period || '7d';
    const breakdown = req.query.breakdown || 'daily';

    if (!['1d', '7d', '30d', '90d'].includes(period)) {
      throw new Error(`QueryValidationError: Période '${period}' non supportée`);
    }

    if (!['hourly', 'daily', 'weekly'].includes(breakdown)) {
      throw new Error(`QueryValidationError: Breakdown '${breakdown}' non supporté`);
    }

    // Mock statistiques
    const mockStats = {
      overview: {
        totalProjects: 15,
        activeProjects: 12,
        onlineProjects: 8,
        buildsToday: 23,
        deploymentsToday: 5
      },
      states: {
        'VOID': 0,
        'DRAFT': 4,
        'BUILT': 3,
        'OFFLINE': 2,
        'ONLINE': 6
      },
      templates: {
        'react': 8,
        'vue': 4,
        'angular': 2,
        'next': 1
      },
      activity: generateActivityData(period, breakdown)
    };

    const response = {
      success: true,
      stats: mockStats,
      metadata: {
        endpoint: 'GET /api/queries/projects/stats',
        timing: Date.now() - startTime,
        period,
        breakdown,
        generatedAt: new Date().toISOString()
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleQueryRequestError(error, res, startTime, 'GET_STATS');
  }
}

export async function getAdvancedQueryRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const queryConfig = req.body;

    if (!queryConfig || !queryConfig.type) {
      throw new Error('QueryValidationError: Configuration query requise avec type');
    }

    // Valider configuration query avancée
    const validationResult = validateAdvancedQuery(queryConfig);
    if (!validationResult.valid) {
      throw new Error(`QueryValidationError: ${validationResult.errors.join(', ')}`);
    }

    // Exécuter query selon type
    const result = await executeAdvancedQuery(queryConfig);

    const response = {
      success: true,
      query: {
        type: queryConfig.type,
        config: queryConfig,
        executedAt: new Date().toISOString()
      },
      result,
      metadata: {
        endpoint: 'POST /api/queries/advanced',
        timing: Date.now() - startTime,
        complexity: calculateQueryComplexity(queryConfig)
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleQueryRequestError(error, res, startTime, 'ADVANCED_QUERY');
  }
}

function extractFilters(query) {
  return {
    state: query.state,
    template: query.template,
    createdAfter: query.created_after,
    createdBefore: query.created_before,
    status: query.status
  };
}

function extractPagination(query) {
  return {
    limit: Math.min(parseInt(query.limit) || 20, 100),
    offset: parseInt(query.offset) || 0
  };
}

function extractSorting(query) {
  const sort = query.sort || 'created_at';
  const order = query.order === 'asc' ? 'asc' : 'desc';
  return { sort, order };
}

function applyFilters(results, filters) {
  return results.filter(item => {
    if (filters.state && item.state !== filters.state.toUpperCase()) return false;
    if (filters.template && item.template !== filters.template) return false;
    if (filters.status && item.status !== filters.status) return false;
    return true;
  });
}

function applySorting(results, sorting) {
  return results.sort((a, b) => {
    let aVal = a[sorting.sort] || a.createdAt;
    let bVal = b[sorting.sort] || b.createdAt;
    
    if (sorting.order === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
}

function applyPagination(results, pagination) {
  return results.slice(pagination.offset, pagination.offset + pagination.limit);
}

function calculateAggregations(results) {
  const stateCount = {};
  const templateCount = {};
  
  results.forEach(item => {
    stateCount[item.state] = (stateCount[item.state] || 0) + 1;
    templateCount[item.template] = (templateCount[item.template] || 0) + 1;
  });

  return {
    byState: stateCount,
    byTemplate: templateCount,
    total: results.length
  };
}

function performAggregation(data, groupBy, metrics, filters) {
  // Appliquer filtres d'abord
  let filteredData = data;
  
  // Grouper données
  const groups = {};
  filteredData.forEach(item => {
    const key = item[groupBy] || 'unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  // Calculer métriques pour chaque groupe
  const results = Object.entries(groups).map(([key, items]) => {
    const result = { [groupBy]: key };
    
    metrics.forEach(metric => {
      switch (metric) {
        case 'count':
          result.count = items.length;
          break;
        case 'avg':
          result.average = items.length; // Mock
          break;
        case 'sum':
          result.sum = items.length; // Mock
          break;
      }
    });
    
    return result;
  });

  return {
    results,
    summary: {
      totalGroups: results.length,
      totalItems: filteredData.length
    }
  };
}

function generateActivityData(period, breakdown) {
  // Mock de données d'activité
  const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const points = breakdown === 'hourly' ? days * 24 : breakdown === 'daily' ? days : Math.ceil(days / 7);
  
  return Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(Date.now() - (points - i) * (breakdown === 'hourly' ? 3600000 : breakdown === 'daily' ? 86400000 : 604800000)).toISOString(),
    creates: Math.floor(Math.random() * 5),
    builds: Math.floor(Math.random() * 10),
    deploys: Math.floor(Math.random() * 3)
  }));
}

function validateAdvancedQuery(queryConfig) {
  const errors = [];
  
  if (!['search', 'aggregate', 'analytics', 'custom'].includes(queryConfig.type)) {
    errors.push(`Type '${queryConfig.type}' non supporté`);
  }
  
  if (queryConfig.type === 'custom' && !queryConfig.sql) {
    errors.push('Query custom requiert champ sql');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

async function executeAdvancedQuery(queryConfig) {
  // Mock exécution query avancée
  switch (queryConfig.type) {
    case 'search':
      return {
        results: [],
        total: 0,
        took: 25
      };
    
    case 'aggregate':
      return {
        aggregations: {},
        buckets: [],
        took: 15
      };
    
    case 'analytics':
      return {
        metrics: {},
        trends: [],
        took: 45
      };
    
    case 'custom':
      return {
        rows: [],
        columns: [],
        took: 120
      };
    
    default:
      throw new Error(`SearchError: Type de query '${queryConfig.type}' non implémenté`);
  }
}

function calculateQueryComplexity(queryConfig) {
  let complexity = 1;
  
  if (queryConfig.filters) complexity += Object.keys(queryConfig.filters).length;
  if (queryConfig.aggregations) complexity += Object.keys(queryConfig.aggregations).length;
  if (queryConfig.sorting) complexity += 1;
  if (queryConfig.pagination) complexity += 0.5;
  
  return Math.min(complexity, 10);
}

function handleQueryRequestError(error, res, startTime, operation) {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';

  if (error.message.includes('QueryValidationError')) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (error.message.includes('SearchError')) {
    statusCode = 500;
    errorCode = 'SEARCH_ERROR';
  } else if (error.message.includes('FilterError')) {
    statusCode = 400;
    errorCode = 'FILTER_ERROR';
  }

  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: error.message,
      operation,
      timestamp: new Date().toISOString()
    },
    metadata: {
      timing: Date.now() - startTime,
      retryable: !error.message.includes('ValidationError')
    },
    timing: Date.now() - startTime
  };

  res.status(statusCode).json(errorResponse);
}

// requests/queries : API Requests (commit 42)
// DEPENDENCY FLOW : api/requests/ → api/schemas/ → engines/ → transitions/ → systems/

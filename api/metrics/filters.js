/**
 * COMMIT 50 - API Metrics
 * 
 * FAIT QUOI : Filtrage métriques avec requêtes complexes et agrégations temps réel
 * REÇOIT : metrics: object, filterQuery: object, timeRange?: object, options?: object
 * RETOURNE : { filtered: boolean, results: array, aggregated: object, totalResults: number }
 * ERREURS : FilterError si requête invalide, QueryError si syntaxe incorrecte, AggregationError si agrégation impossible
 */

const FILTER_OPERATORS = {
  'eq': (value, target) => value === target,
  'ne': (value, target) => value !== target,
  'gt': (value, target) => value > target,
  'gte': (value, target) => value >= target,
  'lt': (value, target) => value < target,
  'lte': (value, target) => value <= target,
  'in': (value, targets) => Array.isArray(targets) && targets.includes(value),
  'nin': (value, targets) => Array.isArray(targets) && !targets.includes(value),
  'contains': (value, substring) => typeof value === 'string' && value.includes(substring),
  'regex': (value, pattern) => new RegExp(pattern).test(value),
  'exists': (value) => value !== undefined && value !== null,
  'range': (value, [min, max]) => value >= min && value <= max
};

const AGGREGATION_FUNCTIONS = {
  'sum': (values) => values.reduce((sum, val) => sum + val, 0),
  'avg': (values) => values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
  'min': (values) => values.length > 0 ? Math.min(...values) : 0,
  'max': (values) => values.length > 0 ? Math.max(...values) : 0,
  'count': (values) => values.length,
  'median': (values) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  },
  'percentile': (values, percentile = 95) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
};

const SAVED_FILTERS = new Map();
const FILTER_HISTORY = [];

export async function filterMetrics(metrics, filterQuery, timeRange = null, options = {}) {
  if (!metrics || typeof metrics !== 'object') {
    throw new Error('FilterError: metrics requis');
  }

  if (!filterQuery || typeof filterQuery !== 'object') {
    throw new Error('FilterError: filterQuery requis');
  }

  try {
    // Validation et parsing requête
    const parsedQuery = await parseFilterQuery(filterQuery);
    
    // Conversion métriques en format uniforme pour filtrage
    const metricsArray = await normalizeMetricsForFiltering(metrics);

    // Application filtres temporels si spécifiés
    let filteredMetrics = metricsArray;
    if (timeRange) {
      filteredMetrics = await applyTimeRangeFilter(filteredMetrics, timeRange);
    }

    // Application filtres principaux
    filteredMetrics = await applyMainFilters(filteredMetrics, parsedQuery);

    // Tri si spécifié
    if (options.sortBy) {
      filteredMetrics = await applySorting(filteredMetrics, options.sortBy, options.sortOrder);
    }

    // Pagination si spécifiée
    const totalResults = filteredMetrics.length;
    if (options.limit || options.offset) {
      filteredMetrics = await applyPagination(filteredMetrics, options.limit, options.offset);
    }

    // Agrégations si demandées
    let aggregated = {};
    if (options.aggregate) {
      aggregated = await performAggregations(filteredMetrics, options.aggregate);
    }

    return {
      filtered: true,
      results: filteredMetrics,
      totalResults,
      aggregated,
      query: parsedQuery,
      filteredAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`FilterError: ${error.message}`);
  }
}

export async function createComplexQuery(conditions, logic = 'AND', options = {}) {
  if (!Array.isArray(conditions)) {
    throw new Error('QueryError: conditions doit être un tableau');
  }

  if (!['AND', 'OR', 'NOT'].includes(logic.toUpperCase())) {
    throw new Error('QueryError: logic doit être AND, OR ou NOT');
  }

  try {
    // Validation de chaque condition
    for (const condition of conditions) {
      await validateCondition(condition);
    }

    const complexQuery = {
      type: 'complex',
      logic: logic.toUpperCase(),
      conditions,
      metadata: {
        createdAt: new Date().toISOString(),
        description: options.description || '',
        tags: options.tags || []
      }
    };

    // Sauvegarde si nom fourni
    if (options.name) {
      SAVED_FILTERS.set(options.name, complexQuery);
    }

    return {
      created: true,
      query: complexQuery,
      conditions: conditions.length,
      logic,
      createdAt: complexQuery.metadata.createdAt
    };

  } catch (error) {
    throw new Error(`QueryError: ${error.message}`);
  }
}

export async function aggregateMetrics(metrics, aggregations, groupBy = null, options = {}) {
  if (!metrics || (!Array.isArray(metrics) && typeof metrics !== 'object')) {
    throw new Error('AggregationError: metrics requis');
  }

  if (!aggregations || typeof aggregations !== 'object') {
    throw new Error('AggregationError: aggregations requis');
  }

  try {
    // Normalisation des métriques
    const metricsArray = Array.isArray(metrics) ? metrics : 
      Object.entries(metrics).map(([name, data]) => ({ name, ...data }));

    let result = {};

    if (groupBy) {
      // Agrégation avec groupement
      const grouped = await groupMetrics(metricsArray, groupBy);
      
      for (const [groupKey, groupMetrics] of Object.entries(grouped)) {
        result[groupKey] = {};
        for (const [aggName, aggConfig] of Object.entries(aggregations)) {
          result[groupKey][aggName] = await performSingleAggregation(groupMetrics, aggConfig);
        }
      }
    } else {
      // Agrégation globale
      for (const [aggName, aggConfig] of Object.entries(aggregations)) {
        result[aggName] = await performSingleAggregation(metricsArray, aggConfig);
      }
    }

    // Application de post-processing si demandé
    if (options.postProcess) {
      result = await applyPostProcessing(result, options.postProcess);
    }

    return {
      aggregated: true,
      groupBy: groupBy || null,
      aggregations: Object.keys(aggregations),
      results: result,
      totalMetrics: metricsArray.length,
      aggregatedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`AggregationError: ${error.message}`);
  }
}

export async function saveFilterQuery(name, query, description = '', options = {}) {
  if (!name || typeof name !== 'string') {
    throw new Error('FilterError: nom requis pour sauvegarder requête');
  }

  if (!query || typeof query !== 'object') {
    throw new Error('FilterError: query requis');
  }

  try {
    const savedFilter = {
      name,
      query,
      description,
      tags: options.tags || [],
      version: options.version || '1.0.0',
      isPublic: options.isPublic || false,
      createdBy: options.createdBy || 'system',
      createdAt: new Date().toISOString(),
      lastUsed: null,
      useCount: 0
    };

    // Validation de la requête avant sauvegarde
    await parseFilterQuery(query);

    SAVED_FILTERS.set(name, savedFilter);

    return {
      saved: true,
      name,
      description,
      version: savedFilter.version,
      savedAt: savedFilter.createdAt
    };

  } catch (error) {
    throw new Error(`FilterError: ${error.message}`);
  }
}

// Core filtering functions
async function parseFilterQuery(filterQuery) {
  const parsed = {
    conditions: [],
    logic: 'AND',
    timeRange: null,
    metadata: {}
  };

  if (filterQuery.conditions) {
    for (const condition of filterQuery.conditions) {
      const parsedCondition = await parseCondition(condition);
      parsed.conditions.push(parsedCondition);
    }
  } else {
    // Requête simple - convertir en condition
    const parsedCondition = await parseCondition(filterQuery);
    parsed.conditions.push(parsedCondition);
  }

  if (filterQuery.logic) {
    parsed.logic = filterQuery.logic.toUpperCase();
  }

  if (filterQuery.timeRange) {
    parsed.timeRange = filterQuery.timeRange;
  }

  return parsed;
}

async function parseCondition(condition) {
  if (!condition.field) {
    throw new Error('QueryError: condition.field requis');
  }

  if (!condition.operator) {
    throw new Error('QueryError: condition.operator requis');
  }

  if (!FILTER_OPERATORS[condition.operator]) {
    throw new Error(`QueryError: opérateur '${condition.operator}' non supporté`);
  }

  return {
    field: condition.field,
    operator: condition.operator,
    value: condition.value,
    negate: condition.negate || false
  };
}

async function normalizeMetricsForFiltering(metrics) {
  const normalized = [];

  for (const [name, data] of Object.entries(metrics)) {
    if (typeof data === 'number') {
      normalized.push({
        name,
        value: data,
        timestamp: new Date().toISOString(),
        type: 'gauge'
      });
    } else if (data && typeof data === 'object') {
      normalized.push({
        name,
        value: data.value || 0,
        timestamp: data.timestamp || new Date().toISOString(),
        type: data.type || 'gauge',
        labels: data.labels || {},
        ...data
      });
    }
  }

  return normalized;
}

async function applyTimeRangeFilter(metrics, timeRange) {
  if (!timeRange.start && !timeRange.end) {
    return metrics;
  }

  const startTime = timeRange.start ? new Date(timeRange.start).getTime() : 0;
  const endTime = timeRange.end ? new Date(timeRange.end).getTime() : Date.now();

  return metrics.filter(metric => {
    const metricTime = new Date(metric.timestamp).getTime();
    return metricTime >= startTime && metricTime <= endTime;
  });
}

async function applyMainFilters(metrics, parsedQuery) {
  return metrics.filter(metric => {
    return evaluateConditions(metric, parsedQuery.conditions, parsedQuery.logic);
  });
}

function evaluateConditions(metric, conditions, logic) {
  if (conditions.length === 0) return true;

  const results = conditions.map(condition => evaluateCondition(metric, condition));

  switch (logic) {
    case 'AND':
      return results.every(result => result);
    case 'OR':
      return results.some(result => result);
    case 'NOT':
      return !results.every(result => result);
    default:
      return results.every(result => result);
  }
}

function evaluateCondition(metric, condition) {
  const fieldValue = getFieldValue(metric, condition.field);
  const operator = FILTER_OPERATORS[condition.operator];
  
  let result = operator(fieldValue, condition.value);
  
  if (condition.negate) {
    result = !result;
  }
  
  return result;
}

function getFieldValue(metric, fieldPath) {
  const parts = fieldPath.split('.');
  let value = metric;
  
  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      return undefined;
    }
  }
  
  return value;
}

async function applySorting(metrics, sortBy, sortOrder = 'asc') {
  return metrics.sort((a, b) => {
    const valueA = getFieldValue(a, sortBy);
    const valueB = getFieldValue(b, sortBy);
    
    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

async function applyPagination(metrics, limit, offset = 0) {
  const start = offset || 0;
  const end = limit ? start + limit : metrics.length;
  return metrics.slice(start, end);
}

async function performAggregations(metrics, aggregations) {
  const results = {};
  
  for (const [aggName, aggConfig] of Object.entries(aggregations)) {
    results[aggName] = await performSingleAggregation(metrics, aggConfig);
  }
  
  return results;
}

async function performSingleAggregation(metrics, aggConfig) {
  const field = aggConfig.field || 'value';
  const func = aggConfig.function || 'sum';
  
  if (!AGGREGATION_FUNCTIONS[func]) {
    throw new Error(`AggregationError: fonction '${func}' non supportée`);
  }
  
  const values = metrics.map(metric => getFieldValue(metric, field))
    .filter(value => typeof value === 'number');
  
  return AGGREGATION_FUNCTIONS[func](values, aggConfig.parameter);
}

async function groupMetrics(metrics, groupBy) {
  const groups = {};
  
  for (const metric of metrics) {
    const groupValue = getFieldValue(metric, groupBy);
    const groupKey = groupValue !== undefined ? String(groupValue) : 'undefined';
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(metric);
  }
  
  return groups;
}

async function validateCondition(condition) {
  if (!condition || typeof condition !== 'object') {
    throw new Error('QueryError: condition doit être un objet');
  }
  
  if (!condition.field) {
    throw new Error('QueryError: condition.field requis');
  }
  
  if (!condition.operator) {
    throw new Error('QueryError: condition.operator requis');
  }
  
  if (!FILTER_OPERATORS[condition.operator]) {
    throw new Error(`QueryError: opérateur '${condition.operator}' invalide`);
  }
}

async function applyPostProcessing(results, postProcess) {
  // Simulation post-processing
  return results;
}

// metrics/filters : API Metrics (commit 50)
// DEPENDENCY FLOW : api/metrics/ → api/monitoring/ → api/schemas/ → engines/ → transitions/ → systems/

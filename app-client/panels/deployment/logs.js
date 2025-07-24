/**
 * COMMIT 66 - Panel Deployment
 * 
 * FAIT QUOI : Logs déploiement avec filtrage temps réel et recherche avancée
 * REÇOIT : deploymentId: string, logLevel?: string, realTime?: boolean
 * RETOURNE : { logs: object[], filters: object, search: object, streaming: object }
 * ERREURS : LogError si logs inaccessibles, FilterError si filtre invalide, StreamError si streaming échoue
 */

export async function getDeploymentLogs(deploymentId, logLevel = 'info', realTime = false) {
  if (!deploymentId || typeof deploymentId !== 'string') {
    throw new Error('LogError: DeploymentId requis string');
  }

  const validLevels = ['error', 'warn', 'info', 'debug', 'trace'];
  if (!validLevels.includes(logLevel)) {
    throw new Error(`LogError: LogLevel doit être ${validLevels.join(', ')}`);
  }

  if (typeof realTime !== 'boolean') {
    throw new Error('LogError: RealTime doit être boolean');
  }

  try {
    const logs = await fetchDeploymentLogs(deploymentId, logLevel);
    const filters = createLogFilters(logLevel);
    const search = initializeLogSearch();
    const streaming = realTime ? await initializeLogStreaming(deploymentId) : null;

    return {
      logs,
      filters,
      search,
      streaming,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`LogError: Récupération logs échouée: ${error.message}`);
  }
}

export async function filterDeploymentLogs(logs, filters, options = {}) {
  if (!Array.isArray(logs)) {
    throw new Error('LogError: Logs doit être array');
  }

  if (!filters || typeof filters !== 'object') {
    throw new Error('LogError: Filters requis object');
  }

  const caseSensitive = options.caseSensitive || false;
  const maxResults = options.maxResults || 1000;

  try {
    let filteredLogs = [...logs];

    // Filtrage par niveau
    if (filters.level && filters.level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }

    // Filtrage par période
    if (filters.timeRange) {
      const { start, end } = filters.timeRange;
      filteredLogs = filteredLogs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= new Date(start) && logTime <= new Date(end);
      });
    }

    // Filtrage par source/service
    if (filters.source) {
      filteredLogs = filteredLogs.filter(log => 
        log.source && log.source.includes(filters.source)
      );
    }

    // Filtrage par message (recherche texte)
    if (filters.message) {
      const searchTerm = caseSensitive ? filters.message : filters.message.toLowerCase();
      filteredLogs = filteredLogs.filter(log => {
        const message = caseSensitive ? log.message : log.message.toLowerCase();
        return message.includes(searchTerm);
      });
    }

    // Filtrage par tags
    if (filters.tags && Array.isArray(filters.tags)) {
      filteredLogs = filteredLogs.filter(log => 
        filters.tags.some(tag => log.tags && log.tags.includes(tag))
      );
    }

    // Limitation résultats
    if (filteredLogs.length > maxResults) {
      filteredLogs = filteredLogs.slice(0, maxResults);
    }

    return {
      filtered: true,
      logs: filteredLogs,
      originalCount: logs.length,
      filteredCount: filteredLogs.length,
      filters: filters,
      truncated: filteredLogs.length === maxResults,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`FilterError: Filtrage logs échoué: ${error.message}`);
  }
}

export async function searchDeploymentLogs(logs, query, options = {}) {
  if (!Array.isArray(logs)) {
    throw new Error('LogError: Logs doit être array');
  }

  if (!query || typeof query !== 'string') {
    throw new Error('LogError: Query requis string non vide');
  }

  const caseSensitive = options.caseSensitive || false;
  const useRegex = options.useRegex || false;
  const searchFields = options.searchFields || ['message', 'source'];

  try {
    const results = [];
    const searchTerm = caseSensitive ? query : query.toLowerCase();

    let searchPattern;
    if (useRegex) {
      try {
        searchPattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
      } catch (regexError) {
        throw new Error(`FilterError: Regex invalide: ${regexError.message}`);
      }
    }

    for (const log of logs) {
      const matches = [];
      
      for (const field of searchFields) {
        if (log[field]) {
          let fieldValue = caseSensitive ? log[field] : log[field].toLowerCase();
          let found = false;

          if (useRegex && searchPattern) {
            found = searchPattern.test(log[field]);
            if (found) {
              matches.push({
                field,
                value: log[field],
                regex: true
              });
            }
          } else {
            found = fieldValue.includes(searchTerm);
            if (found) {
              matches.push({
                field,
                value: log[field],
                position: fieldValue.indexOf(searchTerm)
              });
            }
          }
        }
      }

      if (matches.length > 0) {
        results.push({
          ...log,
          matches,
          relevance: matches.length
        });
      }
    }

    // Tri par pertinence
    results.sort((a, b) => b.relevance - a.relevance);

    return {
      searched: true,
      query,
      results,
      totalMatches: results.length,
      searchFields,
      useRegex,
      caseSensitive,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`LogError: Recherche logs échouée: ${error.message}`);
  }
}

export async function getLogsStatus(logConfig, options = {}) {
  if (!logConfig || typeof logConfig !== 'object') {
    throw new Error('LogError: LogConfig requis object');
  }

  try {
    const hasLogs = logConfig.logs && Array.isArray(logConfig.logs);
    const hasStreaming = logConfig.streaming && logConfig.streaming.enabled;
    const hasFilters = logConfig.filters && typeof logConfig.filters === 'object';

    const status = hasLogs ? 
      (logConfig.logs.length > 0 ? 'loaded' : 'empty') : 
      'unavailable';

    const streaming = hasStreaming ? 'connected' : 'disabled';

    return {
      status,
      streaming,
      logsCount: logConfig.logs?.length || 0,
      filtersActive: hasFilters ? Object.keys(logConfig.filters).filter(key => 
        logConfig.filters[key] && logConfig.filters[key] !== 'all'
      ).length : 0,
      searchEnabled: !!logConfig.search,
      lastUpdate: logConfig.timestamp || new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      streaming: 'error',
      issues: [`status_check_failed: ${error.message}`],
      lastUpdate: new Date().toISOString()
    };
  }
}

// Helper functions pour simulation
async function fetchDeploymentLogs(deploymentId, logLevel) {
  // Simulation récupération logs
  const logs = [];
  const levels = ['error', 'warn', 'info', 'debug'];
  const sources = ['deploy-service', 'build-runner', 'container-manager'];
  
  for (let i = 0; i < 50; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    if (shouldIncludeLogLevel(level, logLevel)) {
      logs.push({
        id: `log_${i}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        level,
        source: sources[Math.floor(Math.random() * sources.length)],
        message: generateLogMessage(level),
        tags: ['deployment', deploymentId],
        deploymentId
      });
    }
  }
  
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function shouldIncludeLogLevel(logLevel, minLevel) {
  const levels = ['error', 'warn', 'info', 'debug', 'trace'];
  const logIndex = levels.indexOf(logLevel);
  const minIndex = levels.indexOf(minLevel);
  return logIndex <= minIndex;
}

function generateLogMessage(level) {
  const messages = {
    error: [
      'Deployment failed: Container startup timeout',
      'Health check failed after 3 attempts',
      'Unable to connect to database'
    ],
    warn: [
      'Slow response detected: 800ms',
      'Memory usage above 80%',
      'Deprecated API endpoint used'
    ],
    info: [
      'Deployment started successfully',
      'Container image pulled',
      'Health check passed'
    ],
    debug: [
      'Processing deployment step 3/5',
      'Environment variables loaded',
      'Network configuration applied'
    ]
  };
  
  const levelMessages = messages[level] || messages.info;
  return levelMessages[Math.floor(Math.random() * levelMessages.length)];
}

function createLogFilters(defaultLevel) {
  return {
    level: defaultLevel,
    timeRange: null,
    source: null,
    message: null,
    tags: []
  };
}

function initializeLogSearch() {
  return {
    enabled: true,
    caseSensitive: false,
    useRegex: false,
    searchFields: ['message', 'source']
  };
}

async function initializeLogStreaming(deploymentId) {
  // Simulation init streaming
  return {
    enabled: true,
    deploymentId,
    connected: true,
    updateInterval: 1000
  };
}

// panels/deployment/logs : Panel Deployment (commit 66)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/

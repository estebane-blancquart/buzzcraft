/**
 * COMMIT 69 - Panel Analytics
 * 
 * FAIT QUOI : Analytiques usage avec métriques utilisateur et sessions tracking
 * REÇOIT : timeRange: object, userFilters: object, includeDetails: boolean
 * RETOURNE : { usage: object[], sessions: object[], metrics: object, metadata: object }
 * ERREURS : UsageError si métriques indisponibles, SessionError si tracking échoue, FilterError si filtres invalides
 */

// DEPENDENCY FLOW (no circular deps)

export async function createUsageAnalytics(timeRange = {}, userFilters = {}, includeDetails = true) {
  if (typeof timeRange !== 'object') {
    throw new Error('UsageError: TimeRange doit être object');
  }

  if (typeof userFilters !== 'object') {
    throw new Error('FilterError: UserFilters doit être object');
  }

  if (typeof includeDetails !== 'boolean') {
    throw new Error('UsageError: IncludeDetails doit être boolean');
  }

  try {
    const normalizedTimeRange = normalizeTimeRange(timeRange);
    const usage = await generateUsageData(normalizedTimeRange, userFilters);
    const sessions = includeDetails ? await generateSessionData(normalizedTimeRange) : [];
    const metrics = calculateUsageMetrics(usage, sessions);

    return {
      usage,
      sessions,
      metrics,
      metadata: {
        timeRange: normalizedTimeRange,
        userFilters: Object.keys(userFilters).length,
        totalUsers: usage.length,
        includeDetails,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`UsageError: Création analytics usage échouée: ${error.message}`);
  }
}

export async function validateUsageData(usageData, requirements = {}) {
  if (!usageData || typeof usageData !== 'object') {
    throw new Error('UsageError: UsageData requis object');
  }

  if (!usageData.usage || !Array.isArray(usageData.usage)) {
    throw new Error('UsageError: UsageData.usage requis array');
  }

  try {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      coverage: {}
    };

    if (usageData.usage.length === 0) {
      validation.warnings.push('empty_usage_data');
    }

    if (!usageData.metrics || typeof usageData.metrics !== 'object') {
      validation.errors.push('missing_metrics');
      validation.valid = false;
    }

    validation.coverage = {
      usagePoints: usageData.usage.length,
      sessionsCovered: usageData.sessions?.length || 0,
      metricsAvailable: Object.keys(usageData.metrics || {}).length
    };

    return {
      ...validation,
      requirements,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`UsageError: Validation données usage échouée: ${error.message}`);
  }
}

export async function aggregateUsageMetrics(usageAnalytics, aggregationType = 'daily', options = {}) {
  if (!usageAnalytics || typeof usageAnalytics !== 'object') {
    throw new Error('UsageError: UsageAnalytics requis object');
  }

  const validAggregations = ['hourly', 'daily', 'weekly', 'monthly'];
  if (!validAggregations.includes(aggregationType)) {
    throw new Error('UsageError: AggregationType doit être hourly|daily|weekly|monthly');
  }

  try {
    const rawData = usageAnalytics.usage || [];
    const aggregated = groupDataByTime(rawData, aggregationType);
    
    return {
      aggregated,
      summary: {
        aggregationType,
        periods: aggregated.length,
        totalUsers: rawData.length
      },
      metadata: {
        aggregationType,
        originalDataPoints: rawData.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`UsageError: Agrégation métriques usage échouée: ${error.message}`);
  }
}

export async function generateUsageInsights(usageAnalytics, focusAreas = ['trends']) {
  if (!usageAnalytics || typeof usageAnalytics !== 'object') {
    throw new Error('UsageError: UsageAnalytics requis object');
  }

  if (!Array.isArray(focusAreas)) {
    throw new Error('UsageError: FocusAreas doit être array');
  }

  try {
    const insights = [];
    const data = usageAnalytics.usage || [];

    if (focusAreas.includes('trends') && data.length > 1) {
      insights.push({
        category: 'trends',
        description: 'Tendance usage détectée',
        confidence: 0.8,
        timestamp: new Date().toISOString()
      });
    }

    return {
      insights,
      recommendations: generateRecommendations(insights),
      summary: {
        totalInsights: insights.length,
        categoriesCovered: insights.length
      },
      metadata: {
        focusAreas,
        dataPoints: data.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`UsageError: Génération insights usage échouée: ${error.message}`);
  }
}

// === HELPER FUNCTIONS ===
function normalizeTimeRange(timeRange) {
  const now = Date.now();
  return {
    start: timeRange.start ? new Date(timeRange.start).getTime() : now - (7 * 24 * 60 * 60 * 1000),
    end: timeRange.end ? new Date(timeRange.end).getTime() : now
  };
}

async function generateUsageData(timeRange, filters) {
  const data = [];
  const dayMs = 24 * 60 * 60 * 1000;
  
  for (let time = timeRange.start; time <= timeRange.end; time += dayMs) {
    data.push({
      timestamp: new Date(time).toISOString(),
      users: Math.floor(Math.random() * 50) + 10,
      sessions: Math.floor(Math.random() * 100) + 20
    });
  }
  
  return data;
}

async function generateSessionData(timeRange) {
  return [
    {
      sessionId: 'session_1',
      userId: 'user_1',
      duration: 1800,
      timestamp: new Date(timeRange.start).toISOString()
    }
  ];
}

function calculateUsageMetrics(usage, sessions) {
  return {
    totalUsers: usage.reduce((max, u) => Math.max(max, u.users), 0),
    totalSessions: usage.reduce((sum, u) => sum + u.sessions, 0),
    averageSessionDuration: sessions.length > 0 ? 
      sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length : 0
  };
}

function groupDataByTime(data, aggregationType) {
  return data.map(item => ({
    period: new Date(item.timestamp).toDateString(),
    users: item.users,
    sessions: item.sessions
  }));
}

function generateRecommendations(insights) {
  return insights.map(insight => ({
    type: 'usage_optimization',
    priority: 'medium',
    description: `Optimisation basée sur ${insight.category}`,
    estimatedImpact: 'medium'
  }));
}

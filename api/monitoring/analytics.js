/**
 * COMMIT 49 - API Monitoring
 * 
 * FAIT QUOI : Analytics API avec métriques usage, tendances et rapports business
 * REÇOIT : event: string, data: object, userId?: string, options?: object
 * RETOURNE : { tracked: boolean, analytics: object, insights: array, reportGenerated: boolean }
 * ERREURS : AnalyticsError si tracking échoue, DataError si données invalides, ReportError si génération rapport impossible
 */

const ANALYTICS_EVENTS = new Map();
const USER_SESSIONS = new Map();
const BUSINESS_METRICS = new Map();
const ANALYTICS_CONFIG = {
  trackingEnabled: true,
  retentionDays: 30,
  samplingRate: 1.0
};

export async function trackAPIUsage(event, data = {}, userId = null, options = {}) {
  if (!event || typeof event !== 'string') {
    throw new Error('AnalyticsError: event requis');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('DataError: data doit être un objet');
  }

  if (!ANALYTICS_CONFIG.trackingEnabled) {
    return {
      tracked: false,
      reason: 'tracking_disabled',
      trackedAt: new Date().toISOString()
    };
  }

  try {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const timestamp = new Date().toISOString();

    // Échantillonnage si configuré
    if (Math.random() > ANALYTICS_CONFIG.samplingRate) {
      return {
        tracked: false,
        reason: 'sampled_out',
        trackedAt: timestamp
      };
    }

    const eventData = {
      eventId,
      event,
      data: {
        endpoint: data.endpoint || 'unknown',
        method: data.method || 'GET',
        statusCode: data.statusCode || 200,
        responseTime: data.responseTime || 0,
        userAgent: data.userAgent || 'unknown',
        ip: data.ip || 'unknown',
        ...data
      },
      userId,
      sessionId: await getOrCreateSession(userId, data.ip),
      timestamp
    };

    ANALYTICS_EVENTS.set(eventId, eventData);

    // Mise à jour métriques business
    await updateBusinessMetrics(eventData);

    return {
      tracked: true,
      eventId,
      event,
      userId,
      trackedAt: timestamp
    };

  } catch (error) {
    throw new Error(`AnalyticsError: ${error.message}`);
  }
}

export async function generateUsageInsights(timeRange = 86400000, analysisType = 'overview') {
  const validTypes = ['overview', 'endpoints', 'users', 'performance', 'trends'];
  if (!validTypes.includes(analysisType)) {
    throw new Error(`AnalyticsError: analysisType doit être ${validTypes.join(', ')}`);
  }

  try {
    const now = Date.now();
    const cutoffTime = now - timeRange;
    const insights = [];

    const recentEvents = Array.from(ANALYTICS_EVENTS.values())
      .filter(event => new Date(event.timestamp).getTime() >= cutoffTime);

    if (analysisType === 'overview' || analysisType === 'endpoints') {
      const endpointStats = analyzeEndpointUsage(recentEvents);
      insights.push({
        type: 'endpoint_usage',
        data: endpointStats,
        insights: generateEndpointInsights(endpointStats)
      });
    }

    if (analysisType === 'overview' || analysisType === 'users') {
      const userStats = analyzeUserBehavior(recentEvents);
      insights.push({
        type: 'user_behavior',
        data: userStats,
        insights: generateUserInsights(userStats)
      });
    }

    if (analysisType === 'overview' || analysisType === 'performance') {
      const perfStats = analyzePerformancePatterns(recentEvents);
      insights.push({
        type: 'performance_patterns',
        data: perfStats,
        insights: generatePerformanceInsights(perfStats)
      });
    }

    if (analysisType === 'trends') {
      const trendStats = analyzeTrends(recentEvents);
      insights.push({
        type: 'usage_trends',
        data: trendStats,
        insights: generateTrendInsights(trendStats)
      });
    }

    return {
      generated: true,
      timeRange,
      analysisType,
      totalEvents: recentEvents.length,
      insights,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`AnalyticsError: ${error.message}`);
  }
}

export async function createBusinessReport(reportType = 'weekly', metrics = ['usage', 'performance'], options = {}) {
  const validTypes = ['daily', 'weekly', 'monthly'];
  const validMetrics = ['usage', 'performance', 'errors', 'users'];
  
  if (!validTypes.includes(reportType)) {
    throw new Error(`ReportError: reportType doit être ${validTypes.join(', ')}`);
  }

  if (!Array.isArray(metrics) || !metrics.every(m => validMetrics.includes(m))) {
    throw new Error(`ReportError: metrics doit contenir ${validMetrics.join(', ')}`);
  }

  try {
    const timeRanges = {
      'daily': 24 * 60 * 60 * 1000,
      'weekly': 7 * 24 * 60 * 60 * 1000,
      'monthly': 30 * 24 * 60 * 60 * 1000
    };

    const timeRange = timeRanges[reportType];
    const report = {
      type: reportType,
      period: {
        start: new Date(Date.now() - timeRange).toISOString(),
        end: new Date().toISOString()
      },
      metrics: {}
    };

    for (const metric of metrics) {
      switch (metric) {
        case 'usage':
          report.metrics.usage = await generateUsageMetrics(timeRange);
          break;
        case 'performance':
          report.metrics.performance = await generatePerformanceMetrics(timeRange);
          break;
        case 'errors':
          report.metrics.errors = await generateErrorMetrics(timeRange);
          break;
        case 'users':
          report.metrics.users = await generateUserMetrics(timeRange);
          break;
      }
    }

    // Calcul score global
    report.healthScore = calculateHealthScore(report.metrics);

    return {
      reportGenerated: true,
      reportType,
      metricsCount: metrics.length,
      report,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`ReportError: ${error.message}`);
  }
}

export async function configureAnalytics(config = {}, options = {}) {
  try {
    const newConfig = {
      trackingEnabled: config.trackingEnabled !== false,
      retentionDays: config.retentionDays || 30,
      samplingRate: config.samplingRate || 1.0,
      excludeEndpoints: config.excludeEndpoints || [],
      includePersonalData: config.includePersonalData || false
    };

    // Validation
    if (newConfig.samplingRate < 0 || newConfig.samplingRate > 1) {
      throw new Error('AnalyticsError: samplingRate doit être entre 0 et 1');
    }

    if (newConfig.retentionDays < 1 || newConfig.retentionDays > 365) {
      throw new Error('AnalyticsError: retentionDays doit être entre 1 et 365');
    }

    Object.assign(ANALYTICS_CONFIG, newConfig);

    return {
      configured: true,
      config: ANALYTICS_CONFIG,
      configuredAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`AnalyticsError: ${error.message}`);
  }
}

// Helper functions
async function getOrCreateSession(userId, ip) {
  const sessionKey = userId || ip;
  const session = USER_SESSIONS.get(sessionKey) || {
    sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    startedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  session.lastActivity = new Date().toISOString();
  USER_SESSIONS.set(sessionKey, session);
  
  return session.sessionId;
}

async function updateBusinessMetrics(eventData) {
  const date = eventData.timestamp.substring(0, 10); // YYYY-MM-DD
  const metrics = BUSINESS_METRICS.get(date) || {
    totalRequests: 0,
    uniqueUsers: new Set(),
    endpoints: new Map(),
    responseTimeSum: 0
  };

  metrics.totalRequests++;
  if (eventData.userId) metrics.uniqueUsers.add(eventData.userId);
  
  const endpointCount = metrics.endpoints.get(eventData.data.endpoint) || 0;
  metrics.endpoints.set(eventData.data.endpoint, endpointCount + 1);
  
  metrics.responseTimeSum += eventData.data.responseTime || 0;

  BUSINESS_METRICS.set(date, metrics);
}

function analyzeEndpointUsage(events) {
  const endpointStats = new Map();
  
  for (const event of events) {
    const endpoint = event.data.endpoint;
    const stats = endpointStats.get(endpoint) || { calls: 0, totalTime: 0, errors: 0 };
    
    stats.calls++;
    stats.totalTime += event.data.responseTime || 0;
    if (event.data.statusCode >= 400) stats.errors++;
    
    endpointStats.set(endpoint, stats);
  }

  return Array.from(endpointStats.entries()).map(([endpoint, stats]) => ({
    endpoint,
    calls: stats.calls,
    averageResponseTime: stats.calls > 0 ? stats.totalTime / stats.calls : 0,
    errorRate: stats.calls > 0 ? stats.errors / stats.calls : 0
  }));
}

function analyzeUserBehavior(events) {
  const userStats = new Map();
  
  for (const event of events) {
    if (!event.userId) continue;
    
    const stats = userStats.get(event.userId) || { requests: 0, endpoints: new Set(), sessions: new Set() };
    stats.requests++;
    stats.endpoints.add(event.data.endpoint);
    stats.sessions.add(event.sessionId);
    
    userStats.set(event.userId, stats);
  }

  return Array.from(userStats.entries()).map(([userId, stats]) => ({
    userId,
    requests: stats.requests,
    uniqueEndpoints: stats.endpoints.size,
    sessions: stats.sessions.size
  }));
}

function analyzePerformancePatterns(events) {
  const hourlyStats = new Map();
  
  for (const event of events) {
    const hour = new Date(event.timestamp).getHours();
    const stats = hourlyStats.get(hour) || { requests: 0, totalTime: 0, errors: 0 };
    
    stats.requests++;
    stats.totalTime += event.data.responseTime || 0;
    if (event.data.statusCode >= 400) stats.errors++;
    
    hourlyStats.set(hour, stats);
  }

  return Array.from(hourlyStats.entries()).map(([hour, stats]) => ({
    hour,
    requests: stats.requests,
    averageResponseTime: stats.requests > 0 ? stats.totalTime / stats.requests : 0,
    errorRate: stats.requests > 0 ? stats.errors / stats.requests : 0
  }));
}

function analyzeTrends(events) {
  return {
    totalRequests: events.length,
    uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
    peakHour: events.reduce((acc, event) => {
      const hour = new Date(event.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {})
  };
}

function generateEndpointInsights(stats) {
  const sortedByUsage = stats.sort((a, b) => b.calls - a.calls);
  return [
    `Most used endpoint: ${sortedByUsage[0]?.endpoint} (${sortedByUsage[0]?.calls} calls)`,
    `Highest error rate: ${stats.sort((a, b) => b.errorRate - a.errorRate)[0]?.endpoint}`
  ];
}

function generateUserInsights(stats) {
  return [
    `Total active users: ${stats.length}`,
    `Average requests per user: ${stats.reduce((sum, s) => sum + s.requests, 0) / stats.length || 0}`
  ];
}

function generatePerformanceInsights(stats) {
  const peakHour = stats.sort((a, b) => b.requests - a.requests)[0];
  return [
    `Peak usage hour: ${peakHour?.hour}:00 (${peakHour?.requests} requests)`,
    `Best performance hour: ${stats.sort((a, b) => a.averageResponseTime - b.averageResponseTime)[0]?.hour}:00`
  ];
}

function generateTrendInsights(trends) {
  const peakHour = Object.entries(trends.peakHour).sort((a, b) => b[1] - a[1])[0];
  return [
    `Total API calls: ${trends.totalRequests}`,
    `Peak activity: ${peakHour?.[0]}:00 (${peakHour?.[1]} requests)`
  ];
}

async function generateUsageMetrics(timeRange) {
  return { totalRequests: 1000, uniqueUsers: 50 }; // Simulation
}

async function generatePerformanceMetrics(timeRange) {
  return { averageResponseTime: 150, p95ResponseTime: 300 }; // Simulation
}

async function generateErrorMetrics(timeRange) {
  return { totalErrors: 25, errorRate: 0.025 }; // Simulation
}

async function generateUserMetrics(timeRange) {
  return { activeUsers: 50, newUsers: 10 }; // Simulation
}

function calculateHealthScore(metrics) {
  // Simulation score santé basé sur métriques
  let score = 100;
  
  if (metrics.errors?.errorRate > 0.05) score -= 20;
  if (metrics.performance?.averageResponseTime > 500) score -= 15;
  if (metrics.usage?.totalRequests < 100) score -= 10;
  
  return Math.max(0, score);
}

// monitoring/analytics : API Monitoring (commit 49)
// DEPENDENCY FLOW : api/monitoring/ → api/schemas/ → engines/ → transitions/ → systems/

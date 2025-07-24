/**
 * COMMIT 70 - Panel Help
 * 
 * FAIT QUOI : Système feedback avec collecte, analyse et amélioration continue
 * REÇOIT : feedbackType: string, content: object, metadata: object
 * RETOURNE : { feedback: object, analytics: object, suggestions: object[], actions: object }
 * ERREURS : FeedbackError si type invalide, ContentError si contenu manquant, AnalyticsError si analyse échoue
 */

export async function createFeedbackSession(feedbackType, content = {}, metadata = {}) {
  if (!feedbackType || typeof feedbackType !== 'string') {
    throw new Error('FeedbackError: FeedbackType requis string');
  }

  const validTypes = [
    'documentation', 'tutorial', 'feature', 'bug', 'ui-ux', 
    'performance', 'general', 'suggestion', 'rating'
  ];

  if (!validTypes.includes(feedbackType)) {
    throw new Error(`FeedbackError: Type "${feedbackType}" non supporté`);
  }

  const sessionId = generateFeedbackId();
  const feedback = buildFeedback(sessionId, feedbackType, content);
  const analytics = generateAnalytics(feedback);
  const suggestions = generateSuggestions(feedback);
  const actions = createActions(feedback);

  return {
    feedback,
    analytics,
    suggestions,
    actions,
    metadata: {
      sessionId,
      feedbackType,
      timestamp: new Date().toISOString()
    }
  };
}

export async function validateFeedbackContent(feedbackConfig, validationRules = {}) {
  if (!feedbackConfig || typeof feedbackConfig !== 'object') {
    throw new Error('FeedbackError: Configuration feedback requise');
  }

  const feedback = feedbackConfig.feedback;
  const content = feedback.content;
  
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
    quality: 0,
    completeness: 0
  };

  // Validation contenu requis
  const requiredFields = getRequiredFields(feedback.type);
  const missingFields = requiredFields.filter(field => !content[field] || content[field].trim().length === 0);

  if (missingFields.length > 0) {
    validation.errors.push(`missing_required_fields: ${missingFields.join(', ')}`);
    validation.valid = false;
  }

  // Validation qualité
  if (content.description) {
    const quality = analyzeQuality(content.description);
    validation.quality = quality.score;
    
    if (quality.tooShort) {
      validation.warnings.push('description_too_short');
    }
  }

  // Validation rating
  if (content.rating !== undefined) {
    if (typeof content.rating !== 'number' || content.rating < 1 || content.rating > 5) {
      validation.errors.push('invalid_rating_range');
      validation.valid = false;
    }
  }

  // Calcul complétude
  const totalFields = requiredFields.length + getOptionalFields().length;
  const providedFields = Object.keys(content).filter(key => content[key]).length;
  validation.completeness = Math.round((providedFields / totalFields) * 100);

  return {
    ...validation,
    feedbackType: feedback.type,
    timestamp: new Date().toISOString()
  };
}

export async function processFeedbackAnalytics(feedbackConfig, analyticsOptions = {}) {
  if (!feedbackConfig || typeof feedbackConfig !== 'object') {
    throw new Error('FeedbackError: Configuration feedback requise');
  }

  const feedback = feedbackConfig.feedback;
  const content = feedback.content;

  const analytics = {
    sentiment: analyzeSentiment(content.description || ''),
    topics: extractTopics(content),
    priority: calculatePriority(feedback),
    impact: assessImpact(feedback),
    actionability: evaluateActionability(content)
  };

  analytics.category = categorizeFeedback(feedback);
  analytics.overallScore = calculateOverallScore(analytics);

  return {
    analytics,
    processed: true,
    confidence: analytics.overallScore,
    metadata: {
      feedbackId: feedback.id,
      timestamp: new Date().toISOString()
    }
  };
}

export async function getFeedbackStatus(feedbackConfig) {
  if (!feedbackConfig) {
    return {
      status: 'missing',
      configured: false,
      timestamp: new Date().toISOString()
    };
  }

  const feedback = feedbackConfig.feedback;
  const analytics = feedbackConfig.analytics;

  return {
    status: feedback?.status || 'unknown',
    configured: !!feedback,
    feedback: {
      id: feedback?.id || 'unknown',
      type: feedback?.type || 'unknown',
      status: feedback?.status || 'pending'
    },
    content: {
      hasDescription: !!(feedback?.content?.description),
      hasRating: feedback?.content?.rating !== undefined,
      completeness: calculateCompleteness(feedback?.content || {}, feedback?.type)
    },
    analytics: {
      available: !!analytics,
      sentiment: analytics?.sentiment?.label || 'unknown',
      priority: analytics?.priority || 'normal'
    },
    suggestions: feedbackConfig.suggestions?.length || 0,
    actions: Object.keys(feedbackConfig.actions || {}).length,
    lastCheck: new Date().toISOString()
  };
}

// Fonctions utilitaires
function generateFeedbackId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `feedback_${timestamp}_${random}`;
}

function buildFeedback(sessionId, feedbackType, content) {
  return {
    id: sessionId,
    type: feedbackType,
    status: 'pending',
    priority: calculateInitialPriority(feedbackType, content),
    content: {
      ...content,
      wordCount: countWords(content.description || ''),
      language: detectLanguage(content.description || '')
    },
    createdTime: new Date().toISOString()
  };
}

function generateAnalytics(feedback) {
  return {
    sentiment: analyzeSentiment(feedback.content.description || ''),
    readability: calculateReadability(feedback.content.description || ''),
    keywords: extractKeywords(feedback.content.description || ''),
    urgency: assessUrgency(feedback)
  };
}

function generateSuggestions(feedback) {
  const suggestions = [];
  
  switch (feedback.type) {
    case 'bug':
      suggestions.push({
        type: 'bug_fix',
        priority: 'high',
        suggestion: 'Reproduire et corriger le bug'
      });
      break;
    case 'feature':
      suggestions.push({
        type: 'feature_development',
        priority: 'normal',
        suggestion: 'Évaluer la faisabilité technique'
      });
      break;
    case 'documentation':
      suggestions.push({
        type: 'content_improvement',
        priority: 'medium',
        suggestion: 'Améliorer la clarté de la documentation'
      });
      break;
  }

  if (feedback.content.rating && feedback.content.rating < 3) {
    suggestions.push({
      type: 'urgent_improvement',
      priority: 'critical',
      suggestion: 'Traiter en priorité (rating faible)'
    });
  }

  return suggestions;
}

function createActions(feedback) {
  const baseActions = {
    acknowledge: 'Accuser réception',
    review: 'Examiner en détail',
    assign: 'Assigner à une équipe'
  };

  const typeActions = {
    'bug': { reproduce: 'Reproduire le bug', debug: 'Déboguer' },
    'feature': { evaluate: 'Évaluer faisabilité', estimate: 'Estimer effort' },
    'documentation': { update: 'Mettre à jour', clarify: 'Clarifier' }
  };

  return { ...baseActions, ...(typeActions[feedback.type] || {}) };
}

function getRequiredFields(feedbackType) {
  const fields = {
    'bug': ['description', 'stepsToReproduce', 'expectedBehavior'],
    'feature': ['description', 'useCase', 'expectedBenefit'],
    'rating': ['rating', 'reason']
  };
  return fields[feedbackType] || ['description'];
}

function getOptionalFields() {
  return ['rating', 'category', 'attachments', 'environment'];
}

function analyzeQuality(description) {
  const words = description.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  let score = 50; // Base
  if (wordCount >= 25) score += 20;
  if (wordCount >= 50) score += 15;
  
  return {
    score: Math.min(100, score),
    wordCount,
    tooShort: wordCount < 10
  };
}

function analyzeSentiment(text) {
  const positiveWords = ['bon', 'bien', 'excellent', 'génial', 'utile'];
  const negativeWords = ['mauvais', 'mal', 'horrible', 'bug', 'problème'];
  
  const words = text.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(w => positiveWords.some(pw => w.includes(pw))).length;
  const negativeCount = words.filter(w => negativeWords.some(nw => w.includes(nw))).length;
  
  let sentiment = 'neutral';
  if (positiveCount > negativeCount) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';
  
  return {
    label: sentiment,
    score: (positiveCount - negativeCount) / words.length * 100,
    confidence: Math.abs(positiveCount - negativeCount) / words.length
  };
}

function extractTopics(content) {
  const text = (content.description || '').toLowerCase();
  const topics = [];
  
  const topicKeywords = {
    'interface': ['ui', 'interface', 'design'],
    'performance': ['lent', 'rapide', 'performance'],
    'bug': ['bug', 'erreur', 'problème']
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    const matches = keywords.filter(keyword => text.includes(keyword));
    if (matches.length > 0) {
      topics.push({ topic, confidence: matches.length / keywords.length });
    }
  }
  
  return topics;
}

function calculatePriority(feedback) {
  let priority = 'normal';
  const content = feedback.content;
  
  if (content.rating && content.rating <= 2) priority = 'high';
  if (feedback.type === 'bug' && content.description.includes('crash')) priority = 'critical';
  if (content.description && content.description.includes('urgent')) priority = 'high';
  
  return priority;
}

function assessImpact(feedback) {
  const content = feedback.content;
  let impact = 'medium';
  
  if (content.description && content.description.includes('tous les utilisateurs')) impact = 'high';
  if (feedback.type === 'bug' && content.description.includes('bloque')) impact = 'high';
  
  return impact;
}

function evaluateActionability(content) {
  let score = 50;
  
  if (content.stepsToReproduce) score += 25;
  if (content.expectedBehavior) score += 15;
  if (content.environment) score += 10;
  
  return {
    level: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
    score
  };
}

function categorizeFeedback(feedback) {
  const description = (feedback.content.description || '').toLowerCase();
  
  if (description.includes('bug') || description.includes('erreur')) return 'technical_issue';
  if (description.includes('feature') || description.includes('amélioration')) return 'enhancement';
  if (description.includes('doc') || description.includes('aide')) return 'documentation';
  
  return 'general';
}

function calculateOverallScore(analytics) {
  let score = 50;
  
  if (analytics.sentiment.label === 'positive') score += 10;
  if (analytics.sentiment.label === 'negative') score += 20;
  
  const priorityScores = { critical: 30, high: 20, normal: 10, low: 0 };
  score += priorityScores[analytics.priority] || 0;
  
  return Math.min(100, Math.max(0, score));
}

function calculateInitialPriority(feedbackType, content) {
  const priorities = {
    'bug': 'high',
    'performance': 'high',
    'feature': 'normal',
    'general': 'low'
  };
  
  let priority = priorities[feedbackType] || 'normal';
  if (content.rating && content.rating <= 2) priority = 'high';
  
  return priority;
}

function countWords(text) {
  return (text || '').split(/\s+/).filter(w => w.length > 0).length;
}

function detectLanguage(text) {
  const frenchWords = ['le', 'la', 'les', 'et', 'ou', 'mais'];
  const englishWords = ['the', 'and', 'or', 'but'];
  
  const words = (text || '').toLowerCase().split(/\s+/);
  const frenchCount = words.filter(w => frenchWords.includes(w)).length;
  const englishCount = words.filter(w => englishWords.includes(w)).length;
  
  return frenchCount > englishCount ? 'fr' : 'en';
}

function calculateReadability(text) {
  const words = (text || '').split(/\s+/).filter(w => w.length > 0);
  const sentences = (text || '').split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (words.length === 0 || sentences.length === 0) {
    return { score: 0, level: 'unreadable' };
  }
  
  const avgWordsPerSentence = words.length / sentences.length;
  const score = Math.max(0, 100 - (avgWordsPerSentence * 3));
  
  return {
    score: Math.round(score),
    level: score >= 70 ? 'easy' : score >= 50 ? 'medium' : 'difficult'
  };
}

function extractKeywords(text) {
  const stopWords = ['le', 'la', 'les', 'et', 'ou', 'mais'];
  return (text || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 5); // Top 5 keywords
}

function assessUrgency(feedback) {
  const urgentKeywords = ['urgent', 'critique', 'bloquant', 'crash'];
  const description = (feedback.content.description || '').toLowerCase();
  
  const hasUrgent = urgentKeywords.some(keyword => description.includes(keyword));
  if (hasUrgent) return 'high';
  if (feedback.content.rating && feedback.content.rating <= 2) return 'medium';
  
  return 'low';
}

function calculateCompleteness(content, feedbackType) {
  const requiredFields = getRequiredFields(feedbackType);
  const optionalFields = getOptionalFields();
  const totalFields = requiredFields.length + optionalFields.length;
  
  const providedFields = Object.keys(content).filter(key => 
    content[key] && content[key].toString().trim().length > 0
  ).length;
  
  return Math.round((providedFields / totalFields) * 100);
}

// panels/help/feedback : Panel Help (commit 70)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
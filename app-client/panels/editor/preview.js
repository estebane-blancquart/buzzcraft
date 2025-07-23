/**
 * COMMIT 63 - Panel Editor
 * 
 * FAIT QUOI : Preview temps réel avec responsive et simulation interactions
 * REÇOIT : previewConfig: object, content: object, viewport?: object, options?: object
 * RETOURNE : { preview: object, viewport: object, simulation: object, performance: object }
 * ERREURS : PreviewError si preview impossible, ViewportError si viewport invalide, SimulationError si simulation échoue, RenderError si rendu échoue
 */

export async function initializePreview(previewConfig, content = {}) {
  if (!previewConfig || typeof previewConfig !== 'object') {
    throw new Error('PreviewError: Configuration preview requise');
  }

  const viewportPresets = {
    'mobile': { width: 375, height: 667, device: 'iPhone SE' },
    'tablet': { width: 768, height: 1024, device: 'iPad' },
    'desktop': { width: 1440, height: 900, device: 'Desktop HD' },
    'mobile-landscape': { width: 667, height: 375, device: 'iPhone SE Landscape' },
    'tablet-landscape': { width: 1024, height: 768, device: 'iPad Landscape' },
    'wide': { width: 1920, height: 1080, device: 'Desktop Full HD' }
  };

  const defaultViewport = previewConfig.defaultViewport || 'desktop';
  const viewport = {
    current: defaultViewport,
    dimensions: viewportPresets[defaultViewport],
    presets: viewportPresets,
    zoom: previewConfig.zoom || 100,
    orientation: previewConfig.orientation || 'portrait'
  };

  const simulation = {
    interactions: {
      enabled: previewConfig.enableInteractions !== false,
      hover: true,
      click: true,
      scroll: true,
      keyboard: true
    },
    network: {
      enabled: previewConfig.simulateNetwork || false,
      connection: previewConfig.connectionType || '4g',
      speed: {
        '3g': { download: 1.6, upload: 0.75, latency: 300 },
        '4g': { download: 12, upload: 12, latency: 170 },
        'wifi': { download: 50, upload: 50, latency: 10 }
      }
    },
    responsive: {
      enabled: previewConfig.enableResponsive !== false,
      breakpoints: {
        mobile: 576,
        tablet: 768,
        desktop: 992,
        wide: 1200
      }
    }
  };

  const preview = {
    id: `preview-${Date.now()}`,
    config: previewConfig,
    content: content,
    viewport: viewport,
    simulation: simulation,
    status: 'initializing',
    rendering: {
      inProgress: false,
      lastRender: null,
      renderTime: 0,
      errors: []
    },
    cache: {
      enabled: previewConfig.enableCache !== false,
      entries: new Map(),
      maxSize: previewConfig.cacheSize || 50
    },
    performance: {
      fps: 0,
      memoryUsage: 0,
      renderCount: 0,
      lastUpdate: new Date().toISOString()
    }
  };

  return {
    preview: preview,
    viewport: viewport,
    simulation: simulation,
    performance: preview.performance,
    timestamp: new Date().toISOString()
  };
}

export async function validatePreviewContent(content) {
  const validation = {
    valid: true,
    renderable: true,
    issues: [],
    warnings: [],
    timestamp: new Date().toISOString()
  };

  // Validation structure contenu
  if (!content) {
    validation.issues.push('Contenu preview vide');
    validation.valid = false;
    validation.renderable = false;
    return validation;
  }

  // Validation HTML si présent
  if (content.html) {
    if (typeof content.html !== 'string') {
      validation.issues.push('HTML doit être une chaîne');
      validation.valid = false;
    } else if (content.html.length > 1000000) { // 1MB
      validation.warnings.push('Contenu HTML très volumineux');
    }
  }

  // Validation CSS si présent
  if (content.css) {
    if (typeof content.css !== 'string') {
      validation.issues.push('CSS doit être une chaîne');
      validation.valid = false;
    } else {
      // Vérification syntaxe CSS basique
      const openBraces = (content.css.match(/{/g) || []).length;
      const closeBraces = (content.css.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        validation.warnings.push('CSS: accolades potentiellement non équilibrées');
      }
    }
  }

  // Validation JavaScript si présent
  if (content.javascript) {
    if (typeof content.javascript !== 'string') {
      validation.issues.push('JavaScript doit être une chaîne');
      validation.valid = false;
    } else if (content.javascript.includes('eval(')) {
      validation.warnings.push('JavaScript: utilisation d\'eval() détectée');
    }
  }

  // Validation assets
  if (content.assets && Array.isArray(content.assets)) {
    for (const asset of content.assets) {
      if (!asset.src || !asset.type) {
        validation.warnings.push(`Asset incomplet: ${asset.name || 'unnamed'}`);
      }
    }
  }

  return validation;
}

export async function updatePreviewViewport(preview, viewportName) {
  if (!preview?.viewport) {
    throw new Error('ViewportError: Configuration viewport manquante');
  }

  const newViewport = preview.viewport.presets[viewportName];
  if (!newViewport) {
    throw new Error('ViewportError: Viewport inexistant');
  }

  // Sauvegarde viewport précédent
  const previousViewport = {
    name: preview.viewport.current,
    dimensions: { ...preview.viewport.dimensions }
  };

  // Application nouveau viewport
  preview.viewport.current = viewportName;
  preview.viewport.dimensions = { ...newViewport };
  preview.performance.lastUpdate = new Date().toISOString();

  // Simulation responsive
  const isResponsive = preview.simulation.responsive.enabled;
  const breakpoint = getBreakpointFromWidth(newViewport.width, preview.simulation.responsive.breakpoints);

  return {
    updated: true,
    viewport: {
      name: viewportName,
      dimensions: newViewport,
      breakpoint: breakpoint
    },
    previous: previousViewport,
    responsive: {
      enabled: isResponsive,
      activeBreakpoint: breakpoint
    },
    timestamp: new Date().toISOString()
  };
}

export async function getPreviewPerformance(preview) {
  if (!preview) {
    return {
      performance: 'unknown',
      metrics: {},
      timestamp: new Date().toISOString()
    };
  }

  const metrics = {
    rendering: {
      fps: preview.performance.fps || 0,
      renderTime: preview.rendering.renderTime || 0,
      renderCount: preview.performance.renderCount || 0
    },
    memory: {
      usage: preview.performance.memoryUsage || 0,
      cacheSize: preview.cache?.entries?.size || 0,
      maxCacheSize: preview.config?.cacheSize || 50
    },
    content: {
      htmlSize: preview.content?.html?.length || 0,
      cssSize: preview.content?.css?.length || 0,
      jsSize: preview.content?.javascript?.length || 0,
      assetsCount: preview.content?.assets?.length || 0
    },
    viewport: {
      current: preview.viewport?.current || 'unknown',
      dimensions: `${preview.viewport?.dimensions?.width || 0}x${preview.viewport?.dimensions?.height || 0}`,
      zoom: preview.viewport?.zoom || 100
    }
  };

  // Analyse performance
  const performance = {
    rendering: metrics.rendering.fps > 50 ? 'excellent' : 
              metrics.rendering.fps > 30 ? 'good' : 
              metrics.rendering.fps > 15 ? 'acceptable' : 'poor',
    memory: metrics.memory.usage < 50 ? 'good' : 
            metrics.memory.usage < 80 ? 'acceptable' : 'poor',
    content: metrics.content.htmlSize < 100000 ? 'optimized' : 'large'
  };

  const overallScore = Object.values(performance).filter(score => 
    ['excellent', 'good', 'optimized'].includes(score)
  ).length / Object.keys(performance).length * 100;

  return {
    performance: overallScore > 80 ? 'excellent' : 
                overallScore > 60 ? 'good' : 
                overallScore > 40 ? 'acceptable' : 'poor',
    metrics: metrics,
    analysis: performance,
    score: Math.round(overallScore),
    recommendations: generatePerformanceRecommendations(metrics, performance),
    timestamp: new Date().toISOString()
  };
}

// Fonctions utilitaires
function getBreakpointFromWidth(width, breakpoints) {
  if (width >= breakpoints.wide) return 'wide';
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}

function generatePerformanceRecommendations(metrics, performance) {
  const recommendations = [];

  if (performance.rendering === 'poor') {
    recommendations.push('Optimiser le rendu - réduire la complexité visuelle');
  }

  if (performance.memory === 'poor') {
    recommendations.push('Réduire l\'utilisation mémoire - vider le cache');
  }

  if (performance.content === 'large') {
    recommendations.push('Optimiser le contenu - compresser CSS/JS');
  }

  if (metrics.content.assetsCount > 20) {
    recommendations.push('Réduire le nombre d\'assets');
  }

  return recommendations;
}

// panels/editor/preview : Panel Editor (commit 63)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/

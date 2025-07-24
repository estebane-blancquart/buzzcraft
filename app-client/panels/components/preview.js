/**
 * COMMIT 68 - Panel Components
 * 
 * FAIT QUOI : Prévisualisation temps réel avec viewport et interactions simulées
 * REÇOIT : component: object, viewportSize: string, interactionMode: boolean
 * RETOURNE : { preview: ReactComponent, viewport: object, interactions: object[], metadata: object }
 * ERREURS : PreviewError si rendu impossible, ViewportError si taille invalide, InteractionError si simulation échoue
 */

// DEPENDENCY FLOW (no circular deps)

export async function createComponentPreview(component, viewportSize = 'desktop', interactionMode = true) {
  if (!component || typeof component !== 'object') {
    throw new Error('PreviewError: Component requis object');
  }

  if (!component.id) {
    throw new Error('PreviewError: Component ID requis');
  }

  const validViewports = ['mobile', 'tablet', 'desktop', 'wide'];
  if (!validViewports.includes(viewportSize)) {
    throw new Error('ViewportError: ViewportSize doit être mobile|tablet|desktop|wide');
  }

  if (typeof interactionMode !== 'boolean') {
    throw new Error('PreviewError: InteractionMode doit être boolean');
  }

  try {
    const viewport = getViewportConfig(viewportSize);
    const renderConfig = await buildRenderConfig(component, viewport);
    const interactions = interactionMode ? await initializeInteractions(component) : [];

    const preview = {
      componentId: component.id,
      rendered: await renderComponentPreview(component, renderConfig),
      viewport: viewportSize,
      interactions: interactions.length,
      timestamp: new Date().toISOString()
    };

    return {
      preview,
      viewport,
      interactions,
      metadata: {
        renderTime: Date.now(),
        viewportSize,
        interactionMode,
        componentVersion: component.version || '1.0.0',
        timestamp: new Date().toISOString() // FIX: ajout timestamp manquant
      }
    };
  } catch (error) {
    throw new Error(`PreviewError: Création preview échouée: ${error.message}`);
  }
}

export async function updatePreviewViewport(currentPreview, newViewportSize, responsive = true) {
  if (!currentPreview || typeof currentPreview !== 'object') {
    throw new Error('PreviewError: CurrentPreview requis object');
  }

  const validViewports = ['mobile', 'tablet', 'desktop', 'wide'];
  if (!validViewports.includes(newViewportSize)) {
    throw new Error('ViewportError: NewViewportSize doit être mobile|tablet|desktop|wide');
  }

  if (typeof responsive !== 'boolean') {
    throw new Error('PreviewError: Responsive doit être boolean');
  }

  try {
    const newViewport = getViewportConfig(newViewportSize);
    const currentComponent = await getComponentFromPreview(currentPreview);
    
    // Recalcul du rendu avec nouveau viewport
    const renderConfig = await buildRenderConfig(currentComponent, newViewport);
    const newRendered = await renderComponentPreview(currentComponent, renderConfig);

    // Animation de transition si responsive activé
    const transition = responsive ? await createViewportTransition(
      currentPreview.viewport,
      newViewport,
      200 // duration ms
    ) : null;

    const updatedPreview = {
      ...currentPreview.preview,
      rendered: newRendered,
      viewport: newViewportSize,
      transition,
      lastViewportUpdate: new Date().toISOString()
    };

    return {
      preview: updatedPreview,
      viewport: newViewport,
      transition,
      metadata: {
        previousViewport: currentPreview.viewport.size || 'unknown',
        newViewport: newViewportSize,
        responsive,
        transitionDuration: transition?.duration || 0,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`PreviewError: Mise à jour viewport échouée: ${error.message}`);
  }
}

export async function simulateComponentInteractions(preview, interactions, duration = 5000) {
  if (!preview || typeof preview !== 'object') {
    throw new Error('PreviewError: Preview requis object');
  }

  if (!Array.isArray(interactions)) {
    throw new Error('InteractionError: Interactions doit être array');
  }

  if (typeof duration !== 'number' || duration <= 0) {
    throw new Error('InteractionError: Duration doit être number positif');
  }

  try {
    const component = await getComponentFromPreview(preview);
    const simulationSteps = [];
    let currentTime = 0;

    for (const interaction of interactions) {
      const step = await createInteractionStep(
        component,
        interaction,
        currentTime
      );
      
      simulationSteps.push(step);
      currentTime += step.duration || 1000;
      
      if (currentTime >= duration) break;
    }

    const simulation = {
      componentId: component.id,
      steps: simulationSteps,
      totalDuration: Math.min(currentTime, duration),
      status: 'ready'
    };

    // Exécution simulation
    const results = await executeSimulation(simulation, preview);

    return {
      simulation,
      results,
      interactions: simulationSteps.length,
      metadata: {
        componentId: component.id,
        requestedDuration: duration,
        actualDuration: simulation.totalDuration,
        interactionsSimulated: simulationSteps.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`InteractionError: Simulation interactions échouée: ${error.message}`);
  }
}

export async function capturePreviewSnapshot(preview, options = {}) {
  if (!preview || typeof preview !== 'object') {
    throw new Error('PreviewError: Preview requis object');
  }

  const format = options.format || 'png';
  const quality = options.quality || 0.9;
  const includeStyles = options.includeStyles !== false;

  if (!['png', 'jpg', 'webp'].includes(format)) {
    throw new Error('PreviewError: Format doit être png|jpg|webp');
  }

  if (typeof quality !== 'number' || quality < 0 || quality > 1) {
    throw new Error('PreviewError: Quality doit être entre 0 et 1');
  }

  try {
    const component = await getComponentFromPreview(preview);
    const viewport = preview.viewport || getViewportConfig('desktop');

    // Capture du rendu actuel
    const snapshot = await captureRenderedComponent(
      preview.preview.rendered,
      viewport,
      { format, quality, includeStyles }
    );

    // Métadonnées de capture
    const metadata = {
      componentId: component.id,
      viewport: viewport.size || 'desktop',
      dimensions: {
        width: viewport.width,
        height: viewport.height
      },
      format,
      quality,
      includeStyles,
      size: snapshot.size,
      timestamp: new Date().toISOString()
    };

    return {
      snapshot,
      metadata,
      preview: {
        componentId: component.id,
        captured: true,
        format
      }
    };
  } catch (error) {
    throw new Error(`PreviewError: Capture snapshot échouée: ${error.message}`);
  }
}

// === HELPER FUNCTIONS ===
function getViewportConfig(size) {
  const configs = {
    mobile: { width: 375, height: 667, size: 'mobile' },
    tablet: { width: 768, height: 1024, size: 'tablet' },
    desktop: { width: 1200, height: 800, size: 'desktop' },
    wide: { width: 1920, height: 1080, size: 'wide' }
  };
  return configs[size] || configs.desktop;
}

async function buildRenderConfig(component, viewport) {
  return {
    component,
    viewport,
    styles: await extractComponentStyles(component),
    props: component.defaultProps || {},
    timestamp: new Date().toISOString()
  };
}

async function renderComponentPreview(component, config) {
  // Mock rendering - retourne HTML simulé
  return `<div class="component-preview" data-component="${component.id}" style="width: ${config.viewport.width}px; height: ${config.viewport.height}px;">
    <h3>${component.name}</h3>
    <p>Preview rendered at ${config.timestamp}</p>
  </div>`;
}

async function initializeInteractions(component) {
  // Interactions simulées basées sur le type de composant
  const baseInteractions = ['click', 'hover', 'focus'];
  return baseInteractions.map(type => ({
    type,
    target: component.id,
    duration: 1000
  }));
}

async function getComponentFromPreview(preview) {
  // Mock - récupère le composant depuis le preview
  return {
    id: preview.preview?.componentId || 'unknown',
    name: 'Mock Component',
    version: '1.0.0'
  };
}

async function createViewportTransition(oldViewport, newViewport, duration) {
  return {
    from: oldViewport,
    to: newViewport,
    duration,
    easing: 'ease-in-out'
  };
}

async function createInteractionStep(component, interaction, startTime) {
  return {
    component: component.id,
    interaction: interaction.type,
    startTime,
    duration: interaction.duration || 1000,
    target: interaction.target || component.id
  };
}

async function executeSimulation(simulation, preview) {
  // Mock execution
  return {
    executed: simulation.steps.length,
    duration: simulation.totalDuration,
    success: true
  };
}

async function extractComponentStyles(component) {
  return component.styles || {};
}

async function captureRenderedComponent(rendered, viewport, options) {
  // Mock capture
  return {
    data: `data:image/${options.format};base64,mock_image_data`,
    size: 1024,
    format: options.format
  };
}

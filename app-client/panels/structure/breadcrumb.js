/**
 * COMMIT 64 - Panel Structure
 * 
 * FAIT QUOI : Fil d'Ariane navigation avec historique et actions contextuelles
 * REÇOIT : currentPath: string[], navigationHistory?: object[], actions?: object
 * RETOURNE : { breadcrumb: object[], navigation: object, history: object[], actions: object }
 * ERREURS : BreadcrumbError si chemin invalide, NavigationError si historique corrompu, ActionError si actions indisponibles
 */

export async function createStructureBreadcrumb(currentPath, navigationHistory = [], actions = {}) {
  if (!Array.isArray(currentPath)) {
    throw new Error('BreadcrumbError: CurrentPath doit être array');
  }

  if (!Array.isArray(navigationHistory)) {
    throw new Error('BreadcrumbError: NavigationHistory doit être array');
  }

  if (typeof actions !== 'object') {
    throw new Error('BreadcrumbError: Actions doit être object');
  }

  try {
    const breadcrumb = await buildBreadcrumbPath(currentPath);
    
    const navigation = {
      current: currentPath.join('/') || '/',
      depth: currentPath.length,
      navigable: true,
      interactive: true
    };

    const history = navigationHistory.slice(-10); // Garder 10 derniers

    const defaultActions = {
      navigate: true,
      copy: true,
      bookmark: true,
      share: false,
      ...actions
    };

    return {
      breadcrumb,
      navigation,
      history,
      actions: defaultActions,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`BreadcrumbError: Création breadcrumb échouée: ${error.message}`);
  }
}

export async function validateBreadcrumbPath(breadcrumb, currentPath) {
  if (!breadcrumb || typeof breadcrumb !== 'object') {
    throw new Error('BreadcrumbError: Breadcrumb requis object');
  }

  if (!Array.isArray(currentPath)) {
    throw new Error('BreadcrumbError: CurrentPath doit être array');
  }

  try {
    const issues = [];

    // Validation structure breadcrumb
    if (!Array.isArray(breadcrumb.breadcrumb)) {
      issues.push('invalid_breadcrumb_format');
    }

    if (!breadcrumb.navigation || typeof breadcrumb.navigation !== 'object') {
      issues.push('missing_navigation_object');
    }

    // Validation cohérence chemin - FIX: Logique corrigée
    if (breadcrumb.breadcrumb && Array.isArray(breadcrumb.breadcrumb)) {
      // Filtrer les segments non-vides (ignore root)
      const breadcrumbSegments = breadcrumb.breadcrumb
        .filter(item => item.segment !== '')
        .map(item => item.segment);
      
      // Comparer avec currentPath
      const pathMismatch = !arraysEqual(breadcrumbSegments, currentPath);
      
      if (pathMismatch) {
        issues.push('breadcrumb_path_mismatch');
      }
    }

    // Validation navigation
    if (breadcrumb.navigation) {
      const expectedCurrent = currentPath.length > 0 ? currentPath.join('/') : '/';
      if (breadcrumb.navigation.current !== expectedCurrent) {
        issues.push('navigation_current_mismatch');
      }

      if (breadcrumb.navigation.depth !== currentPath.length) {
        issues.push('navigation_depth_mismatch');
      }
    }

    return {
      valid: issues.length === 0,
      breadcrumbItems: breadcrumb.breadcrumb?.length || 0,
      pathDepth: currentPath.length,
      historyItems: breadcrumb.history?.length || 0,
      issues,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`BreadcrumbError: Validation chemin échouée: ${error.message}`);
  }
}

export async function navigateBreadcrumbPath(breadcrumb, targetIndex, options = {}) {
  if (!breadcrumb || typeof breadcrumb !== 'object') {
    throw new Error('BreadcrumbError: Breadcrumb requis object');
  }

  if (typeof targetIndex !== 'number' || targetIndex < 0) {
    throw new Error('BreadcrumbError: TargetIndex doit être number >= 0');
  }

  const updateHistory = options.updateHistory !== false;
  const validateTarget = options.validateTarget !== false;

  try {
    const breadcrumbItems = breadcrumb.breadcrumb || [];
    
    if (targetIndex >= breadcrumbItems.length) {
      throw new Error('BreadcrumbError: TargetIndex hors limites');
    }

    const targetItem = breadcrumbItems[targetIndex];
    
    if (validateTarget && !targetItem.navigable) {
      throw new Error('BreadcrumbError: Item cible non navigable');
    }

    // Simulation navigation - FIX: Logique corrigée
    const targetPath = targetItem.segment === '' ? [] : 
                      breadcrumbItems.slice(1, targetIndex + 1).map(item => item.segment);
    
    const currentItem = breadcrumb.navigation?.current || '/';

    // Mise à jour historique
    const newHistory = updateHistory ? 
      [...breadcrumb.history, { 
        from: currentItem, 
        to: targetPath.length > 0 ? targetPath.join('/') : '/', 
        timestamp: new Date().toISOString() 
      }] :
      breadcrumb.history;

    return {
      navigated: true,
      targetPath,
      targetItem,
      previousPath: currentItem,
      history: newHistory.slice(-10), // Garder 10 derniers
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`NavigationError: Navigation breadcrumb échouée: ${error.message}`);
  }
}

export async function getBreadcrumbStatus(breadcrumb, options = {}) {
  if (!breadcrumb || typeof breadcrumb !== 'object') {
    throw new Error('BreadcrumbError: Breadcrumb requis object');
  }

  try {
    const hasItems = breadcrumb.breadcrumb && breadcrumb.breadcrumb.length > 0;
    const hasNavigation = breadcrumb.navigation && typeof breadcrumb.navigation === 'object';
    
    const status = hasItems && hasNavigation ? 'ready' : 
                  hasNavigation ? 'empty' : 'invalid';

    const navigable = hasItems && breadcrumb.navigation?.navigable;

    return {
      status,
      navigable,
      items: breadcrumb.breadcrumb?.length || 0,
      depth: breadcrumb.navigation?.depth || 0,
      currentPath: breadcrumb.navigation?.current || '/',
      historySize: breadcrumb.history?.length || 0,
      interactive: breadcrumb.navigation?.interactive || false,
      lastUpdate: breadcrumb.timestamp || new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      navigable: false,
      issues: [`status_check_failed: ${error.message}`],
      lastUpdate: new Date().toISOString()
    };
  }
}

// Helper functions pour simulation
async function buildBreadcrumbPath(currentPath) {
  // Simulation construction breadcrumb - FIX: Logique corrigée
  const breadcrumb = [];

  // Toujours ajouter root en premier
  breadcrumb.push({
    segment: '',
    label: 'Root',
    path: '/',
    index: -1,
    navigable: true,
    current: currentPath.length === 0
  });

  // Ajouter chaque segment du chemin
  let cumulativePath = '';
  for (let i = 0; i < currentPath.length; i++) {
    const segment = currentPath[i];
    cumulativePath += (cumulativePath ? '/' : '') + segment;
    
    breadcrumb.push({
      segment,
      label: capitalizeSegment(segment),
      path: cumulativePath,
      index: i,
      navigable: true,
      current: i === currentPath.length - 1
    });
  }

  return breadcrumb;
}

function capitalizeSegment(segment) {
  // Simulation formatage label
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/[-_]/g, ' ');
}

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val === arr2[index]);
}

// panels/structure/breadcrumb : Panel Structure (commit 64)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/

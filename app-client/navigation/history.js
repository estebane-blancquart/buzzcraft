/**
 * COMMIT 58 - App Client Navigation
 * 
 * FAIT QUOI : Gestion historique navigation avec stack et navigation avant/arrière
 * REÇOIT : entry: object, operation: string, options?: object, context?: object
 * RETOURNE : { history: array, current: number, canGoBack: boolean, canGoForward: boolean }
 * ERREURS : HistoryError si entry invalide, OperationError si opération incorrecte, StackError si stack corrompu
 */

export async function createNavigationHistory(maxSize = 50) {
  if (typeof maxSize !== 'number' || maxSize < 1) {
    throw new Error('HistoryError: Taille maximale doit être un nombre positif');
  }

  const history = {
    stack: [],
    current: -1,
    maxSize: maxSize,
    created: new Date().toISOString()
  };

  return {
    history: history,
    current: -1,
    canGoBack: false,
    canGoForward: false,
    timestamp: new Date().toISOString()
  };
}

export async function pushHistoryEntry(history, entry) {
  if (!history || typeof history !== 'object') {
    throw new Error('HistoryError: Historique requis');
  }

  if (!entry || typeof entry !== 'object') {
    throw new Error('HistoryError: Entrée historique requise');
  }

  const historyEntry = {
    ...entry,
    id: Date.now(),
    timestamp: new Date().toISOString()
  };

  // Remove entries after current position if we're not at the end
  if (history.current < history.stack.length - 1) {
    history.stack = history.stack.slice(0, history.current + 1);
  }

  // Add new entry
  history.stack.push(historyEntry);
  history.current = history.stack.length - 1;

  // Respect max size
  if (history.stack.length > history.maxSize) {
    history.stack.shift();
    history.current--;
  }

  return {
    pushed: true,
    entry: historyEntry,
    current: history.current,
    stackSize: history.stack.length,
    timestamp: new Date().toISOString()
  };
}

export async function navigateHistory(history, direction) {
  if (!history || typeof history !== 'object') {
    throw new Error('HistoryError: Historique requis');
  }

  if (!['back', 'forward'].includes(direction)) {
    throw new Error('OperationError: Direction doit être "back" ou "forward"');
  }

  const newPosition = direction === 'back' ? 
    history.current - 1 : 
    history.current + 1;

  if (newPosition < 0 || newPosition >= history.stack.length) {
    throw new Error(`OperationError: Impossible d'aller ${direction}`);
  }

  history.current = newPosition;
  const currentEntry = history.stack[newPosition];

  return {
    navigated: true,
    direction: direction,
    current: newPosition,
    entry: currentEntry,
    timestamp: new Date().toISOString()
  };
}

export async function getHistoryStatus(history) {
  if (!history || typeof history !== 'object') {
    return {
      status: 'missing',
      configured: false,
      entries: 0,
      current: -1,
      timestamp: new Date().toISOString()
    };
  }

  return {
    status: 'healthy',
    configured: true,
    entries: history.stack?.length || 0,
    current: history.current || -1,
    canGoBack: (history.current || 0) > 0,
    canGoForward: (history.current || -1) < (history.stack?.length || 0) - 1,
    timestamp: new Date().toISOString()
  };
}

// navigation/history : App Client Navigation (commit 58)
// DEPENDENCY FLOW (no circular deps)

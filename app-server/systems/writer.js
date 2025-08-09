/*
 * [MOCK] FAIT QUOI : Écrit contenu dans fichier et crée dossiers parents
 * REÇOIT : path: string, data: string|object, options: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function writePath(path, data, options = {}) {
  console.log(`[MOCK] writePath called with: ${path}`);
  
  if (!path || typeof path !== 'string' || data === undefined) {
    throw new Error('ValidationError: path must be non-empty string and data required');
  }
  
  return { 
    success: true, 
    data: { 
      written: true, 
      path, 
      size: 100 
    } 
  };
}
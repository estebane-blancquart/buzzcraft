/*
 * [MOCK] FAIT QUOI : Analyse existence et lit contenu d'un chemin
 * REÇOIT : path: string, options: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si path manquant
 */

export async function readPath(path, options = {}) {
  console.log(`[MOCK] readPath called with: ${path}`);
  
  if (!path || typeof path !== 'string') {
    throw new Error('ValidationError: path must be non-empty string');
  }
  
  return { 
    success: true, 
    data: { 
      exists: true, 
      type: 'file',
      content: '[MOCK] file content'
    } 
  };
}
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

/*
 * FAIT QUOI : Écrit contenu dans fichier et crée dossiers parents
 * REÇOIT : path: string, data: string|object, options: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function writePath(path, data, options = {}) {
  if (!path || typeof path !== 'string' || data === undefined) {
    throw new Error('ValidationError: path must be non-empty string and data required');
  }
  
  try {
    const parentDir = dirname(path);
    await mkdir(parentDir, { recursive: true });
    
    let content;
    if (typeof data === 'object') {
      content = JSON.stringify(data, null, options.indent || 2);
    } else {
      content = String(data);
    }
    
    await writeFile(path, content, options.encoding || 'utf8');
    
    return { 
      success: true, 
      data: { written: true, path, size: content.length } 
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}
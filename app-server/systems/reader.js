import { access, lstat, readFile } from 'fs/promises';

/*
 * FAIT QUOI : Analyse existence et lit contenu d'un chemin
 * REÇOIT : path: string, options: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si path manquant
 */

export async function readPath(path, options = {}) {
  if (!path || typeof path !== 'string') {
    throw new Error('ValidationError: path must be non-empty string');
  }
  
  try {
    await access(path);
    
    const stats = await lstat(path);
    const type = stats.isFile() ? 'file' : stats.isDirectory() ? 'directory' : 'other';
    
    const data = { exists: true, type };
    
    if (type === 'file') {
      data.content = await readFile(path, options.encoding || 'utf8');
    }
    
    return { success: true, data };
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: true, data: { exists: false, type: null } };
    }
    return { success: false, error: error.message };
  }
}
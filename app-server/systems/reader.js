import { access, lstat, readFile } from 'fs/promises';

/*
 * FAIT QUOI : Vérifie existence et lit contenu d'un chemin (fichier ou dossier)
 * REÇOIT : path: string
 * RETOURNE : { exists: boolean, type: string|null, content?: string }
 * ERREURS : ValidationError si path manquant
 */

export async function readPath(path) {
  // Validation
  if (!path) {
    throw new Error('ValidationError: path required');
  }
  
  try {
    // Vérifier existence
    await access(path);
    
    // Détecter type
    const stats = await lstat(path);
    const type = stats.isFile() ? 'file' : stats.isDirectory() ? 'directory' : 'other';
    
    const result = {
      exists: true,
      type: type
    };
    
    // Lire contenu si c'est un fichier
    if (type === 'file') {
      result.content = await readFile(path, 'utf8');
    }
    
    return result;
  } catch (error) {
    return {
      exists: false,
      type: null
    };
  }
}
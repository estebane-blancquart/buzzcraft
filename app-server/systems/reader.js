import { access, lstat } from 'fs/promises';

/**
 * FAIT QUOI : Vérifie existence et lit contenu d'un chemin (fichier ou dossier)
 * REÇOIT : path: string
 * RETOURNE : { exists: boolean, type: string|null }
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
    
    return {
      exists: true,
      type: type
    };
  } catch (error) {
    // Si access() échoue = fichier n'existe pas
    return {
      exists: false,
      type: null
    };
  }
}
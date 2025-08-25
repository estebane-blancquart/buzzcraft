import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

/*
 * FAIT QUOI : Écrit contenu dans fichier et crée dossiers parents
 * REÇOIT : path: string, data: string|object, options: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function writePath(path, data, options = {}) {
  console.log(`[REAL] writePath called with: ${path}`);
  
  if (!path || typeof path !== 'string' || data === undefined) {
    throw new Error('ValidationError: path must be non-empty string and data required');
  }
  
  try {
    // Créer les dossiers parents si nécessaire
    const dir = dirname(path);
    await mkdir(dir, { recursive: true });
    
    // Convertir data en string si c'est un object
    let content;
    if (typeof data === 'string') {
      content = data;
    } else {
      content = JSON.stringify(data, null, 2);
    }
    
    // Écrire le fichier
    await writeFile(path, content, 'utf8');
    
    return { 
      success: true, 
      data: { 
        written: true, 
        path, 
        size: Buffer.byteLength(content, 'utf8')
      } 
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}
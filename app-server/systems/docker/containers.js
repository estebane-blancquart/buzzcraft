/*
 * FAIT QUOI : Gère les containers Docker pour les projets BuzzCraft
 * REÇOIT : projectPath (string), action (string), config (object)
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres invalides
 */

import { readPath } from '../reader.js';
import { writePath } from '../writer.js';
import { execSync } from 'child_process';

export async function manageContainers(projectPath, action, config = {}) {
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be non-empty string');
  }
  
  if (!action || !['create', 'start', 'stop'].includes(action)) {
    throw new Error('ValidationError: action must be create, start, or stop');
  }
  
  try {
    const projectId = projectPath.split('/').pop();
    const containersPath = `${projectPath}/containers`;
    
    if (action === 'create') {
      const dockerCompose = `services:
  ${projectId}-visitor:
    build: ../app-visitor
    ports:
      - "3001:3000"
    restart: unless-stopped`;
      
      await writePath(`${containersPath}/docker-compose.yml`, dockerCompose);
      execSync(`cd ${containersPath} && docker-compose create`, { encoding: 'utf8' });
    }
    
    if (action === 'start') {
      execSync(`cd ${containersPath} && docker-compose up -d`, { encoding: 'utf8' });
      await writePath(`${containersPath}/.running`, { timestamp: new Date().toISOString() });
    }
    
    if (action === 'stop') {
      execSync(`cd ${containersPath} && docker-compose down`, { encoding: 'utf8' });
      const fs = await import('fs/promises');
      try {
        await fs.unlink(join(containersPath, '.running'));
      } catch {}
    }
    
    return {
      success: true,
      data: {
        projectId,
        action,
        containersPath
      }
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}
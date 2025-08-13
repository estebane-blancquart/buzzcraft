/*
 * FAIT QUOI : Configuration API centralisée pour tout le frontend
 * REÇOIT : Rien (auto-détection environnement)
 * RETOURNE : baseURL + helper functions
 * ERREURS : Fallback localhost si détection échoue
 */

// Auto-détection environnement
const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';

// Configuration par environnement
const config = {
  development: {
    baseURL: 'http://localhost:3000'
  },
  production: {
    baseURL: '/api' // Même domaine en production
  }
};

// Export de la config active
export const API_CONFIG = isDev ? config.development : config.production;

// Helper pour construire URLs complètes
export function apiUrl(endpoint) {
  // Nettoyer l'endpoint (enlever / au début si présent)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.baseURL}/${cleanEndpoint}`;
}

// Helper pour requêtes JSON (optionnel, pour simplifier)
export async function apiRequest(endpoint, options = {}) {
  const url = apiUrl(endpoint);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}
// �� CONFIGURATION API CENTRALISÉE

const isDev = import.meta.env.DEV;

export const API_CONFIG = {
  baseURL: isDev ? 'http://localhost:3000' : '/api',
  timeout: 10000
};

export function apiUrl(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.baseURL}/${cleanEndpoint}`;
}

// Headers par défaut
export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

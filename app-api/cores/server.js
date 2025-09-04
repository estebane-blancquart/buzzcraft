/**
 * BuzzCraft API Server - Production-ready Express server
 * @description Point d'entrée principal avec middleware sécurisé et monitoring
 */

import express from "express";
import cors from "cors";
import projectsRouter from './routes.js';
import { createServer } from 'http';

/**
 * Configuration du serveur
 */
const SERVER_CONFIG = {
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  environment: process.env.NODE_ENV || 'development',
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
  maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
  logLevel: process.env.LOG_LEVEL || 'info'
};

/**
 * Initialise l'application Express avec middleware complet
 * @returns {express.Application} Application Express configurée
 */
function createExpressApp() {
  const app = express();
  
  // Middleware de sécurité et performance
  setupSecurityMiddleware(app);
  
  // Middleware de parsing et traitement
  setupParsingMiddleware(app);
  
  // Middleware de monitoring et logs
  setupMonitoringMiddleware(app);
  
  // Routes d'application
  setupRoutes(app);
  
  // Middleware de gestion d'erreurs (doit être en dernier)
  setupErrorHandling(app);
  
  return app;
}

/**
 * Configure les middleware de sécurité
 * @param {express.Application} app - Application Express
 */
function setupSecurityMiddleware(app) {
  // CORS configuré pour le développement et la production
  const corsOptions = {
    origin: SERVER_CONFIG.environment === 'production' 
      ? ['http://localhost:5173', 'https://yourdomain.com'] // À adapter selon tes domaines
      : true, // Autorise tout en développement
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
  
  app.use(cors(corsOptions));
  
  // Headers de sécurité
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // CSP pour les API (moins restrictif que pour les pages web)
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    
    next();
  });
  
  // Rate limiting simple (à améliorer avec redis en production)
  const requestCounts = new Map();
  app.use((req, res, next) => {
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100; // 100 req/min par IP
    
    if (!requestCounts.has(clientIp)) {
      requestCounts.set(clientIp, []);
    }
    
    const requests = requestCounts.get(clientIp);
    // Nettoyer les requêtes anciennes
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    recentRequests.push(now);
    requestCounts.set(clientIp, recentRequests);
    next();
  });
  
  // Timeout des requêtes
  app.use((req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          timeout: SERVER_CONFIG.requestTimeout
        });
      }
    }, SERVER_CONFIG.requestTimeout);
    
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  });
}

/**
 * Configure les middleware de parsing
 * @param {express.Application} app - Application Express
 */
function setupParsingMiddleware(app) {
  // Parsing JSON avec limite de taille
  app.use(express.json({ 
    limit: SERVER_CONFIG.maxRequestSize,
    strict: true,
    type: 'application/json'
  }));
  
  // Parsing URL-encoded
  app.use(express.urlencoded({ 
    extended: true,
    limit: SERVER_CONFIG.maxRequestSize
  }));
  
  // Trust proxy si derrière un reverse proxy
  if (SERVER_CONFIG.environment === 'production') {
    app.set('trust proxy', 1);
  }
}

/**
 * Configure le monitoring et les logs
 * @param {express.Application} app - Application Express
 */
function setupMonitoringMiddleware(app) {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: SERVER_CONFIG.environment,
      version: '1.0.0'
    });
  });
  
  // 🔧 FIX: Middleware de logging FILTRÉ - ne log que les vraies erreurs
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const status = res.statusCode;
      
      // Ignorer les requêtes communes qui polluent les logs
      const ignoredPaths = ['/', '/favicon.ico', '/robots.txt'];
      const isIgnoredPath = ignoredPaths.includes(req.path);
      
      // Log seulement si c'est une vraie erreur (500+) ET pas un path ignoré
      if (status >= 500 && !isIgnoredPath) {
        console.log(`[SERVER] ${req.method} ${req.path} - ${status} (${duration}ms)`);
      }
    });
    
    next();
  });
}

/**
 * Configure les routes d'application
 * @param {express.Application} app - Application Express
 */
function setupRoutes(app) {
  // 🔧 FIX: Route pour favicon (éviter 404)
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });
  
  // 🔧 FIX: Route racine (éviter 404)
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'BuzzCraft API Server',
      version: '1.0.0'
    });
  });
  
  // Routes principales
  app.use('/', projectsRouter);
  
  // Route 404 pour les endpoints non trouvés - SILENCIEUSE
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`,
      availableEndpoints: [
        'GET /health',
        'GET /projects',
        'GET /projects/:id',
        'POST /projects',
        'POST /projects/:id/build',
        'DELETE /projects/:id'
      ]
    });
  });
}

/**
 * Configure la gestion globale d'erreurs
 * @param {express.Application} app - Application Express
 */
function setupErrorHandling(app) {
  // Gestionnaire d'erreurs global
  app.use((error, req, res, next) => {
    const isDevelopment = SERVER_CONFIG.environment === 'development';
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log de l'erreur
    console.log(`[SERVER] Error ${errorId}: ${error.message}`);
    if (isDevelopment) {
      console.log(error.stack);
    }
    
    // Réponse JSON standardisée
    res.status(error.status || 500).json({
      success: false,
      error: isDevelopment ? error.message : 'Internal server error',
      errorId,
      ...(isDevelopment && { 
        stack: error.stack,
        details: error 
      })
    });
  });
}

/**
 * Démarre le serveur HTTP avec gestion des signaux
 * @param {express.Application} app - Application Express
 * @returns {Promise<http.Server>} Serveur HTTP démarré
 */
function startServer(app) {
  return new Promise((resolve, reject) => {
    const server = createServer(app);
    
    // Configuration du serveur HTTP
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    
    // Démarrage du serveur
    server.listen(SERVER_CONFIG.port, SERVER_CONFIG.host, (error) => {
      if (error) {
        console.log(`[SERVER] Failed to start server: ${error.message}`);
        reject(error);
        return;
      }
      
      console.log(`[SERVER] Running on http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
      console.log(`[SERVER] Environment: ${SERVER_CONFIG.environment}`);
      resolve(server);
    });
    
    // Gestion des erreurs serveur
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`[SERVER] ERROR: Port ${SERVER_CONFIG.port} is already in use`);
      } else {
        console.log(`[SERVER] ERROR: Server error: ${error.message}`);
      }
      reject(error);
    });
    
    // Gestion graceful shutdown
    const gracefulShutdown = () => {
      console.log(`[SERVER] Received shutdown signal, closing server gracefully...`);
      
      server.close((error) => {
        if (error) {
          console.log(`[SERVER] ERROR during shutdown: ${error.message}`);
          process.exit(1);
        } else {
          console.log(`[SERVER] Server closed successfully`);
          process.exit(0);
        }
      });
      
      // Force quit après 10 secondes
      setTimeout(() => {
        console.log(`[SERVER] Force closing server after timeout`);
        process.exit(1);
      }, 10000);
    };
    
    // Écoute des signaux de fermeture
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    // Gestion des erreurs non capturées
    process.on('uncaughtException', (error) => {
      console.log(`[SERVER] CRITICAL: Uncaught exception: ${error.message}`);
      console.log(error.stack);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.log(`[SERVER] CRITICAL: Unhandled promise rejection:`, reason);
      process.exit(1);
    });
  });
}

// Point d'entrée principal
async function main() {
  try {
    const app = createExpressApp();
    const server = await startServer(app);
  } catch (error) {
    console.log(`[SERVER] FATAL: Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Lancement du serveur
main();

export default main;
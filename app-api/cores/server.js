/**
 * BuzzCraft API Server - Production-ready Express server
 * @description Point d'entrée principal avec middleware sécurisé et monitoring
 */

import express from "express";
import cors from "cors";
import projectsRouter from './routes.js';
import { createServer } from 'http';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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
  
  console.log(`[SERVER] Initializing Express application...`);
  
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
  
  console.log(`[SERVER] Express application configured successfully`);
  return app;
}

/**
 * Configure les middleware de sécurité
 * @param {express.Application} app - Application Express
 */
function setupSecurityMiddleware(app) {
  console.log(`[SERVER] Setting up security middleware...`);
  
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
}

/**
 * Configure les middleware de parsing des requêtes
 * @param {express.Application} app - Application Express
 */
function setupParsingMiddleware(app) {
  console.log(`[SERVER] Setting up parsing middleware...`);
  
  // Parse JSON avec limite de taille
  app.use(express.json({ 
    limit: SERVER_CONFIG.maxRequestSize,
    strict: true,
    type: 'application/json'
  }));
  
  // Parse URL-encoded pour les forms si nécessaire
  app.use(express.urlencoded({ 
    extended: true, 
    limit: SERVER_CONFIG.maxRequestSize
  }));
  
  // Middleware de timeout des requêtes
  app.use((req, res, next) => {
    res.setTimeout(SERVER_CONFIG.requestTimeout, () => {
      console.log(`[SERVER] Request timeout for ${req.method} ${req.originalUrl}`);
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout'
        });
      }
    });
    next();
  });
}

/**
 * Configure les middleware de monitoring
 * @param {express.Application} app - Application Express
 */
function setupMonitoringMiddleware(app) {
  console.log(`[SERVER] Setting up monitoring middleware...`);
  
  // Middleware de logging des requêtes
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Log au début de la requête
    console.log(`[SERVER] ${req.method} ${req.originalUrl} - Start`);
    
    // Override de res.end pour capturer la fin
    const originalEnd = res.end;
    res.end = function(...args) {
      const duration = Date.now() - startTime;
      const status = res.statusCode;
      const level = status >= 400 ? 'ERROR' : 'INFO';
      
      console.log(`[SERVER] ${req.method} ${req.originalUrl} - ${status} (${duration}ms)`);
      
      // Alertes pour les requêtes lentes
      if (duration > 5000) {
        console.log(`[SERVER] SLOW REQUEST: ${req.method} ${req.originalUrl} took ${duration}ms`);
      }
      
      originalEnd.apply(this, args);
    };
    
    next();
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: SERVER_CONFIG.environment,
      version: '1.0.0'
    };
    
    res.json({
      success: true,
      data: healthStatus
    });
  });
  
  // Metrics endpoint (basique)
  app.get('/metrics', (req, res) => {
    const metrics = {
      nodejs_version: process.version,
      uptime_seconds: process.uptime(),
      memory_usage_bytes: process.memoryUsage(),
      cpu_usage: process.cpuUsage(),
      environment: SERVER_CONFIG.environment,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: metrics
    });
  });
}

/**
 * Configure les routes de l'application
 * @param {express.Application} app - Application Express
 */
function setupRoutes(app) {
  console.log(`[SERVER] Setting up application routes...`);
  
  // Route racine informative
  app.get('/', (req, res) => {
    res.json({
      success: true,
      data: {
        service: 'BuzzCraft API',
        version: '1.0.0',
        environment: SERVER_CONFIG.environment,
        timestamp: new Date().toISOString(),
        documentation: '/health',
        endpoints: {
          projects: '/projects',
          health: '/health',
          metrics: '/metrics'
        }
      }
    });
  });
  
  // Routes principales - sans préfixe car routes.js définit déjà /projects
  app.use('/', projectsRouter);
  
  // Route 404 pour les endpoints non trouvés
  app.use('*', (req, res) => {
    console.log(`[SERVER] 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`,
      availableEndpoints: ['/', '/projects', '/health', '/metrics']
    });
  });
}

/**
 * Configure la gestion d'erreurs globale
 * @param {express.Application} app - Application Express
 */
function setupErrorHandling(app) {
  console.log(`[SERVER] Setting up error handling...`);
  
  // Middleware de gestion d'erreurs global
  app.use((error, req, res, next) => {
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    console.log(`[SERVER] ERROR [${errorId}] ${error.name}: ${error.message}`);
    console.log(`[SERVER] ERROR [${errorId}] Stack:`, error.stack);
    console.log(`[SERVER] ERROR [${errorId}] Request: ${req.method} ${req.originalUrl}`);
    
    // Pas d'exposition des détails d'erreur en production
    const isDevelopment = SERVER_CONFIG.environment === 'development';
    
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
      
      console.log(`[SERVER] ✓ BuzzCraft API running on http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
      console.log(`[SERVER] ✓ Environment: ${SERVER_CONFIG.environment}`);
      console.log(`[SERVER] ✓ Process ID: ${process.pid}`);
      console.log(`[SERVER] ✓ Node.js version: ${process.version}`);
      
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
    console.log(`[SERVER] Starting BuzzCraft API server...`);
    
    const app = createExpressApp();
    const server = await startServer(app);
    
    console.log(`[SERVER] BuzzCraft API server started successfully`);
    
  } catch (error) {
    console.log(`[SERVER] FATAL: Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Lancement du serveur
main();

export default main;
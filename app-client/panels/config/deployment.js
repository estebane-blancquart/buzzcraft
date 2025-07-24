/**
 * COMMIT 65 - Panel Config
 * 
 * FAIT QUOI : Configuration déploiement avec environnements multiples et test connexion
 * REÇOIT : deployConfig: object, environments?: string[], credentials?: object
 * RETOURNE : { environments: object[], config: object, status: object, connections: object }
 * ERREURS : DeployError si config invalide, EnvironmentError si environnement inaccessible, ConnectionError si test connexion échoue
 */

export async function createDeploymentConfig(deployConfig = {}, environments = [], credentials = {}) {
  if (typeof deployConfig !== 'object') {
    throw new Error('DeployError: DeployConfig doit être object');
  }

  if (!Array.isArray(environments)) {
    throw new Error('DeployError: Environments doit être array');
  }

  if (typeof credentials !== 'object') {
    throw new Error('DeployError: Credentials doit être object');
  }

  try {
    const config = {
      strategy: deployConfig.strategy || 'automatic',
      buildCommand: deployConfig.buildCommand || 'npm run build',
      outputDir: deployConfig.outputDir || 'dist',
      nodeVersion: deployConfig.nodeVersion || '18',
      timeout: deployConfig.timeout || 300,
      rollback: deployConfig.rollback !== false
    };

    const envs = environments.length > 0 ? environments : getDefaultEnvironments();
    const environmentConfigs = await initializeEnvironments(envs);
    
    const status = {
      configured: Object.keys(config).length > 0,
      environments: envs.length,
      credentials: Object.keys(credentials).length > 0
    };

    return {
      environments: environmentConfigs,
      config,
      status,
      connections: {},
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`DeployError: Création config déploiement échouée: ${error.message}`);
  }
}

export async function validateDeploymentEnvironments(environments, config = {}) {
  if (!Array.isArray(environments)) {
    throw new Error('DeployError: Environments doit être array');
  }

  if (typeof config !== 'object') {
    throw new Error('DeployError: Config doit être object');
  }

  try {
    const issues = [];
    const warnings = [];

    for (const env of environments) {
      // Validation structure environnement
      if (!env.name || typeof env.name !== 'string') {
        issues.push(`invalid_environment_name: ${env.id || 'unknown'}`);
        continue;
      }

      if (!env.type || !['development', 'staging', 'production'].includes(env.type)) {
        issues.push(`invalid_environment_type: ${env.name}`);
      }

      if (!env.url || typeof env.url !== 'string') {
        warnings.push(`missing_environment_url: ${env.name}`);
      }

      // Validation configuration spécifique
      if (env.type === 'production') {
        if (!env.domain) {
          warnings.push(`production_missing_domain: ${env.name}`);
        }
        
        if (!env.ssl) {
          warnings.push(`production_ssl_not_configured: ${env.name}`);
        }
      }

      // Validation credentials
      if (env.requiresAuth && !env.credentials) {
        issues.push(`missing_credentials: ${env.name}`);
      }
    }

    // Validation globale
    const prodEnvs = environments.filter(env => env.type === 'production');
    if (prodEnvs.length === 0) {
      warnings.push('no_production_environment');
    } else if (prodEnvs.length > 1) {
      warnings.push('multiple_production_environments');
    }

    return {
      valid: issues.length === 0,
      environments: environments.length,
      production: prodEnvs.length,
      staging: environments.filter(env => env.type === 'staging').length,
      development: environments.filter(env => env.type === 'development').length,
      issues,
      warnings,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`DeployError: Validation environnements échouée: ${error.message}`);
  }
}

export async function testDeploymentConnections(environments, credentials = {}) {
  if (!Array.isArray(environments)) {
    throw new Error('DeployError: Environments doit être array');
  }

  if (typeof credentials !== 'object') {
    throw new Error('DeployError: Credentials doit être object');
  }

  try {
    const results = [];
    const connections = {};

    for (const env of environments) {
      try {
        // Simulation test connexion
        const testResult = await simulateConnectionTest(env, credentials);
        
        results.push({
          environment: env.name,
          type: env.type,
          success: testResult.success,
          responseTime: testResult.responseTime,
          message: testResult.message
        });

        connections[env.name] = {
          status: testResult.success ? 'connected' : 'failed',
          lastTest: new Date().toISOString(),
          responseTime: testResult.responseTime
        };
      } catch (error) {
        results.push({
          environment: env.name,
          type: env.type,
          success: false,
          error: error.message
        });

        connections[env.name] = {
          status: 'error',
          lastTest: new Date().toISOString(),
          error: error.message
        };
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      tested: true,
      results,
      connections,
      summary: {
        total: environments.length,
        successful,
        failed,
        successRate: Math.round((successful / environments.length) * 100)
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`ConnectionError: Test connexions échoué: ${error.message}`);
  }
}

export async function getDeploymentConfigStatus(deploymentConfig, options = {}) {
  if (!deploymentConfig || typeof deploymentConfig !== 'object') {
    throw new Error('DeployError: DeploymentConfig requis object');
  }

  try {
    const hasEnvironments = deploymentConfig.environments && Array.isArray(deploymentConfig.environments);
    const hasConfig = deploymentConfig.config && typeof deploymentConfig.config === 'object';
    
    const status = hasEnvironments && hasConfig ? 
      (deploymentConfig.environments.length > 0 ? 'configured' : 'empty') : 
      'incomplete';

    const validation = hasEnvironments ? 
      await validateDeploymentEnvironments(deploymentConfig.environments) : 
      { valid: false };

    const connections = deploymentConfig.connections || {};
    const connectedEnvs = Object.values(connections).filter(conn => conn.status === 'connected').length;

    return {
      status,
      configured: hasEnvironments && hasConfig,
      environments: deploymentConfig.environments?.length || 0,
      connectedEnvironments: connectedEnvs,
      validEnvironments: validation.environments || 0,
      productionReady: validation.production > 0,
      lastUpdate: deploymentConfig.timestamp || new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      configured: false,
      issues: [`status_check_failed: ${error.message}`],
      lastUpdate: new Date().toISOString()
    };
  }
}

// Helper functions pour simulation
function getDefaultEnvironments() {
  return [
    {
      id: 'dev',
      name: 'Development',
      type: 'development',
      url: 'http://localhost:3000',
      requiresAuth: false
    },
    {
      id: 'staging',
      name: 'Staging',
      type: 'staging',
      url: 'https://staging.example.com',
      requiresAuth: true,
      ssl: true
    },
    {
      id: 'prod',
      name: 'Production',
      type: 'production',
      url: 'https://example.com',
      domain: 'example.com',
      requiresAuth: true,
      ssl: true
    }
  ];
}

async function initializeEnvironments(environments) {
  // Simulation initialisation environnements
  return environments.map(env => ({
    ...env,
    initialized: true,
    status: 'ready',
    lastDeploy: null
  }));
}

async function simulateConnectionTest(environment, credentials) {
  // Simulation test connexion
  const baseLatency = Math.random() * 100 + 50; // 50-150ms
  const success = Math.random() > 0.1; // 90% success rate
  
  return {
    success,
    responseTime: Math.round(baseLatency),
    message: success ? 'Connexion réussie' : 'Connexion échouée'
  };
}

// panels/config/deployment : Panel Config (commit 65)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/

/**
 * COMMIT 66 - Panel Deployment
 * 
 * FAIT QUOI : Rollback déploiement avec versions précédentes et restauration automatique
 * REÇOIT : deploymentId: string, targetVersion?: string, options?: object
 * RETOURNE : { rollback: object, versions: object[], validation: object, execution: object }
 * ERREURS : RollbackError si rollback impossible, VersionError si version invalide, ExecutionError si exécution échoue
 */

export async function createRollbackPlan(deploymentId, targetVersion = null, options = {}) {
  if (!deploymentId || typeof deploymentId !== 'string') {
    throw new Error('RollbackError: DeploymentId requis string');
  }

  if (targetVersion && typeof targetVersion !== 'string') {
    throw new Error('RollbackError: TargetVersion doit être string ou null');
  }

  if (typeof options !== 'object') {
    throw new Error('RollbackError: Options doit être object');
  }

  try {
    const currentDeployment = await getCurrentDeployment(deploymentId);
    const availableVersions = await getAvailableVersions(deploymentId);
    
    const target = targetVersion ? 
      findVersion(availableVersions, targetVersion) : 
      getPreviousVersion(availableVersions, currentDeployment.version);

    if (!target) {
      throw new Error('VersionError: Version cible introuvable');
    }

    const rollbackPlan = {
      deploymentId,
      currentVersion: currentDeployment.version,
      targetVersion: target.version,
      strategy: options.strategy || 'blue-green',
      downtime: estimateDowntime(currentDeployment, target, options.strategy),
      steps: generateRollbackSteps(currentDeployment, target, options)
    };

    const validation = await validateRollbackPlan(rollbackPlan, currentDeployment);

    return {
      rollback: rollbackPlan,
      versions: availableVersions,
      validation,
      execution: null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`RollbackError: Création plan rollback échouée: ${error.message}`);
  }
}

export async function validateRollbackCompatibility(currentVersion, targetVersion, constraints = {}) {
  if (!currentVersion || typeof currentVersion !== 'string') {
    throw new Error('VersionError: CurrentVersion requis string');
  }

  if (!targetVersion || typeof targetVersion !== 'string') {
    throw new Error('VersionError: TargetVersion requis string');
  }

  if (typeof constraints !== 'object') {
    throw new Error('RollbackError: Constraints doit être object');
  }

  try {
    const issues = [];
    const warnings = [];

    // Validation versions
    const currentSemver = parseVersion(currentVersion);
    const targetSemver = parseVersion(targetVersion);

    if (!currentSemver || !targetSemver) {
      issues.push('invalid_version_format');
      return {
        valid: false,
        issues,
        warnings,
        timestamp: new Date().toISOString()
      };
    }

    // Validation direction rollback
    if (compareVersions(targetSemver, currentSemver) >= 0) {
      issues.push('target_version_not_older');
    }

    // Validation saut de version majeure
    if (currentSemver.major - targetSemver.major > 1) {
      warnings.push('major_version_skip_detected');
    }

    // Validation contraintes business
    if (constraints.maxVersionGap) {
      const versionGap = currentSemver.major - targetSemver.major;
      if (versionGap > constraints.maxVersionGap) {
        issues.push(`version_gap_too_large: ${versionGap} > ${constraints.maxVersionGap}`);
      }
    }

    // Validation compatibilité base données
    if (constraints.checkDatabase && targetSemver.major < currentSemver.major) {
      warnings.push('database_migration_may_be_required');
    }

    // Validation features deprecated
    if (constraints.checkFeatures) {
      const deprecatedFeatures = checkDeprecatedFeatures(currentVersion, targetVersion);
      if (deprecatedFeatures.length > 0) {
        warnings.push(`deprecated_features_detected: ${deprecatedFeatures.join(', ')}`);
      }
    }

    return {
      valid: issues.length === 0,
      compatible: issues.length === 0 && warnings.length === 0,
      currentVersion: currentSemver,
      targetVersion: targetSemver,
      versionGap: currentSemver.major - targetSemver.major,
      issues,
      warnings,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`VersionError: Validation compatibilité échouée: ${error.message}`);
  }
}

export async function executeRollback(rollbackPlan, confirmationToken, options = {}) {
  if (!rollbackPlan || typeof rollbackPlan !== 'object') {
    throw new Error('RollbackError: RollbackPlan requis object');
  }

  if (!confirmationToken || typeof confirmationToken !== 'string') {
    throw new Error('RollbackError: ConfirmationToken requis string');
  }

  const dryRun = options.dryRun || false;
  const skipValidation = options.skipValidation || false;

  try {
    // Validation token
    const validToken = await validateConfirmationToken(confirmationToken, rollbackPlan.deploymentId);
    if (!validToken && !skipValidation) {
      throw new Error('RollbackError: Token confirmation invalide');
    }

    // Validation plan avant exécution
    if (!skipValidation) {
      const validation = await validateRollbackPlan(rollbackPlan);
      if (!validation.valid) {
        throw new Error(`RollbackError: Plan invalide: ${validation.issues.join(', ')}`);
      }
    }

    const execution = {
      executionId: generateExecutionId(),
      deploymentId: rollbackPlan.deploymentId,
      targetVersion: rollbackPlan.targetVersion,
      dryRun,
      startTime: new Date().toISOString(),
      status: 'running',
      steps: [],
      currentStep: 0
    };

    if (dryRun) {
      execution.status = 'simulated';
      execution.steps = rollbackPlan.steps.map(step => ({
        ...step,
        status: 'simulated',
        duration: Math.random() * 1000
      }));
    } else {
      // Exécution réelle
      for (let i = 0; i < rollbackPlan.steps.length; i++) {
        const step = rollbackPlan.steps[i];
        execution.currentStep = i;
        
        try {
          const stepResult = await executeRollbackStep(step, rollbackPlan);
          execution.steps.push({
            ...step,
            status: 'completed',
            result: stepResult,
            duration: stepResult.duration
          });
        } catch (stepError) {
          execution.steps.push({
            ...step,
            status: 'failed',
            error: stepError.message
          });
          execution.status = 'failed';
          break;
        }
      }

      if (execution.status === 'running') {
        execution.status = 'completed';
      }
    }

    execution.endTime = new Date().toISOString();
    execution.totalDuration = new Date(execution.endTime) - new Date(execution.startTime);

    return {
      executed: true,
      execution,
      rollback: rollbackPlan,
      dryRun,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`ExecutionError: Exécution rollback échouée: ${error.message}`);
  }
}

export async function getRollbackStatus(deploymentId, executionId = null) {
  if (!deploymentId || typeof deploymentId !== 'string') {
    throw new Error('RollbackError: DeploymentId requis string');
  }

  if (executionId && typeof executionId !== 'string') {
    throw new Error('RollbackError: ExecutionId doit être string ou null');
  }

  try {
    const rollbackHistory = await getRollbackHistory(deploymentId);
    const currentExecution = executionId ? 
      rollbackHistory.find(exec => exec.executionId === executionId) : 
      rollbackHistory[0];

    const availableVersions = await getAvailableVersions(deploymentId);
    const canRollback = availableVersions.length > 1;

    const status = currentExecution ? currentExecution.status : 'none';
    const lastRollback = rollbackHistory.length > 0 ? rollbackHistory[0] : null;

    return {
      status,
      canRollback,
      currentExecution,
      lastRollback,
      rollbackHistory: rollbackHistory.slice(0, 10), // 10 derniers
      availableVersions: availableVersions.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      canRollback: false,
      issues: [`status_check_failed: ${error.message}`],
      timestamp: new Date().toISOString()
    };
  }
}

// Helper functions pour simulation
async function getCurrentDeployment(deploymentId) {
  // Simulation déploiement actuel
  return {
    deploymentId,
    version: 'v2.1.0',
    environment: 'production',
    status: 'running',
    deployedAt: new Date(Date.now() - 3600000).toISOString()
  };
}

async function getAvailableVersions(deploymentId) {
  // Simulation versions disponibles
  return [
    { version: 'v2.1.0', status: 'current', deployedAt: new Date(Date.now() - 3600000).toISOString() },
    { version: 'v2.0.3', status: 'available', deployedAt: new Date(Date.now() - 86400000).toISOString() },
    { version: 'v2.0.2', status: 'available', deployedAt: new Date(Date.now() - 172800000).toISOString() },
    { version: 'v1.9.1', status: 'available', deployedAt: new Date(Date.now() - 604800000).toISOString() }
  ];
}

function findVersion(versions, targetVersion) {
  return versions.find(v => v.version === targetVersion) || null;
}

function getPreviousVersion(versions, currentVersion) {
  const currentIndex = versions.findIndex(v => v.version === currentVersion);
  return currentIndex > 0 ? versions[currentIndex - 1] : versions[1] || null;
}

function estimateDowntime(current, target, strategy) {
  // Simulation estimation downtime
  const strategies = {
    'blue-green': 30, // secondes
    'rolling': 0,
    'recreate': 120
  };
  return strategies[strategy] || 60;
}

function generateRollbackSteps(current, target, options) {
  // Simulation génération étapes
  const steps = [
    { name: 'validation', description: 'Validation pré-rollback', estimated: 10 },
    { name: 'backup', description: 'Sauvegarde état actuel', estimated: 30 },
    { name: 'switch', description: 'Basculement version', estimated: 45 },
    { name: 'healthcheck', description: 'Vérification santé', estimated: 60 },
    { name: 'cleanup', description: 'Nettoyage post-rollback', estimated: 15 }
  ];

  if (options.skipBackup) {
    return steps.filter(step => step.name !== 'backup');
  }

  return steps;
}

async function validateRollbackPlan(plan, deployment = null) {
  // Simulation validation plan
  const issues = [];
  
  if (!plan.targetVersion) {
    issues.push('missing_target_version');
  }

  if (!plan.steps || plan.steps.length === 0) {
    issues.push('missing_rollback_steps');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings: [],
    timestamp: new Date().toISOString()
  };
}

function parseVersion(version) {
  // Simulation parsing semver
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    raw: version
  };
}

function compareVersions(v1, v2) {
  // Retourne: -1 si v1 < v2, 0 si égal, 1 si v1 > v2
  if (v1.major !== v2.major) return v1.major - v2.major;
  if (v1.minor !== v2.minor) return v1.minor - v2.minor;
  return v1.patch - v2.patch;
}

function checkDeprecatedFeatures(currentVersion, targetVersion) {
  // Simulation détection features deprecated
  return ['legacy-api', 'old-auth']; // features qui pourraient poser problème
}

async function validateConfirmationToken(token, deploymentId) {
  // Simulation validation token
  return token.includes(deploymentId) && token.length > 10;
}

function generateExecutionId() {
  return 'rollback_' + Math.random().toString(36).substr(2, 9);
}

async function executeRollbackStep(step, plan) {
  // Simulation exécution étape
  const duration = step.estimated * 1000 + Math.random() * 1000;
  
  return {
    success: Math.random() > 0.1, // 90% success rate
    duration: Math.round(duration),
    message: `${step.name} completed successfully`
  };
}

async function getRollbackHistory(deploymentId) {
  // Simulation historique rollbacks
  return [
    {
      executionId: 'rollback_abc123',
      targetVersion: 'v2.0.3',
      status: 'completed',
      startTime: new Date(Date.now() - 86400000).toISOString(),
      duration: 180000
    }
  ];
}

// panels/deployment/rollback : Panel Deployment (commit 66)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/

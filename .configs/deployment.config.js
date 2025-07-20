export default {
  // Configuration déploiement multi-environnements
  environments: {
    staging: {
      domain: "staging.buzzcraft.dev",
      ssl: true,
      autoBackup: true,
      healthChecks: true,
      rollbackOnFailure: true
    },
    production: {
      domain: "buzzcraft.app", 
      ssl: true,
      autoBackup: true,
      healthChecks: true,
      rollbackOnFailure: true,
      blueGreenDeployment: true
    }
  },
  
  infrastructure: {
    minReplicas: 2,
    maxReplicas: 10,
    autoscaling: true,
    loadBalancer: true,
    monitoring: true
  },
  
  security: {
    firewalls: true,
    rateLimiting: true,
    ddosProtection: true,
    secretsManagement: true
  }
};

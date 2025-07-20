export default {
  // Configuration Docker pour BuzzCraft
  environments: {
    development: {
      compose: "docker-compose.dev.yml",
      rebuild: true,
      hotReload: true
    },
    production: {
      compose: "docker-compose.prod.yml", 
      rebuild: false,
      optimize: true
    }
  },
  
  containers: {
    app: {
      image: "buzzcraft-app",
      ports: ["3000:3000"],
      volumes: ["./app:/usr/src/app"],
      environment: ["NODE_ENV=development"]
    },
    database: {
      image: "postgres:15",
      ports: ["5432:5432"],
      volumes: ["postgres_data:/var/lib/postgresql/data"],
      environment: ["POSTGRES_DB=buzzcraft", "POSTGRES_USER=buzzcraft"]
    },
    redis: {
      image: "redis:7",
      ports: ["6379:6379"],
      volumes: ["redis_data:/data"]
    }
  },
  
  networks: {
    default: {
      driver: "bridge",
      isolation: true
    }
  }
};

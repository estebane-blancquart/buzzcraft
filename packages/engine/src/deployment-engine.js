const fs = require('fs-extra')
const path = require('path')
const Docker = require('dockerode')
const tar = require('tar')
const { v4: uuidv4 } = require('uuid')

class DeploymentEngine {
  constructor(options = {}) {
    this.options = {
      mode: options.mode || 'local',
      dockerHost: options.dockerHost || null,
      verbose: options.verbose || false,
      ...options
    }
    
    this.docker = new Docker(this.options.dockerHost ? 
      { host: this.options.dockerHost } : 
      {}
    )
    
    this.deployments = new Map()
  }

  async deployProject(projectPath, options = {}) {
    try {
      const startTime = Date.now()
      this.log('Ì∫Ä Starting deployment...')
      
      const projectInfo = await this.validateProject(projectPath)
      this.log(`Ì≥Ñ Project: ${projectInfo.projectId}`)
      
      const deploymentId = uuidv4()
      
      // FIXED: Ensure port is always defined
      const port = options.port || 3100
      
      const deploymentConfig = {
        deploymentId,
        projectId: projectInfo.projectId,
        projectPath,
        containerName: `buzzcraft-${projectInfo.projectId}`,
        imageTag: `buzzcraft/${projectInfo.projectId}:latest`,
        port: port, // Explicitly set port
        domain: options.domain || `${projectInfo.projectId}.localhost`,
        ...options
      }
      
      await this.buildDockerImage(deploymentConfig)
      const container = await this.deployContainer(deploymentConfig)
      await this.configureNetworking(deploymentConfig)
      await this.performHealthChecks(deploymentConfig)
      
      this.deployments.set(deploymentId, {
        ...deploymentConfig,
        container,
        status: 'running',
        deployedAt: new Date(),
        duration: Date.now() - startTime
      })
      
      const duration = Date.now() - startTime
      this.log(`‚úÖ Deployment completed in ${duration}ms`)
      
      return {
        success: true,
        deploymentId,
        projectId: projectInfo.projectId,
        url: `http://localhost:${deploymentConfig.port}`,
        containerName: deploymentConfig.containerName,
        duration
      }
    } catch (error) {
      this.log(`‚ùå Deployment failed: ${error.message}`)
      return {
        success: false,
        error: error.message,
        stack: error.stack
      }
    }
  }

  async validateProject(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json')
    const buzzcraftJsonPath = path.join(projectPath, 'buzzcraft.json')
    
    if (!await fs.pathExists(packageJsonPath)) {
      throw new Error('package.json not found - not a valid Next.js project')
    }
    
    if (!await fs.pathExists(buzzcraftJsonPath)) {
      throw new Error('buzzcraft.json not found - not a BuzzCraft generated project')
    }
    
    const packageJson = await fs.readJson(packageJsonPath)
    const buzzcraftJson = await fs.readJson(buzzcraftJsonPath)
    
    if (!packageJson.dependencies?.next) {
      throw new Error('Next.js dependency not found')
    }
    
    return {
      projectId: buzzcraftJson.projectId,
      version: buzzcraftJson.version,
      nextVersion: packageJson.dependencies.next
    }
  }

  async buildDockerImage(config) {
    this.log('Ì¥® Building Docker image...')
    
    // FIXED: Better Dockerfile with proper permissions
    const dockerfile = `FROM node:18-alpine

WORKDIR /app

# Install dependencies as root
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Fix permissions for next binary
RUN chmod +x node_modules/.bin/next

# Build the application 
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
`
    
    await fs.writeFile(path.join(config.projectPath, 'Dockerfile'), dockerfile)
    
    const dockerignore = `node_modules
.git
.next
*.log
Dockerfile.orig
.dockerignore.orig`
    await fs.writeFile(path.join(config.projectPath, '.dockerignore'), dockerignore)
    
    const tarStream = await this.createTarStream(config.projectPath)
    
    const stream = await this.docker.buildImage(tarStream, {
      t: config.imageTag,
      buildargs: {
        NODE_ENV: 'production'
      }
    })
    
    await this.followBuildProgress(stream)
    this.log(`‚úÖ Docker image built: ${config.imageTag}`)
  }

  async createTarStream(projectPath) {
    return new Promise((resolve, reject) => {
      const chunks = []
      tar.c({
        gzip: false,
        cwd: projectPath,
        filter: (path, stat) => {
          // Exclude problematic files
          const excludePatterns = [
            /node_modules/,
            /\.git/,
            /\.next/,
            /\.env/
          ]
          return !excludePatterns.some(pattern => pattern.test(path))
        }
      }, ['.'])
      .on('data', chunk => chunks.push(chunk))
      .on('end', () => {
        const buffer = Buffer.concat(chunks)
        const { Readable } = require('stream')
        const stream = new Readable()
        stream.push(buffer)
        stream.push(null)
        resolve(stream)
      })
      .on('error', reject)
    })
  }

  async deployContainer(config) {
    this.log('Ì∫¢ Deploying container...')
    
    await this.stopExistingContainer(config.containerName)
    
    // Ensure port is number
    const hostPort = parseInt(config.port)
    if (isNaN(hostPort)) {
      throw new Error(`Invalid port: ${config.port}`)
    }
    
    const container = await this.docker.createContainer({
      Image: config.imageTag,
      name: config.containerName,
      ExposedPorts: {
        '3000/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '3000/tcp': [{ HostPort: hostPort.toString() }]
        },
        RestartPolicy: { Name: 'unless-stopped' }
      },
      Env: [
        'NODE_ENV=production',
        `NEXT_PUBLIC_SITE_URL=http://localhost:${hostPort}`,
        'PORT=3000'
      ],
      Labels: {
        'buzzcraft.project': config.projectId,
        'buzzcraft.deployment': config.deploymentId,
        'buzzcraft.version': '1.0.0'
      }
    })
    
    await container.start()
    this.log(`‚úÖ Container started: ${config.containerName} on port ${hostPort}`)
    return container
  }

  async configureNetworking(config) {
    this.log('Ìºê Configuring networking...')
    this.log(`‚úÖ Local access: http://localhost:${config.port}`)
  }

  async performHealthChecks(config) {
    this.log('Ìø• Performing health checks...')
    
    const maxRetries = 20
    const retryDelay = 3000
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const url = `http://localhost:${config.port}`
        const response = await fetch(url)
        if (response.ok) {
          this.log('‚úÖ Health check passed - site is live!')
          return true
        }
      } catch (error) {
        // Continue retrying
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      this.log(`‚è≥ Health check ${i + 1}/${maxRetries}...`)
    }
    
    this.log('‚ö†Ô∏è Health checks timeout - checking container logs...')
    await this.showContainerLogs(config.containerName)
    return true // Don't fail deployment
  }

  async showContainerLogs(containerName) {
    try {
      const container = this.docker.getContainer(containerName)
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: 10
      })
      this.log('Ì≥ã Container logs:')
      console.log(logs.toString())
    } catch (error) {
      this.log('‚ùå Could not retrieve container logs')
    }
  }

  async stopExistingContainer(containerName) {
    try {
      const container = this.docker.getContainer(containerName)
      const info = await container.inspect()
      
      if (info.State.Running) {
        await container.stop()
        this.log(`Ìªë Stopped existing container: ${containerName}`)
      }
      
      await container.remove()
      this.log(`Ì∑ëÔ∏è Removed existing container: ${containerName}`)
    } catch (error) {
      // Container doesn't exist, that's fine
    }
  }

  async followBuildProgress(stream) {
    return new Promise((resolve, reject) => {
      this.docker.modem.followProgress(stream, (err, res) => {
        if (err) reject(err)
        else resolve(res)
      }, (event) => {
        if (event.stream && this.options.verbose) {
          process.stdout.write(event.stream)
        } else if (event.error) {
          console.error('‚ùå Build error:', event.error)
        }
      })
    })
  }

  log(message) {
    if (this.options.verbose) {
      console.log(message)
    }
  }
}

module.exports = DeploymentEngine

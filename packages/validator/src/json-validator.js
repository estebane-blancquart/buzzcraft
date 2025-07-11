const Ajv = require('ajv')
const fs = require('fs').promises
const path = require('path')

class JsonProjectValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false })
    this.schema = null
  }
  
  async initialize() {
    if (this.schema) return
    
    const schemaPath = path.join(__dirname, '../../../data/schemas/json-project.schema.json')
    const content = await fs.readFile(schemaPath, 'utf8')
    this.schema = JSON.parse(content)
    this.validate = this.ajv.compile(this.schema)
    console.log('í³‹ Schema loaded and compiled')
  }
  
  async validateProject(jsonProject) {
    await this.initialize()
    
    try {
      const isValid = this.validate(jsonProject)
      
      if (isValid) {
        console.log('âœ… JSON Schema validation passed')
        return { success: true, errors: [] }
      } else {
        const errors = this.validate.errors.map(err => 
          `${err.instancePath || 'root'}: ${err.message}`
        )
        return { success: false, errors }
      }
    } catch (error) {
      return { success: false, errors: [error.message] }
    }
  }
}

module.exports = { JsonProjectValidator }

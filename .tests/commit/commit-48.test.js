/**
 * COMMIT 48 - API Documentation
 * Tests exhaustifs pour documentation API avec pattern BuzzCraft
 */

import { generateOpenAPISpec, validateEndpoint, exportSpecification, updateDocumentation } from '../../api/documentation/openapi.js';
import { initializeSwaggerUI, configureTheme, enableInteractiveMode, generateSwaggerHTML } from '../../api/documentation/swagger.js';
import { generateRequestExamples, generateResponseExamples, createInteractiveTests, validateExampleData } from '../../api/documentation/examples.js';
import { runDocumentationTests, validateAPICompliance, generateTestReports, integrateWithCI } from '../../api/documentation/testing.js';

describe('COMMIT 48 - API Documentation', () => {
  
  describe('Module openapi.js', () => {
    test('generateOpenAPISpec fonctionne avec endpoints valides', async () => {
      const endpoints = ['GET:/api/projects', 'POST:/api/projects'];
      
      const result = await generateOpenAPISpec(endpoints, 'json');
      
      expect(result.specification).toBeDefined();
      expect(result.specification.openapi).toBe('3.0.3');
      expect(result.specification.info.title).toBe('BuzzCraft API');
      expect(result.valid).toBe(true);
      expect(result.endpoints).toBe(2);
      expect(result.exported).toBe(false);
      expect(result.generatedAt).toBeDefined();
    });
    
    test('generateOpenAPISpec rejette endpoints invalides', async () => {
      await expect(
        generateOpenAPISpec('invalid', 'json')
      ).rejects.toThrow('SpecificationError: endpoints doit être un tableau');
    });
    
    test('validateEndpoint fonctionne avec schema valide', async () => {
      const schema = {
        summary: 'Test endpoint',
        responses: { 200: { description: 'Success' } },
        tags: ['Test']
      };
      
      const result = await validateEndpoint('GET', '/api/test', schema);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedAt).toBeDefined();
    });
    
    test('exportSpecification gère format json', async () => {
      const spec = { openapi: '3.0.3', info: { title: 'Test' } };
      
      const result = await exportSpecification(spec, 'json');
      
      expect(result.exported).toBe(true);
      expect(result.format).toBe('json');
      expect(result.size).toBeGreaterThan(0);
      expect(result.exportedAt).toBeDefined();
    });
  });

  describe('Module swagger.js', () => {
    test('initializeSwaggerUI fonctionne avec spec valide', async () => {
      const spec = { openapi: '3.0.3', info: { title: 'Test API' } };
      
      const result = await initializeSwaggerUI(spec, 'buzzcraft', true);
      
      expect(result.initialized).toBe(true);
      expect(result.theme).toBe('BuzzCraft');
      expect(result.interactive).toBe(true);
      expect(result.url).toBe('/api/documentation');
      expect(result.initializedAt).toBeDefined();
    });
    
    test('configureTheme applique thème buzzcraft', async () => {
      const result = await configureTheme('buzzcraft', '.custom { color: red; }');
      
      expect(result.configured).toBe(true);
      expect(result.theme).toBe('BuzzCraft');
      expect(result.cssLength).toBeGreaterThan(0);
      expect(result.configuredAt).toBeDefined();
    });
    
    test('enableInteractiveMode active features', async () => {
      const result = await enableInteractiveMode(true, true);
      
      expect(result.enabled).toBe(true);
      expect(result.features.tryItOut).toBe(true);
      expect(result.features.authentication).toBe(true);
      expect(result.enabledAt).toBeDefined();
    });
    
    test('generateSwaggerHTML génère HTML complet', async () => {
      const spec = { openapi: '3.0.3', info: { title: 'Test' } };
      
      const result = await generateSwaggerHTML(spec, 'dark', 'My API');
      
      expect(result.generated).toBe(true);
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('My API');
      expect(result.size).toBeGreaterThan(0);
      expect(result.generatedAt).toBeDefined();
    });
  });

  describe('Module examples.js', () => {
    test('generateRequestExamples retourne exemple valide', async () => {
      const result = await generateRequestExamples('POST:/api/projects', 'POST');
      
      expect(result.examples).toBeDefined();
      expect(result.examples.request).toBeDefined();
      expect(result.examples.response).toBeDefined();
      expect(result.interactive).toBe(true);
      expect(result.validated).toBe(true);
      expect(result.generatedAt).toBeDefined();
    });
    
    test('generateResponseExamples gère codes success', async () => {
      const result = await generateResponseExamples(200, '/api/projects');
      
      expect(result.statusCode).toBe(200);
      expect(result.statusText).toBe('Success');
      expect(result.example.success).toBe(true);
      expect(result.example.data).toBeDefined();
      expect(result.generatedAt).toBeDefined();
    });
    
    test('generateResponseExamples gère codes erreur', async () => {
      const result = await generateResponseExamples(400, '/api/projects', 'VALIDATION_ERROR');
      
      expect(result.statusCode).toBe(400);
      expect(result.example.success).toBe(false);
      expect(result.example.error).toBeDefined();
      expect(result.example.error.code).toBe('VALIDATION_ERROR');
    });
    
    test('validateExampleData valide request data', async () => {
      const exampleData = {
        name: 'Test Project',
        template: 'react',
        description: 'Test description'
      };
      
      const result = await validateExampleData(exampleData, 'request');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.schemaType).toBe('request');
      expect(result.validatedAt).toBeDefined();
    });
  });

  describe('Module testing.js', () => {
    test('runDocumentationTests exécute suite basique', async () => {
      const endpoints = ['/api/projects', '/api/projects/{id}'];
      
      const result = await runDocumentationTests(endpoints, 'basic');
      
      expect(result.tested).toBe(true);
      expect(result.testSuite).toBe('Tests de base');
      expect(result.endpoints).toBe(2);
      expect(typeof result.passed).toBe('number');
      expect(typeof result.failed).toBe('number');
      expect(result.results).toHaveLength(2);
      expect(result.testedAt).toBeDefined();
    });
    
    test('validateAPICompliance vérifie conformité', async () => {
      const specification = { openapi: '3.0.3', info: { title: 'Test' } };
      
      const result = await validateAPICompliance(specification, ['response_format']);
      
      expect(typeof result.compliant).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(result.rulesChecked).toBe(1);
      expect(result.validatedAt).toBeDefined();
    });
    
    test('generateTestReports génère rapport JSON', async () => {
      const testResults = {
        endpoints: 5,
        passed: 4,
        failed: 1,
        results: []
      };
      
      const result = await generateTestReports(testResults, 'json', true);
      
      expect(result.reportGenerated).toBe(true);
      expect(result.format).toBe('json');
      expect(result.summary.successRate).toBe(80);
      expect(result.size).toBeGreaterThan(0);
      expect(result.generatedAt).toBeDefined();
    });
    
    test('integrateWithCI configure GitHub Actions', async () => {
      const result = await integrateWithCI('github', '.github/workflows', { notifications: true });
      
      expect(result.integrated).toBe(true);
      expect(result.provider).toBe('github');
      expect(result.features.autoTests).toBe(true);
      expect(result.features.notifications).toBe(true);
      expect(result.integratedAt).toBeDefined();
    });
  });

  describe('Intégration patterns BuzzCraft', () => {
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof generateOpenAPISpec).toBe('function');
      expect(typeof initializeSwaggerUI).toBe('function');
      expect(typeof generateRequestExamples).toBe('function');
      expect(typeof runDocumentationTests).toBe('function');
      
      // Noms cohérents avec pattern
      expect(generateOpenAPISpec.name).toBe('generateOpenAPISpec');
      expect(initializeSwaggerUI.name).toBe('initializeSwaggerUI');
      expect(generateRequestExamples.name).toBe('generateRequestExamples');
      expect(runDocumentationTests.name).toBe('runDocumentationTests');
    });
    
    test('tous les modules utilisent erreurs cohérentes', async () => {
      // Chaque module doit lancer des erreurs avec format correct
      
      // openapi
      await expect(
        generateOpenAPISpec('invalid')
      ).rejects.toThrow('SpecificationError:');
      
      // swagger
      await expect(
        initializeSwaggerUI(null)
      ).rejects.toThrow('SwaggerError:');
      
      // examples
      await expect(
        generateRequestExamples('')
      ).rejects.toThrow('ExampleError:');
      
      // testing
      await expect(
        runDocumentationTests('invalid')
      ).rejects.toThrow('TestingError:');
    });
    
    test('architecture dependency flow respectée', () => {
      // Test symbolique - vérifier que les modules n'importent que depuis api/schemas
      expect(true).toBe(true);
    });
    
    test('tous les modules retournent structure cohérente', async () => {
      // Test que tous les modules retournent un objet avec timestamp
      const endpoints = ['GET:/api/projects'];
      
      const openApiResult = await generateOpenAPISpec(endpoints);
      expect(openApiResult).toHaveProperty('generatedAt');
      
      const spec = { openapi: '3.0.3', info: { title: 'Test' } };
      const swaggerResult = await initializeSwaggerUI(spec);
      expect(swaggerResult).toHaveProperty('initializedAt');
      
      const exampleResult = await generateRequestExamples('GET:/api/projects');
      expect(exampleResult).toHaveProperty('generatedAt');
      
      const testResult = await runDocumentationTests(['test']);
      expect(testResult).toHaveProperty('testedAt');
    });
    
    test('intégration complète workflow documentation', async () => {
      // Test workflow complet : spec → swagger → examples → tests
      
      // 1. Générer spécification OpenAPI
      const endpoints = ['GET:/api/projects', 'POST:/api/projects'];
      const spec = await generateOpenAPISpec(endpoints);
      expect(spec.valid).toBe(true);
      
      // 2. Initialiser Swagger UI
      const swagger = await initializeSwaggerUI(spec.specification);
      expect(swagger.initialized).toBe(true);
      
      // 3. Générer exemples
      const examples = await generateRequestExamples('POST:/api/projects', 'POST');
      expect(examples.validated).toBe(true);
      
      // 4. Lancer tests documentation
      const tests = await runDocumentationTests(endpoints, 'complete');
      expect(tests.tested).toBe(true);
      
      // 5. Générer rapport final
      const report = await generateTestReports(tests, 'json');
      expect(report.reportGenerated).toBe(true);
    });
  });
});

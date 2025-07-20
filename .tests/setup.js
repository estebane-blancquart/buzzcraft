/**
 * Configuration globale des tests BuzzCraft
 * Exécuté avant chaque suite de tests
 */

// Timeout global pour tests lents
jest.setTimeout(30000);

// Variables globales de test
global.TEST_TIMEOUT = 5000;
global.INTEGRATION_TIMEOUT = 15000;

// Mocks globaux
global.mockProjectId = "test-project-12345";
global.mockTemplateId = "react-template";

// Configuration logging pour tests
console.log = jest.fn(); // Silence les logs en test
console.error = jest.fn();
console.warn = jest.fn();

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

// Setup avant tous les tests
beforeAll(() => {
  console.log("��� Initialisation suite de tests BuzzCraft");
});

// Cleanup après tous les tests  
afterAll(() => {
  console.log("✅ Suite de tests terminée");
});

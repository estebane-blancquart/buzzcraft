# 10-testing.md

Patterns et conventions pour les tests du projet.

## 📋 Organisation

Jest + ES modules

**Patterns réutilisables :**

*Tests unitaires :*
```javascript
describe('module.js', () => {
  test('handles success case', async () => {
    const result = await functionName(validInput);
    expect(result.success).toBe(true);
  });

  test('handles error case', async () => {
    const result = await functionName(invalidInput);
    expect(result.success).toBe(false);
  });
});
```

*Tests intégration :*
```javascript
describe('WORKFLOW integration', () => {
  afterEach(async () => {
    await cleanup(testProjectPath);
  });

  test('executes complete workflow', async () => {
    const result = await workflowFunction(testProjectId, config);
    expect(result.data.fromState).toBe('EXPECTED_FROM');
    expect(result.data.toState).toBe('EXPECTED_TO');
  });
});
```

*Tests composants React :*
```javascript
describe('Component', () => {
  test('renders with props', () => {
    render(<Component prop="value" />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });

  test('handles interaction', () => {
    const mockHandler = jest.fn();
    render(<Component onClick={mockHandler} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

**Types de tests :**
- **Tests unitaires** : 1 module isolé (reader, writer, detector)
- **Tests intégration** : Workflow complets (CREATE, BUILD)
- **Tests composants** : React (Button, Modal, etc.)

## 🔧 Fonctionnement
 Patterns réutilisables pour rapidement tester nouveaux modules. Structure `.tests/` centralisée pour visibilité globale.
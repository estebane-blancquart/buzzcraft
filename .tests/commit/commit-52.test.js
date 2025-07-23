/**
 * TESTS COMMIT 52 - App Client Components Core
 * Tests simples du pattern BuzzCraft 4 fonctions par module
 */

import { describe, test, expect } from '@jest/globals';

import {
  createButton, validateButton, updateButtonState, getButtonStatus
} from '../../app-client/components/core/buttons.js';
import {
  createInput, validateInput, formatInputValue, getInputStatus
} from '../../app-client/components/core/inputs.js';
import {
  createForm, validateForm, submitForm, getFormStatus
} from '../../app-client/components/core/forms.js';
import {
  createContainer, validateContainer, updateContainerLayout, getContainerStatus
} from '../../app-client/components/core/containers.js';

describe('COMMIT 52 - App Client Components Core', () => {
  
  describe('Buttons', () => {
    test('createButton crée button basique', async () => {
      const result = await createButton('primary', 'medium');
      expect(result.states.variant).toBe('primary');
      expect(result.states.size).toBe('medium');
      expect(typeof result.component).toBe('function');
    });

    test('validateButton valide config', async () => {
      const config = await createButton('primary');
      const result = await validateButton(config);
      expect(result.valid).toBe(true);
    });

    test('rejette variant invalide', async () => {
      await expect(createButton('invalid')).rejects.toThrow('ButtonError');
    });
  });

  describe('Inputs', () => {
    test('createInput crée input basique', async () => {
      const result = await createInput('text');
      expect(result.metadata.type).toBe('text');
      expect(typeof result.component).toBe('function');
    });
  });

  describe('Forms', () => {
    test('createForm crée form basique', async () => {
      const result = await createForm({}, []);
      expect(result.metadata.fields).toBe(0);
      expect(typeof result.component).toBe('function');
    });
  });

  describe('Containers', () => {
    test('createContainer crée container basique', async () => {
      const result = await createContainer('flex-col');
      expect(result.layout.type).toBe('flex-col');
      expect(typeof result.component).toBe('function');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('tous modules ont 4 fonctions', () => {
      // Buttons
      expect(typeof createButton).toBe('function');
      expect(typeof validateButton).toBe('function');
      expect(typeof updateButtonState).toBe('function');
      expect(typeof getButtonStatus).toBe('function');

      // Inputs  
      expect(typeof createInput).toBe('function');
      expect(typeof validateInput).toBe('function');
      expect(typeof formatInputValue).toBe('function');
      expect(typeof getInputStatus).toBe('function');
    });

    test('erreurs typées cohérentes', async () => {
      await expect(createButton('')).rejects.toThrow('ButtonError:');
      await expect(createInput('')).rejects.toThrow('InputError:');
      await expect(createForm(null)).rejects.toThrow('FormError:');
      await expect(createContainer('')).rejects.toThrow('ContainerError:');
    });

    test('structures retour cohérentes avec timestamp', async () => {
      const button = await createButton('primary');
      const input = await createInput('text');
      const form = await createForm({}, []);
      const container = await createContainer('flex-col');

      expect(button).toHaveProperty('timestamp');
      expect(input).toHaveProperty('timestamp');
      expect(form).toHaveProperty('timestamp');
      expect(container).toHaveProperty('timestamp');
    });
  });
});

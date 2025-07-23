/**
 * TESTS COMMIT 56 - App Client Themes
 * Tests simples du pattern BuzzCraft 4 fonctions par module
 */

import { describe, test, expect } from '@jest/globals';

// Colors
import {
  createColorPalette, validateColorValue, applyColorTheme, getColorStatus
} from '../../app-client/themes/colors.js';

// Typography
import {
  createTypographyScale, validateFontSize, applyFontStyle, getTypographyStatus
} from '../../app-client/themes/typography.js';

// Spacing
import {
  createSpacingScale, validateSpacingValue, generateSpacingUtilities, getSpacingStatus
} from '../../app-client/themes/spacing.js';

// Components
import {
  createComponentTheme, validateComponentVariant, applyComponentStyles, getComponentStatus
} from '../../app-client/themes/components.js';

describe('COMMIT 56 - App Client Themes', () => {

  describe('Colors', () => {
    test('createColorPalette crée palette basique', async () => {
      const result = await createColorPalette();
      expect(result.theme).toBe('buzzcraft');
      expect(result.variants).toContain('primary');
      expect(typeof result.colors).toBe('object');
    });

    test('validateColorValue valide hex', async () => {
      const result = await validateColorValue('#3b82f6');
      expect(result.valid).toBe(true);
      expect(result.color).toBe('#3b82f6');
    });

    test('rejette couleur invalide', async () => {
      await expect(validateColorValue('')).rejects.toThrow('ColorError');
    });
  });

  describe('Typography', () => {
    test('createTypographyScale crée échelle basique', async () => {
      const result = await createTypographyScale();
      expect(result.fonts).toContain('sans');
      expect(typeof result.scales).toBe('object');
    });

    test('validateFontSize valide taille', async () => {
      const result = await validateFontSize('1rem');
      expect(result.valid).toBe(true);
      expect(result.fontSize).toBe('1rem');
    });
  });

  describe('Spacing', () => {
    test('createSpacingScale crée échelle basique', async () => {
      const result = await createSpacingScale();
      expect(result.responsive).toBe(true);
      expect(typeof result.scale).toBe('object');
    });

    test('validateSpacingValue valide clé', async () => {
      const result = await validateSpacingValue('1rem');
      expect(result.valid).toBe(true);
    });
  });

  describe('Components', () => {
    test('createComponentTheme crée thème button', async () => {
      const result = await createComponentTheme('button');
      expect(result.component).toBe('button');
      expect(result.variants).toContain('primary');
    });

    test('validateComponentVariant valide variant', async () => {
      const result = await validateComponentVariant('button', 'primary');
      expect(result.valid).toBe(true);
      expect(result.component).toBe('button');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('tous modules ont 4 fonctions', () => {
      // Colors
      expect(typeof createColorPalette).toBe('function');
      expect(typeof validateColorValue).toBe('function');
      expect(typeof applyColorTheme).toBe('function');
      expect(typeof getColorStatus).toBe('function');

      // Typography  
      expect(typeof createTypographyScale).toBe('function');
      expect(typeof validateFontSize).toBe('function');
      expect(typeof applyFontStyle).toBe('function');
      expect(typeof getTypographyStatus).toBe('function');

      // Spacing
      expect(typeof createSpacingScale).toBe('function');
      expect(typeof validateSpacingValue).toBe('function');
      expect(typeof generateSpacingUtilities).toBe('function');
      expect(typeof getSpacingStatus).toBe('function');

      // Components
      expect(typeof createComponentTheme).toBe('function');
      expect(typeof validateComponentVariant).toBe('function');
      expect(typeof applyComponentStyles).toBe('function');
      expect(typeof getComponentStatus).toBe('function');
    });

    test('erreurs typées cohérentes', async () => {
      await expect(createColorPalette('')).rejects.toThrow('ColorError');
      await expect(createTypographyScale('')).rejects.toThrow('TypographyError');
      await expect(createSpacingScale('')).rejects.toThrow('SpacingError');
      await expect(createComponentTheme('')).rejects.toThrow('ComponentError');
    });

    test('structure retour avec timestamp', async () => {
      const colorResult = await createColorPalette();
      expect(colorResult.timestamp).toBeDefined();

      const typographyResult = await createTypographyScale();
      expect(typographyResult.timestamp).toBeDefined();
    });
  });

});

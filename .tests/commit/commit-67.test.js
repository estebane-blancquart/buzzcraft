/**
 * TESTS COMMIT 67 - Panel Settings
 * Tests simples du pattern BuzzCraft 4 fonctions par module
 */

import { describe, test, expect } from '@jest/globals';

// Preferences
import {
  createUserPreferences, validatePreferenceChanges, updateUserPreferences, getPreferencesStatus
} from '../../app-client/panels/settings/preferences.js';

// Integrations
import {
  createIntegrationsManager, validateIntegrationConfig, setupIntegrationSync, getIntegrationsStatus
} from '../../app-client/panels/settings/integrations.js';

// Team
import {
  createTeamManager, validateMemberPermissions, inviteTeamMembers, getTeamStatus
} from '../../app-client/panels/settings/team.js';

// Billing
import {
  createBillingManager, validatePaymentMethod, updateSubscriptionPlan, getBillingStatus
} from '../../app-client/panels/settings/billing.js';

describe('COMMIT 67 - Panel Settings', () => {

  describe('Preferences', () => {
    test('createUserPreferences crée préférences basiques', async () => {
      const result = await createUserPreferences('user-123');
      
      expect(typeof result.preferences).toBe('object');
      expect(Array.isArray(result.categories)).toBe(true);
      expect(typeof result.validation).toBe('object');
      expect(result.preferences.userId).toBe('user-123');
    });

    test('validatePreferenceChanges valide changements', async () => {
      const preferences = { theme: 'light', language: 'fr' };
      const changes = { theme: 'dark', fontSize: 16 };
      const result = await validatePreferenceChanges(preferences, changes);
      
      expect(result.valid).toBe(true);
      expect(result.changes).toBe(2);
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('détecte changements invalides', async () => {
      const preferences = { theme: 'light' };
      const changes = { theme: 'invalid-theme' };
      const result = await validatePreferenceChanges(preferences, changes);
      
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('rejette paramètres invalides', async () => {
      await expect(createUserPreferences('')).rejects.toThrow('PreferenceError');
      await expect(validatePreferenceChanges(null, {})).rejects.toThrow('PreferenceError');
    });
  });

  describe('Integrations', () => {
    test('createIntegrationsManager initialise gestionnaire', async () => {
      const result = await createIntegrationsManager('user-123');
      
      expect(Array.isArray(result.integrations)).toBe(true);
      expect(Array.isArray(result.available)).toBe(true);
      expect(typeof result.connections).toBe('object');
      expect(typeof result.sync).toBe('object');
    });

    test('validateIntegrationConfig valide configuration', async () => {
      const integration = {
        serviceId: 'github',
        name: 'Mon GitHub'
      };
      const credentials = {
        access_token: 'ghp_test_token'
      };
      const result = await validateIntegrationConfig(integration, credentials);
      
      expect(result.valid).toBe(true);
      expect(result.serviceId).toBe('github');
      expect(typeof result.connectionTest).toBe('boolean');
    });

    test('setupIntegrationSync configure synchronisation', async () => {
      const integration = {
        id: 'int-123',
        serviceId: 'github',
        credentials: { access_token: 'token' }
      };
      const syncSettings = {
        direction: 'bidirectional',
        frequency: 'hourly'
      };
      const result = await setupIntegrationSync(integration, syncSettings);
      
      expect(result.configured).toBe(true);
      expect(result.sync.direction).toBe('bidirectional');
      expect(result.sync.frequency).toBe('hourly');
    });

    test('rejette configuration invalide', async () => {
      await expect(createIntegrationsManager('')).rejects.toThrow('IntegrationError');
      await expect(validateIntegrationConfig(null, {})).rejects.toThrow('IntegrationError');
    });
  });

  describe('Team', () => {
    test('createTeamManager initialise gestionnaire équipe', async () => {
      const result = await createTeamManager('team-123');
      
      expect(typeof result.team).toBe('object');
      expect(Array.isArray(result.members)).toBe(true);
      expect(Array.isArray(result.roles)).toBe(true);
      expect(Array.isArray(result.invitations)).toBe(true);
    });

    test('validateMemberPermissions vérifie permissions', async () => {
      const member = {
        id: 'user-123',
        role: 'admin'
      };
      const result = await validateMemberPermissions(member, 'write', 'projects');
      
      expect(typeof result.allowed).toBe('boolean');
      expect(result.member).toBe('user-123');
      expect(result.memberRole).toBe('admin');
      expect(typeof result.checks).toBe('object');
    });

    test('inviteTeamMembers envoie invitations', async () => {
      const invitations = [
        { email: 'newuser@example.com', role: 'editor' }
      ];
      const inviter = {
        id: 'admin-123',
        role: 'admin'
      };
      const result = await inviteTeamMembers('team-123', invitations, inviter);
      
      expect(result.invited).toBe(true);
      expect(Array.isArray(result.results)).toBe(true);
      expect(typeof result.totalInvited).toBe('number');
    });

    test('rejette invitations invalides', async () => {
      const invalidInvitations = [
        { email: 'invalid-email', role: 'nonexistent' }
      ];
      const inviter = { id: 'admin', role: 'admin' };
      const result = await inviteTeamMembers('team-123', invalidInvitations, inviter);
      
      expect(result.totalFailed).toBeGreaterThan(0);
      expect(result.failed.length).toBeGreaterThan(0);
    });
  });

  describe('Billing', () => {
    test('createBillingManager initialise gestionnaire facturation', async () => {
      const result = await createBillingManager('account-123');
      
      expect(typeof result.billing).toBe('object');
      expect(typeof result.subscription).toBe('object');
      expect(typeof result.usage).toBe('object');
      expect(Array.isArray(result.invoices)).toBe(true);
    });

    test('validatePaymentMethod valide méthode paiement', async () => {
      const paymentMethod = {
        type: 'card',
        number: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123'
      };
      const result = await validatePaymentMethod(paymentMethod);
      
      expect(result.valid).toBe(true);
      expect(result.paymentType).toBe('card');
      expect(typeof result.authorizationPassed).toBe('boolean');
    });

    test('détecte carte expirée', async () => {
      const expiredCard = {
        type: 'card',
        number: '4242424242424242',
        expiryMonth: 1,
        expiryYear: 2020, // Expiré
        cvv: '123'
      };
      const result = await validatePaymentMethod(expiredCard);
      
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('expired'))).toBe(true);
    });

    test('updateSubscriptionPlan met à jour abonnement', async () => {
      const result = await updateSubscriptionPlan('account-123', 'enterprise');
      
      expect(result.updated).toBe(true);
      expect(result.newPlan.id).toBe('enterprise');
      expect(typeof result.prorationAmount).toBe('number');
    });

    test('rejette plan inexistant', async () => {
      await expect(updateSubscriptionPlan('account-123', 'nonexistent')).rejects.toThrow('SubscriptionError');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('tous modules ont 4 fonctions', () => {
      // Preferences
      expect(typeof createUserPreferences).toBe('function');
      expect(typeof validatePreferenceChanges).toBe('function');
      expect(typeof updateUserPreferences).toBe('function');
      expect(typeof getPreferencesStatus).toBe('function');

      // Integrations
      expect(typeof createIntegrationsManager).toBe('function');
      expect(typeof validateIntegrationConfig).toBe('function');
      expect(typeof setupIntegrationSync).toBe('function');
      expect(typeof getIntegrationsStatus).toBe('function');

      // Team
      expect(typeof createTeamManager).toBe('function');
      expect(typeof validateMemberPermissions).toBe('function');
      expect(typeof inviteTeamMembers).toBe('function');
      expect(typeof getTeamStatus).toBe('function');

      // Billing
      expect(typeof createBillingManager).toBe('function');
      expect(typeof validatePaymentMethod).toBe('function');
      expect(typeof updateSubscriptionPlan).toBe('function');
      expect(typeof getBillingStatus).toBe('function');
    });

    test('timestamps présents dans tous les retours', async () => {
      const preferences = await createUserPreferences('user-123');
      const integrations = await createIntegrationsManager('user-123');
      const team = await createTeamManager('team-123');
      const billing = await createBillingManager('account-123');

      expect(preferences.timestamp).toBeDefined();
      expect(integrations.timestamp).toBeDefined();
      expect(team.timestamp).toBeDefined();
      expect(billing.timestamp).toBeDefined();

      // Validation format ISO
      expect(new Date(preferences.timestamp).toISOString()).toBe(preferences.timestamp);
      expect(new Date(integrations.timestamp).toISOString()).toBe(integrations.timestamp);
      expect(new Date(team.timestamp).toISOString()).toBe(team.timestamp);
      expect(new Date(billing.timestamp).toISOString()).toBe(billing.timestamp);
    });

    test('gestion erreurs typées cohérente', async () => {
      // Preferences
      await expect(createUserPreferences('')).rejects.toThrow('PreferenceError');
      await expect(validatePreferenceChanges(null, {})).rejects.toThrow('PreferenceError');

      // Integrations
      await expect(createIntegrationsManager('')).rejects.toThrow('IntegrationError');
      await expect(validateIntegrationConfig(null, {})).rejects.toThrow('IntegrationError');

      // Team
      await expect(createTeamManager('')).rejects.toThrow('TeamError');
      await expect(validateMemberPermissions(null, 'action', 'resource')).rejects.toThrow('MemberError');

      // Billing
      await expect(createBillingManager('')).rejects.toThrow('BillingError');
      await expect(validatePaymentMethod(null)).rejects.toThrow('PaymentError');
    });

    test('status functions retournent structure cohérente', async () => {
      const userId = 'user-test';
      const teamId = 'team-test';
      const accountId = 'account-test';

      const prefStatus = await getPreferencesStatus(userId);
      const integrationsStatus = await getIntegrationsStatus(userId);
      const teamStatus = await getTeamStatus(teamId);
      const billingStatus = await getBillingStatus(accountId);

      // Tous ont un status
      expect(prefStatus.status).toBeDefined();
      expect(integrationsStatus.status).toBeDefined();
      expect(teamStatus.status).toBeDefined();
      expect(billingStatus.status).toBeDefined();

      // Propriétés cohérentes
      expect(typeof prefStatus.configured).toBe('boolean');
      expect(typeof integrationsStatus.totalIntegrations).toBe('number');
      expect(typeof teamStatus.activeMembers).toBe('number');
      expect(typeof billingStatus.hasActiveSubscription).toBe('boolean');

      // Tous ont timestamp/lastCheck
      expect(prefStatus.timestamp).toBeDefined();
      expect(integrationsStatus.lastCheck).toBeDefined();
      expect(teamStatus.timestamp).toBeDefined();
      expect(billingStatus.timestamp).toBeDefined();
    });
  });

});

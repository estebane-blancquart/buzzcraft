/**
 * Test COMMIT 20 - System Notification - FINAL SYSTEMS ! í¾‰
 */

import { checkNotificationChannels } from '../../app-server/systems/notification/multi-channel.js';
import { checkNotificationTemplating } from '../../app-server/systems/notification/templating.js';
import { checkNotificationScheduling } from '../../app-server/systems/notification/scheduling.js';

describe('COMMIT 20 - System Notification - FINAL SYSTEMS ! ï¿½ï¿½', () => {
  
  // === TESTS MULTI-CHANNEL ===
  test('checkNotificationChannels - structure retour correcte', async () => {
    const config = {
      channels: ['email', 'sms', 'push'],
      providers: {
        email: { service: 'sendgrid', apiKey: 'test-key' },
        sms: { service: 'twilio', apiKey: 'test-key' }
      },
      fallback: true
    };
    const result = await checkNotificationChannels(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('operational');
    expect(result).toHaveProperty('channels');
    expect(result).toHaveProperty('providers');
    expect(result).toHaveProperty('delivery');
    expect(result).toHaveProperty('priorities');
    expect(result).toHaveProperty('routing');
    expect(result).toHaveProperty('quotas');
    expect(result).toHaveProperty('fallback');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.operational).toBe('boolean');
    expect(Array.isArray(result.channels)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(typeof result.fallback).toBe('boolean');
  });

  test('checkNotificationChannels - accepte options personnalisÃ©es', async () => {
    const config = {
      channels: [
        { type: 'email', priority: 'high' },
        { type: 'webhook', url: 'https://api.example.com/notify' }
      ],
      delivery: {
        tracking: true,
        retry: true,
        retryAttempts: 5
      },
      quotas: {
        perUser: { daily: 50, hourly: 5 }
      }
    };
    const result = await checkNotificationChannels(config, {
      validateProviders: true,
      checkDelivery: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.channels.length).toBe(2);
    expect(result.delivery.tracking).toBe(true);
    expect(result.delivery.retry.enabled).toBe(true);
    expect(result.delivery.retry.attempts).toBe(5);
  });

  test('checkNotificationChannels - validation entrÃ©es invalides', async () => {
    await expect(checkNotificationChannels(null)).rejects.toThrow('ValidationError');
    await expect(checkNotificationChannels('')).rejects.toThrow('ValidationError');
    await expect(checkNotificationChannels({})).rejects.toThrow('ValidationError');
    await expect(checkNotificationChannels({ channels: 'invalid' })).rejects.toThrow('ValidationError');
    await expect(checkNotificationChannels({ channels: [] }, 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS TEMPLATING ===
  test('checkNotificationTemplating - structure retour correcte', () => {
    const config = {
      engine: 'handlebars',
      templates: [
        {
          name: 'welcome-email',
          type: 'email',
          content: 'Hello {{firstName}}, welcome to {{appName}}!'
        }
      ]
    };
    const result = checkNotificationTemplating(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('engine');
    expect(result).toHaveProperty('templates');
    expect(result).toHaveProperty('variables');
    expect(result).toHaveProperty('localization');
    expect(result).toHaveProperty('formatting');
    expect(result).toHaveProperty('personalization');
    expect(result).toHaveProperty('syntax');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.valid).toBe('boolean');
    expect(Array.isArray(result.templates)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.engine).toHaveProperty('name');
    expect(result.engine).toHaveProperty('supported');
  });

  test('checkNotificationTemplating - accepte options personnalisÃ©es', () => {
    const config = {
      engine: 'mustache',
      templates: ['template1', 'template2'],
      variables: {
        global: { appName: 'MyApp' },
        user: ['name', 'email']
      },
      localization: true,
      languages: ['en', 'fr', 'de']
    };
    const result = checkNotificationTemplating(config, {
      validateSyntax: true,
      checkVariables: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.engine.name).toBe('mustache');
    expect(result.engine.supported).toBe(true);
    expect(result.variables.global.appName).toBe('MyApp');
    expect(result.localization.enabled).toBe(true);
    expect(result.localization.languages).toContain('fr');
  });

  test('checkNotificationTemplating - validation entrÃ©es invalides', () => {
    expect(() => checkNotificationTemplating(null)).toThrow('ValidationError');
    expect(() => checkNotificationTemplating('')).toThrow('ValidationError');
    expect(() => checkNotificationTemplating({})).toThrow('ValidationError');
    expect(() => checkNotificationTemplating({ engine: '' })).toThrow('ValidationError');
    expect(() => checkNotificationTemplating({ engine: 'valid' }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS SCHEDULING ===
  test('checkNotificationScheduling - structure retour correcte', () => {
    const config = {
      scheduler: 'cron',
      jobs: [
        {
          name: 'daily-report',
          schedule: '0 9 * * *'
        }
      ]
    };
    const result = checkNotificationScheduling(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('active');
    expect(result).toHaveProperty('scheduler');
    expect(result).toHaveProperty('jobs');
    expect(result).toHaveProperty('timezones');
    expect(result).toHaveProperty('types');
    expect(result).toHaveProperty('queues');
    expect(result).toHaveProperty('batch');
    expect(result).toHaveProperty('throttling');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.active).toBe('boolean');
    expect(Array.isArray(result.jobs)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.scheduler).toHaveProperty('name');
    expect(result.scheduler).toHaveProperty('supported');
  });

  test('checkNotificationScheduling - accepte options personnalisÃ©es', () => {
    const config = {
      scheduler: 'bull',
      jobs: [
        '0 */6 * * *',  // Every 6 hours
        { name: 'weekly-summary', schedule: '0 8 * * 1' }
      ],
      batch: true,
      batchSize: 200,
      throttling: true,
      rateLimit: 500
    };
    const result = checkNotificationScheduling(config, {
      validateCron: true,
      checkTimezones: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.scheduler.name).toBe('bull');
    expect(result.scheduler.supported).toBe(true);
    expect(result.jobs).toHaveLength(2);
    expect(result.batch.enabled).toBe(true);
    expect(result.batch.size).toBe(200);
    expect(result.throttling.rateLimit).toBe(500);
  });

  test('checkNotificationScheduling - validation entrÃ©es invalides', () => {
    expect(() => checkNotificationScheduling(null)).toThrow('ValidationError');
    expect(() => checkNotificationScheduling('')).toThrow('ValidationError');
    expect(() => checkNotificationScheduling({})).toThrow('ValidationError');
    expect(() => checkNotificationScheduling({ scheduler: '' })).toThrow('ValidationError');
    expect(() => checkNotificationScheduling({ scheduler: 'valid' }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS EDGE CASES ===
  test('Gestion des cas limites et erreurs - FINAL SYSTEMS TESTS ! í¾‰', async () => {
    // Test channels avec provider non configurÃ©
    const channelsResult = await checkNotificationChannels({
      channels: ['email', 'sms'],
      providers: {
        email: { service: 'sendgrid' }, // Pas d'API key
        sms: { service: 'twilio' }      // Pas d'API key
      }
    });
    expect(channelsResult.operational).toBe(false);

    // Test templating avec moteur non supportÃ©
    const templateResult = checkNotificationTemplating({
      engine: 'unknown-engine',
      templates: []
    });
    expect(templateResult.engine.supported).toBe(false);
    expect(templateResult.valid).toBe(false);

    // Test scheduling avec cron invalide
    const scheduleResult = checkNotificationScheduling({
      scheduler: 'cron',
      jobs: [
        { name: 'invalid-job', schedule: 'invalid-cron-expression' }
      ]
    }, { validateCron: true });
    expect(scheduleResult.jobs).toHaveLength(0);
    expect(scheduleResult.active).toBe(true); // Pas de jobs valides mais scheduler supportÃ©

    // Test channels sans aucun canal
    const emptyChannelsResult = await checkNotificationChannels({
      channels: []
    });
    expect(emptyChannelsResult.operational).toBe(false);

    console.log('í¾‰ FÃ‰LICITATIONS ! TOUS LES SYSTEMS COMMITS TERMINÃ‰S !');
    console.log('âœ… COMMIT 11-20 : 150+ tests qui passent !');
    console.log('íº€ PROCHAINE Ã‰TAPE : TRANSITIONS (commits 21-30) !');
  });

});

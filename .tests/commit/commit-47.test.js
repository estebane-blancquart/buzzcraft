/**
 * Test COMMIT 47 - API Rate Limiting
 */

import { 
  checkThrottleLimit, 
  resetThrottleCounter, 
  getThrottleStatus,
  getThrottleStats 
} from '../../api/rate-limiting/throttling.js';

import { 
  checkQuotaLimit, 
  updateUserQuotaPlan, 
  getUserQuotaSummary,
  resetUserUsage,
  getQuotaAnalytics 
} from '../../api/rate-limiting/quotas.js';

import { 
  analyzeAbuseRisk, 
  blockIdentifier, 
  unblockIdentifier,
  getAbuseReport,
  getAbuseStats 
} from '../../api/rate-limiting/abuse-prevention.js';

describe('COMMIT 47 - API Rate Limiting', () => {

  describe('Module throttling.js', () => {
    test('checkThrottleLimit applique limite token bucket', async () => {
      const result = await checkThrottleLimit('user123', 'token_bucket', {
        requests: 10,
        windowMs: 60000,
        refillRate: 1000
      });
      
      expect(typeof result.allowed).toBe('boolean');
      expect(typeof result.remaining).toBe('number');
      expect(typeof result.resetTime).toBe('number');
      expect(typeof result.retryAfter).toBe('number');
      expect(result.identifier).toBe('user123');
      expect(result.algorithm).toBe('token_bucket');
      expect(result.algorithmName).toBe('Token Bucket');
      expect(typeof result.limits).toBe('object');
      expect(result.timestamp).toBeDefined();
    });
    
    test('checkThrottleLimit bloque après limite dépassée', async () => {
      const limits = { requests: 2, windowMs: 60000, refillRate: 10000 };
      
      const first = await checkThrottleLimit('user456', 'token_bucket', limits);
      expect(first.allowed).toBe(true);
      expect(first.remaining).toBe(1);
      
      const second = await checkThrottleLimit('user456', 'token_bucket', limits);
      expect(second.allowed).toBe(true);
      expect(second.remaining).toBe(0);
      
      const third = await checkThrottleLimit('user456', 'token_bucket', limits);
      expect(third.allowed).toBe(false);
      expect(third.remaining).toBe(0);
      expect(third.retryAfter).toBeGreaterThan(0);
    });
    
    test('checkThrottleLimit rejette algorithme invalide', async () => {
      await expect(checkThrottleLimit('user123', 'invalid_algorithm'))
        .rejects.toThrow('AlgorithmError');
    });
  });

  describe('Module quotas.js', () => {
    test('checkQuotaLimit vérifie quota utilisateur', async () => {
      const result = await checkQuotaLimit('user123', 'api_calls', 1);
      
      expect(typeof result.allowed).toBe('boolean');
      expect(typeof result.usage).toBe('object');
      expect(typeof result.limits).toBe('object');
      expect(typeof result.remaining).toBe('object');
      expect(result.resourceType).toBe('api_calls');
      expect(result.amount).toBe(1);
      expect(result.timestamp).toBeDefined();
    });
    
    test('updateUserQuotaPlan change plan utilisateur', async () => {
      const result = await updateUserQuotaPlan('plan_test', 'pro');
      
      expect(result.updated).toBe(true);
      expect(result.userId).toBe('plan_test');
      expect(result.plan).toBe('pro');
      expect(result.planName).toBe('Pro Plan');
      expect(typeof result.limits).toBe('object');
      expect(result.timestamp).toBeDefined();
    });
    
    test('checkQuotaLimit rejette type ressource invalide', async () => {
      await expect(checkQuotaLimit('user123', 'invalid_resource', 1))
        .rejects.toThrow('ResourceError');
    });
  });

  describe('Module abuse-prevention.js', () => {
    test('analyzeAbuseRisk analyse requête normale', async () => {
      const request = {
        method: 'GET',
        endpoint: '/api/projects',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (compatible browser)',
        headers: { 'Accept': 'application/json' },
        statusCode: 200
      };
      
      const result = await analyzeAbuseRisk('normal_user', request);
      
      expect(typeof result.threat).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.patterns)).toBe(true);
      expect(Array.isArray(result.actions)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.identifier).toBe('normal_user');
      expect(result.timestamp).toBeDefined();
    });
    
    test('blockIdentifier bloque utilisateur', async () => {
      const result = await blockIdentifier('blocked_user', 60000, 'test_block');
      
      expect(result.blocked).toBe(true);
      expect(result.identifier).toBe('blocked_user');
      expect(result.reason).toBe('test_block');
      expect(typeof result.duration).toBe('number');
      expect(result.timestamp).toBeDefined();
    });
    
    test('analyzeAbuseRisk rejette identifiant vide', async () => {
      await expect(analyzeAbuseRisk('', {}))
        .rejects.toThrow('AbuseError');
    });
  });

  describe('Tests validation paramètres', () => {
    test('throttling - validation paramètres requis', async () => {
      await expect(checkThrottleLimit('', 'token_bucket'))
        .rejects.toThrow('IdentifierError');
      await expect(checkThrottleLimit('user', 'invalid_algo'))
        .rejects.toThrow('AlgorithmError');
    });
    
    test('quotas - validation paramètres requis', async () => {
      await expect(checkQuotaLimit('', 'api_calls'))
        .rejects.toThrow('UserError');
      await expect(checkQuotaLimit('user', 'invalid_resource'))
        .rejects.toThrow('ResourceError');
      await expect(updateUserQuotaPlan('', 'free'))
        .rejects.toThrow('UserError');
    });
    
    test('abuse-prevention - validation paramètres requis', async () => {
      await expect(analyzeAbuseRisk('', {}))
        .rejects.toThrow('AbuseError');
      await expect(analyzeAbuseRisk('user', null))
        .rejects.toThrow('AbuseError');
    });
  });

});

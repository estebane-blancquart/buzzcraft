/**
 * COMMIT 67 - Panel Settings
 * 
 * FAIT QUOI : Facturation et abonnements avec gestion paiements et usage temps réel
 * REÇOIT : accountId: string, billingPeriod?: string, includeUsage?: boolean
 * RETOURNE : { billing: object, subscription: object, usage: object, invoices: object[] }
 * ERREURS : BillingError si compte invalide, PaymentError si paiement échoue, SubscriptionError si abonnement introuvable
 */

export async function createBillingManager(accountId, billingPeriod = 'monthly', includeUsage = true) {
  if (!accountId || typeof accountId !== 'string') {
    throw new Error('BillingError: AccountId requis string');
  }

  if (!['monthly', 'yearly'].includes(billingPeriod)) {
    throw new Error('BillingError: BillingPeriod doit être monthly ou yearly');
  }

  if (typeof includeUsage !== 'boolean') {
    throw new Error('BillingError: IncludeUsage doit être boolean');
  }

  try {
    const billing = await getBillingInfo(accountId);
    const subscription = await getCurrentSubscription(accountId);
    const usage = includeUsage ? await getCurrentUsage(accountId, billingPeriod) : null;
    const recentInvoices = await getRecentInvoices(accountId, 5);

    return {
      billing,
      subscription,
      usage,
      invoices: recentInvoices,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`BillingError: Création gestionnaire facturation échouée: ${error.message}`);
  }
}

export async function validatePaymentMethod(paymentMethod, billingAddress = {}) {
  if (!paymentMethod || typeof paymentMethod !== 'object') {
    throw new Error('PaymentError: PaymentMethod requis object');
  }

  if (typeof billingAddress !== 'object') {
    throw new Error('BillingError: BillingAddress doit être object');
  }

  try {
    const issues = [];
    const warnings = [];

    // Validation type de paiement
    if (!paymentMethod.type || !['card', 'bank_transfer', 'paypal'].includes(paymentMethod.type)) {
      issues.push('invalid_payment_type');
    }

    // Validation spécifique carte
    if (paymentMethod.type === 'card') {
      if (!paymentMethod.number || !isValidCardNumber(paymentMethod.number)) {
        issues.push('invalid_card_number');
      }

      if (!paymentMethod.expiryMonth || !paymentMethod.expiryYear) {
        issues.push('missing_expiry_date');
      } else {
        const isExpired = isCardExpired(paymentMethod.expiryMonth, paymentMethod.expiryYear);
        if (isExpired) {
          issues.push('card_expired');
        } else {
          const expiresIn = getMonthsUntilExpiry(paymentMethod.expiryMonth, paymentMethod.expiryYear);
          if (expiresIn <= 2) {
            warnings.push('card_expires_soon');
          }
        }
      }

      if (!paymentMethod.cvv || paymentMethod.cvv.length < 3) {
        issues.push('invalid_cvv');
      }
    }

    // Test autorisation si informations complètes
    let authorizationTest = null;
    if (issues.length === 0 && paymentMethod.type === 'card') {
      authorizationTest = await testCardAuthorization(paymentMethod);
    }

    return {
      valid: issues.length === 0,
      paymentType: paymentMethod.type,
      authorizationPassed: authorizationTest?.success || false,
      issues,
      warnings,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`PaymentError: Validation méthode paiement échouée: ${error.message}`);
  }
}

export async function updateSubscriptionPlan(accountId, newPlanId, options = {}) {
  if (!accountId || typeof accountId !== 'string') {
    throw new Error('BillingError: AccountId requis string');
  }

  if (!newPlanId || typeof newPlanId !== 'string') {
    throw new Error('SubscriptionError: NewPlanId requis string');
  }

  const prorated = options.prorated !== false;
  const immediateChange = options.immediateChange || false;

  try {
    const currentSubscription = await getCurrentSubscription(accountId);
    const availablePlans = await getAvailablePlans();
    const newPlan = availablePlans.find(plan => plan.id === newPlanId);

    if (!newPlan) {
      throw new Error('SubscriptionError: Plan demandé introuvable');
    }

    // Calcul prorata si applicable
    let prorationAmount = 0;
    if (prorated && currentSubscription.plan.price !== newPlan.price) {
      prorationAmount = calculateProration(currentSubscription, newPlan);
    }

    // Simulation changement
    const effectiveDate = immediateChange ? 
      new Date().toISOString() : 
      currentSubscription.nextBillingDate;

    const updatedSubscription = {
      ...currentSubscription,
      plan: newPlan,
      effectiveDate,
      prorationAmount,
      status: immediateChange ? 'active' : 'pending_change'
    };

    return {
      updated: true,
      subscription: updatedSubscription,
      previousPlan: currentSubscription.plan,
      newPlan,
      prorationAmount,
      effectiveDate,
      immediateChange,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`SubscriptionError: Mise à jour abonnement échouée: ${error.message}`);
  }
}

export async function getBillingStatus(accountId, options = {}) {
  if (!accountId || typeof accountId !== 'string') {
    throw new Error('BillingError: AccountId requis string');
  }

  try {
    const billing = await getBillingInfo(accountId);
    const subscription = await getCurrentSubscription(accountId);
    const usage = await getCurrentUsage(accountId, 'monthly');
    
    const hasActiveSubscription = subscription && subscription.status === 'active';
    const hasValidPaymentMethod = billing.paymentMethod && billing.paymentMethod.valid;
    const isOverUsage = usage && usage.overageAmount > 0;

    let status = 'unknown';
    if (!hasActiveSubscription) {
      status = 'no_subscription';
    } else if (!hasValidPaymentMethod) {
      status = 'payment_issue';
    } else if (isOverUsage) {
      status = 'overage';
    } else {
      status = 'active';
    }

    const nextBilling = subscription?.nextBillingDate || null;
    const nextAmount = subscription ? 
      subscription.plan.price + (usage?.overageAmount || 0) : 
      0;

    return {
      status,
      accountId,
      hasActiveSubscription,
      hasValidPaymentMethod,
      currentPlan: subscription?.plan?.name || 'Aucun',
      nextBillingDate: nextBilling,
      nextBillingAmount: nextAmount,
      usage: usage?.percentage || 0,
      overageAmount: usage?.overageAmount || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      accountId,
      issues: [`status_check_failed: ${error.message}`],
      timestamp: new Date().toISOString()
    };
  }
}

// Helper functions
async function getBillingInfo(accountId) {
  return {
    accountId,
    customerId: 'cust_' + accountId,
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'visa',
      valid: true
    },
    currency: 'EUR'
  };
}

async function getCurrentSubscription(accountId) {
  return {
    id: 'sub_' + accountId,
    accountId,
    plan: {
      id: 'pro',
      name: 'Pro',
      price: 29.99,
      currency: 'EUR',
      interval: 'monthly'
    },
    status: 'active',
    nextBillingDate: new Date(Date.now() + 86400000 * 15).toISOString()
  };
}

async function getCurrentUsage(accountId, period) {
  return {
    period,
    projects: {
      used: 7,
      limit: 10,
      percentage: 70
    },
    overageAmount: 0,
    timestamp: new Date().toISOString()
  };
}

async function getRecentInvoices(accountId, limit) {
  const invoices = [];
  for (let i = 0; i < limit; i++) {
    invoices.push({
      id: `inv_${i + 1}`,
      accountId,
      amount: 29.99,
      currency: 'EUR',
      status: 'paid',
      date: new Date(Date.now() - i * 86400000 * 30).toISOString()
    });
  }
  return invoices;
}

function isValidCardNumber(number) {
  const cleanNumber = number.replace(/\s/g, '');
  return cleanNumber.length >= 13 && cleanNumber.length <= 19 && /^\d+$/.test(cleanNumber);
}

function isCardExpired(month, year) {
  const now = new Date();
  const expiry = new Date(year, month - 1);
  return expiry < now;
}

function getMonthsUntilExpiry(month, year) {
  const now = new Date();
  const expiry = new Date(year, month - 1);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
}

async function testCardAuthorization(paymentMethod) {
  return {
    success: Math.random() > 0.1, // 90% success
    responseCode: '00',
    message: 'Authorization successful'
  };
}

async function getAvailablePlans() {
  return [
    {
      id: 'starter',
      name: 'Starter',
      price: 9.99,
      currency: 'EUR'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29.99,
      currency: 'EUR'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99.99,
      currency: 'EUR'
    }
  ];
}

function calculateProration(currentSub, newPlan) {
  const daysRemaining = Math.ceil(
    (new Date(currentSub.nextBillingDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const daysInPeriod = 30;
  const priceDiff = newPlan.price - currentSub.plan.price;
  
  return Math.round((priceDiff * daysRemaining / daysInPeriod) * 100) / 100;
}

// panels/settings/billing : Panel Settings (commit 67)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/

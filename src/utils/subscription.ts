export type SubscriptionPlan = 'none' | 'start' | 'pro' | 'business' | 'enterprise';

export interface SubscriptionLimits {
  maxUnits: number;
  hasCalendar: boolean;
  hasDiagnostics: boolean;
  hasClub: boolean;
  hasSimulator: boolean;
}

const planLimits: Record<SubscriptionPlan, SubscriptionLimits> = {
  none: {
    maxUnits: 0,
    hasCalendar: false,
    hasDiagnostics: false,
    hasClub: false,
    hasSimulator: true,
  },
  start: {
    maxUnits: 2,
    hasCalendar: true,
    hasDiagnostics: true,
    hasClub: false,
    hasSimulator: true,
  },
  pro: {
    maxUnits: 5,
    hasCalendar: true,
    hasDiagnostics: true,
    hasClub: true,
    hasSimulator: true,
  },
  business: {
    maxUnits: 999,
    hasCalendar: true,
    hasDiagnostics: true,
    hasClub: true,
    hasSimulator: true,
  },
  enterprise: {
    maxUnits: 999,
    hasCalendar: true,
    hasDiagnostics: true,
    hasClub: true,
    hasSimulator: true,
  },
};

export function getUserSubscription(): SubscriptionPlan {
  const userStr = localStorage.getItem('user');
  if (!userStr) return 'none';
  
  try {
    const user = JSON.parse(userStr);
    const plan = user.subscription_plan || 'none';
    
    // Проверка истечения подписки
    if (plan !== 'none' && user.subscription_expires_at) {
      const expiresAt = new Date(user.subscription_expires_at);
      if (expiresAt < new Date()) {
        return 'none'; // Подписка истекла
      }
    }
    
    return plan;
  } catch {
    return 'none';
  }
}

export function getSubscriptionLimits(plan?: SubscriptionPlan): SubscriptionLimits {
  const userPlan = plan || getUserSubscription();
  return planLimits[userPlan];
}

export function canAccessFeature(feature: keyof Omit<SubscriptionLimits, 'maxUnits'>): boolean {
  const limits = getSubscriptionLimits();
  return limits[feature];
}

export function canAddUnit(currentUnitsCount: number): boolean {
  const limits = getSubscriptionLimits();
  return currentUnitsCount < limits.maxUnits;
}

export function getPlanName(plan: SubscriptionPlan): string {
  const names: Record<SubscriptionPlan, string> = {
    none: 'Без подписки',
    start: 'START',
    pro: 'PRO',
    business: 'BUSINESS',
    enterprise: 'ENTERPRISE',
  };
  return names[plan];
}

export function getPlanEmoji(plan: SubscriptionPlan): string {
  const emojis: Record<SubscriptionPlan, string> = {
    none: '⚪',
    start: '🟢',
    pro: '🔵',
    business: '🟣',
    enterprise: '🔴',
  };
  return emojis[plan];
}
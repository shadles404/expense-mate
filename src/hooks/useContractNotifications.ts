import { useMemo } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import type { TikTokInfluencer } from '@/types/tiktok';

export interface ContractNotification {
  influencer: TikTokInfluencer;
  daysRemaining: number;
  severity: 'urgent' | 'warning' | 'info';
  message: string;
}

export function useContractNotifications(influencers: TikTokInfluencer[]) {
  const notifications = useMemo(() => {
    const today = new Date();
    const alerts: ContractNotification[] = [];

    influencers
      .filter(i => i.is_active && i.agreement_end_date)
      .forEach(i => {
        const endDate = parseISO(i.agreement_end_date!);
        const daysRemaining = differenceInDays(endDate, today);

        if (daysRemaining <= 0) {
          alerts.push({
            influencer: i,
            daysRemaining,
            severity: 'urgent',
            message: `Contract expired${daysRemaining === 0 ? ' today' : ` ${Math.abs(daysRemaining)} days ago`}`,
          });
        } else if (daysRemaining <= 7) {
          alerts.push({
            influencer: i,
            daysRemaining,
            severity: 'urgent',
            message: `Contract ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
          });
        } else if (daysRemaining <= 30) {
          alerts.push({
            influencer: i,
            daysRemaining,
            severity: 'warning',
            message: `Contract ends in ${daysRemaining} days`,
          });
        }
      });

    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [influencers]);

  const expiringCount = notifications.length;
  const urgentCount = notifications.filter(n => n.severity === 'urgent').length;

  return { notifications, expiringCount, urgentCount };
}

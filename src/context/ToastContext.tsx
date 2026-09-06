import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { formatCredits, formatInr, formatNumber } from '../utils/formatters.js';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'surf' | 'upi' | 'mystery';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string | React.ReactNode;
  badge?: string;
  duration?: number;
  icon?: React.ReactNode;
  metadata?: {
    credits?: number;
    amountInr?: number;
    utr?: string;
    multiplier?: number;
    streak?: number;
    reference?: string;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: number;
}

interface ToastOptions {
  description?: string | React.ReactNode;
  badge?: string;
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: ToastItem['metadata'];
}

interface SurfToastParams {
  creditsEarned: number;
  multiplier?: number;
  streak?: number;
  mysteryBonus?: number;
  campaignTitle?: string;
  onViewLedger?: () => void;
}

interface UpiToastParams {
  credits: number;
  inrAmount: number;
  utr?: string;
  reference?: string;
  onViewCampaigns?: () => void;
}

interface ToastFunction {
  (
    paramsOrTitle:
      | {
          title: string;
          description?: string | React.ReactNode;
          variant?: 'success' | 'error' | 'info' | 'warning' | ToastType;
          duration?: number;
        }
      | string,
    options?: ToastOptions
  ): string;
  success: (title: string, options?: ToastOptions) => string;
  error: (title: string, options?: ToastOptions) => string;
  info: (title: string, options?: ToastOptions) => string;
  warning: (title: string, options?: ToastOptions) => string;
  surfSuccess: (params: SurfToastParams) => string;
  upiSuccess: (params: UpiToastParams) => string;
  mysteryReward: (title: string, credits: number, milestone: number) => string;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (type: ToastType, title: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  toast: ToastFunction;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, options?: ToastOptions): string => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9) + Date.now();
      const newToast: ToastItem = {
        id,
        type,
        title,
        description: options?.description,
        badge: options?.badge,
        duration: options?.duration ?? (type === 'upi' || type === 'mystery' ? 6000 : 4500),
        icon: options?.icon,
        metadata: options?.metadata,
        action: options?.action,
        createdAt: Date.now(),
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep maximum 5 active toasts
      return id;
    },
    []
  );

  const toastHelpers = useMemo<ToastFunction>(() => {
    const fn: any = (
      paramsOrTitle:
        | {
            title: string;
            description?: string | React.ReactNode;
            variant?: 'success' | 'error' | 'info' | 'warning' | ToastType;
            duration?: number;
          }
        | string,
      options?: ToastOptions
    ) => {
      if (typeof paramsOrTitle === 'string') {
        return showToast('info', paramsOrTitle, options);
      }
      const type: ToastType = (paramsOrTitle.variant as ToastType) || 'info';
      return showToast(type, paramsOrTitle.title, {
        description: paramsOrTitle.description,
        duration: paramsOrTitle.duration ?? options?.duration,
        ...options,
      });
    };

    fn.success = (title: string, options?: ToastOptions) => showToast('success', title, options);
    fn.error = (title: string, options?: ToastOptions) => showToast('error', title, options);
    fn.info = (title: string, options?: ToastOptions) => showToast('info', title, options);
    fn.warning = (title: string, options?: ToastOptions) => showToast('warning', title, options);
    fn.surfSuccess = ({ creditsEarned, multiplier = 1, streak = 1, mysteryBonus, campaignTitle, onViewLedger }: SurfToastParams) => {
      return showToast('surf', `+${formatCredits(creditsEarned)} Credits Earned!`, {
        description: campaignTitle ? `Surfed: ${campaignTitle}` : `Session verified with ${multiplier}x multiplier (Streak #${streak})`,
        badge: streak > 1 ? `${multiplier}x Multiplier` : 'Surfing Complete',
        duration: 5000,
        metadata: {
          credits: creditsEarned,
          multiplier,
          streak
        },
        action: onViewLedger
          ? {
              label: 'View Ledger',
              onClick: onViewLedger,
            }
          : undefined,
      });
    };
    fn.upiSuccess = ({ credits, inrAmount, utr, reference, onViewCampaigns }: UpiToastParams) => {
      return showToast('upi', `UPI Payment Confirmed • +${formatCredits(credits)} Credits`, {
        description: `Received ${formatInr(inrAmount)} (Kotak 811). ${utr ? `UTR: ${utr}` : ''}`,
        badge: 'Kotak 811 Verified',
        duration: 7000,
        metadata: {
          credits,
          amountInr: inrAmount,
          utr,
          reference
        },
        action: onViewCampaigns
          ? {
              label: 'Start Campaign',
              onClick: onViewCampaigns,
            }
          : undefined,
      });
    };
    fn.mysteryReward = (title: string, credits: number, milestone: number) => {
      return showToast('mystery', `🎁 Milestone Unlocked: +${formatCredits(credits)} Bonus Credits!`, {
        description: `You reached the ${milestone}-site surfing milestone! Mystery box prize credited.`,
        badge: `${milestone} Sites Surf Streak`,
        duration: 6500,
        metadata: { credits }
      });
    };

    return fn as ToastFunction;
  }, [showToast]);

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
      clearAllToasts,
      toast: toastHelpers,
    }),
    [toasts, showToast, dismissToast, clearAllToasts, toastHelpers]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

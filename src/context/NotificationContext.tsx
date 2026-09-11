import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext.js';
import { useToast } from './ToastContext.js';
import { api } from '../services/api.js';
import { AppNotification } from '../types.js';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  refreshNotifications: (silent?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllRead: () => Promise<void>;
  triggerTestEvent: (type: 'campaign_test_to_active' | 'user_inactivity' | 'user_reactivated' | 'system', campaignId?: string, reason?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Set of notification IDs that have already alerted via toast in this session
  const alertedNotificationIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef<boolean>(true);

  const refreshNotifications = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;
    try {
      if (!silent) setIsLoading(true);
      const res = await api.getNotifications(40);
      const fetchedNotifications = res.notifications || [];
      const fetchedUnreadCount = res.unreadCount ?? fetchedNotifications.filter(n => !n.read).length;

      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedUnreadCount);

      // On initial load, mark existing notifications as known so we don't spam toasts on page refresh
      if (isInitialLoad.current) {
        fetchedNotifications.forEach(n => alertedNotificationIds.current.add(n.id));
        isInitialLoad.current = false;
        return;
      }

      // Check for newly arrived unread notifications and trigger global Toast notifications
      for (const item of fetchedNotifications) {
        if (!item.read && !alertedNotificationIds.current.has(item.id)) {
          alertedNotificationIds.current.add(item.id);

          // Customize toast styling and sound according to event type
          if (item.type === 'campaign_status' && item.metadata?.from_status === 'test' && item.metadata?.to_status === 'active') {
            toast({
              title: item.title || '🎉 Campaign Activated: Live Traffic Online!',
              description: item.message,
              variant: 'success',
              duration: 9000
            });
          } else if (item.type === 'user_inactivity') {
            toast({
              title: item.title || '⚠️ Account Inactivity Alert',
              description: item.message,
              variant: 'warning',
              duration: 12000
            });
            // Also refresh auth user state to reflect 'inactive' status in header/profile
            refreshUser();
          } else if (item.type === 'user_reactivated') {
            toast({
              title: item.title || '✅ Account Reactivated',
              description: item.message,
              variant: 'success',
              duration: 7000
            });
            refreshUser();
          } else if (item.type === 'campaign_upgrade') {
            toast({
              title: item.title || '⭐ Campaign Upgraded',
              description: item.message,
              variant: 'info',
              duration: 8000
            });
          } else {
            toast({
              title: item.title,
              description: item.message,
              variant: 'info',
              duration: 6000
            });
          }
        }
      }
    } catch {
      // Non-blocking
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [isAuthenticated, toast, refreshUser]);

  // Polling loop
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      isInitialLoad.current = true;
      return;
    }

    refreshNotifications(false);

    // Poll every 10 seconds for real-time notification delivery
    const interval = setInterval(() => {
      refreshNotifications(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshNotifications]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      await api.markNotificationRead(id);
    } catch {
      refreshNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      await api.markAllNotificationsRead();
    } catch {
      refreshNotifications(true);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
      await api.deleteNotification(id);
    } catch {
      refreshNotifications(true);
    }
  };

  const clearAllRead = async () => {
    try {
      setNotifications(prev => prev.filter(n => !n.read));
      await api.clearReadNotifications();
    } catch {
      refreshNotifications(true);
    }
  };

  const triggerTestEvent = async (type: 'campaign_test_to_active' | 'user_inactivity' | 'user_reactivated' | 'system', campaignId?: string, reason?: string) => {
    try {
      const res = await api.triggerTestNotification(type, campaignId, reason);
      if (res.success && res.notification) {
        // Immediate fetch to catch new event
        await refreshNotifications(true);
      }
    } catch (err: any) {
      toast({
        title: 'Notification Trigger Failed',
        description: err.message,
        variant: 'error'
      });
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isOpen,
        setIsOpen,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllRead,
        triggerTestEvent
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

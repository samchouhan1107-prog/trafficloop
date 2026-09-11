import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes idle timeout (prevents premature inactivity during viewing)
const HEARTBEAT_INTERVAL_MS = 60 * 1000;      // 60 seconds heartbeat

export function useInactivityDetector() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { toast } = useToast();

  const lastActivityRef = useRef<number>(Date.now());
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyIdleRef = useRef<boolean>(false);

  // Mark account idle via backend
  const triggerInactivity = useCallback(async (reason = 'Session idle timeout (5+ min inactivity)') => {
    if (!isAuthenticated || user?.status === 'inactive' || isCurrentlyIdleRef.current) return;
    try {
      isCurrentlyIdleRef.current = true;
      const res = await api.setAccountIdle(reason);
      if (res.user) {
        refreshUser();
      }
    } catch {
      // Non-blocking
    }
  }, [isAuthenticated, user?.status, refreshUser]);

  // Reactivate account
  const reactivateAccount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.reactivateAccount();
      isCurrentlyIdleRef.current = false;
      lastActivityRef.current = Date.now();
      refreshUser();
      toast({
        title: 'Account Reactivated',
        description: 'Your exchange session and active campaign routing have resumed.',
        variant: 'success'
      });
    } catch (err: any) {
      toast({
        title: 'Reactivation Failed',
        description: err.message,
        variant: 'error'
      });
    }
  }, [isAuthenticated, refreshUser, toast]);

  // Handle detected user input/activity
  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Reset status tracker
    if (user?.status === 'inactive') {
      isCurrentlyIdleRef.current = true;
    } else {
      isCurrentlyIdleRef.current = false;
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const onEvent = () => handleUserActivity();

    events.forEach(evt => window.addEventListener(evt, onEvent, { passive: true }));

    // Routine Idle Checker (Runs every 15 seconds)
    idleCheckTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT_MS && !isCurrentlyIdleRef.current && user?.status !== 'inactive') {
        triggerInactivity('Automatic idle safety timeout (5+ min inactive)');
      }
    }, 15000);

    // Routine Heartbeat (Sends active ping every 60s if user has interacted)
    heartbeatTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed < INACTIVITY_TIMEOUT_MS && user?.status === 'active') {
        api.heartbeatActivity().catch(() => {});
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, onEvent));
      if (idleCheckTimerRef.current) clearInterval(idleCheckTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [isAuthenticated, user?.status, handleUserActivity, triggerInactivity]);

  return {
    isInactive: user?.status === 'inactive',
    inactivityReason: user?.inactivity_reason,
    reactivateAccount,
    triggerInactivity
  };
}

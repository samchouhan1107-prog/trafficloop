import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext.js';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Rocket, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  ExternalLink, 
  X,
  PlayCircle,
  FlaskConical,
  RefreshCw
} from 'lucide-react';
import { AppNotification } from '../../types.js';

interface NotificationCenterProps {
  onNavigate?: (path: string) => void;
}

export function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    isOpen, 
    setIsOpen, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllRead,
    triggerTestEvent
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'campaigns' | 'inactivity'>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'campaigns') return n.type === 'campaign_status' || n.type === 'campaign_upgrade';
    if (filter === 'inactivity') return n.type === 'user_inactivity' || n.type === 'user_reactivated';
    return true;
  });

  const getNotificationIcon = (item: AppNotification) => {
    if (item.type === 'campaign_status') {
      if (item.metadata?.from_status === 'test' && item.metadata?.to_status === 'active') {
        return <Rocket className="h-4 w-4 text-emerald-400" />;
      }
      return <Layers className="h-4 w-4 text-cyan-400" />;
    }
    if (item.type === 'user_inactivity') {
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    }
    if (item.type === 'user_reactivated') {
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    }
    if (item.type === 'campaign_upgrade') {
      return <Sparkles className="h-4 w-4 text-purple-400" />;
    }
    return <Bell className="h-4 w-4 text-slate-400" />;
  };

  const handleSimulate = async (type: 'campaign_test_to_active' | 'user_inactivity') => {
    try {
      setIsSimulating(true);
      await triggerTestEvent(type);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleItemClick = (item: AppNotification) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    if (item.link && onNavigate) {
      setIsOpen(false);
      onNavigate(item.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="btn-header-notifications"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
          isOpen
            ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300'
            : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
        }`}
        title="Notifications & Status Alerts"
      >
        <Bell className="h-4 w-4" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="notification-dropdown-panel"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-md z-50 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-cyan-950 border border-cyan-800 px-2 py-0.2 text-[10px] font-semibold text-cyan-300">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  id="btn-mark-all-read"
                  onClick={markAllAsRead}
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}

              {notifications.some(n => n.read) && (
                <button
                  id="btn-clear-read-notifications"
                  onClick={clearAllRead}
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
                  title="Clear read notifications"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Simulation / Interactive Trigger Bar */}
          <div className="bg-slate-950/80 px-3 py-2 border-b border-slate-800/80 flex items-center justify-between gap-1 text-[11px]">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <FlaskConical className="h-3 w-3 text-cyan-400" />
              <span>Simulate:</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                id="btn-test-activate-campaign"
                onClick={() => handleSimulate('campaign_test_to_active')}
                disabled={isSimulating}
                className="rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/70 text-emerald-300 px-2 py-0.5 font-medium transition disabled:opacity-50"
                title="Test campaign status transition from 'test' to 'active'"
              >
                Test → Active
              </button>
              <button
                id="btn-test-inactivity"
                onClick={() => handleSimulate('user_inactivity')}
                disabled={isSimulating}
                className="rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-800/70 text-amber-300 px-2 py-0.5 font-medium transition disabled:opacity-50"
                title="Trigger account inactivity alert"
              >
                Inactivity
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-800 px-3 py-1.5 bg-slate-900/60 text-xs">
            {(['all', 'unread', 'campaigns', 'inactivity'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                  filter === tab
                    ? 'bg-slate-800 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-1">
                <Bell className="mx-auto h-8 w-8 text-slate-600 mb-2 opacity-60" />
                <p className="font-semibold text-slate-400">No notifications found</p>
                <p className="text-[11px] text-slate-500">
                  {filter === 'unread'
                    ? 'All caught up! No unread notifications.'
                    : 'Activity and status alerts will appear here in real-time.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group relative flex items-start gap-3 p-3 rounded-xl transition cursor-pointer ${
                    item.read
                      ? 'hover:bg-slate-800/40 text-slate-300'
                      : 'bg-cyan-950/20 hover:bg-cyan-950/30 text-white'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 rounded-lg bg-slate-800 p-2 border border-slate-700/60">
                    {getNotificationIcon(item)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <h4 className="text-xs font-bold truncate tracking-tight text-white">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300/90 leading-snug line-clamp-2">
                      {item.message}
                    </p>

                    {item.metadata?.from_status && item.metadata?.to_status && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
                          {item.metadata.from_status}
                        </span>
                        <span className="text-[10px] text-cyan-400">→</span>
                        <span className="rounded bg-emerald-950 px-1.5 py-0.2 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-800">
                          {item.metadata.to_status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                    {!item.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                        }}
                        className="p-1 text-cyan-400 hover:text-white rounded"
                        title="Mark read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

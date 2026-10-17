import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { InAppNotification } from '../types/phase3';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Calendar,
  FileText,
  Clock,
  ExternalLink,
  Info,
  X,
} from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    if (!user) return;
    const list = await notificationService.getNotifications(user.id);
    setNotifications(list);
    setUnreadCount(list.filter((n) => !n.read).length);
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = async (notif: InAppNotification) => {
    await notificationService.markAsRead(notif.id);
    await fetchNotifs();
    setIsOpen(false);
    if (notif.targetUrl) {
      navigate(notif.targetUrl);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    await fetchNotifs();
  };

  const providerStatus = notificationService.getExternalProviderStatus();

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-sky-500"
        title="Notifications & Reminders"
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[90vw] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-semibold bg-sky-100 text-sky-800 rounded-md">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-sky-700 hover:text-sky-900 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">No notifications right now.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Circular publications and schedule clash alerts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isCritical = n.urgency === 'critical';
                const isHigh = n.urgency === 'high';

                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left p-3.5 hover:bg-slate-50/80 transition-colors flex items-start gap-3 relative ${
                      !n.read ? 'bg-sky-50/30' : ''
                    }`}
                  >
                    {!n.read && (
                      <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-sky-600" />
                    )}

                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                        n.type === 'clash_detected'
                          ? 'bg-rose-100 text-rose-700'
                          : n.type === 'notice_revised'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {n.type === 'clash_detected' ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : n.type === 'notice_revised' ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-xs font-semibold truncate ${!n.read ? 'text-slate-900 font-bold' : 'text-slate-800'}`}>
                          {n.title}
                        </p>
                        {isCritical && (
                          <span className="shrink-0 px-1.5 py-0.2 rounded-xs bg-rose-100 text-rose-800 font-bold text-[9px]">
                            URGENT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="truncate">{providerStatus.statusSummary}</span>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Bell, Check, Trash2, X, AlertTriangle, Sparkles } from 'lucide-react';
import { AppNotification } from '../types';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onRefreshNotifications: () => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onRefreshNotifications
}: NotificationCenterProps) {
  
  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, { isRead: true });
      onRefreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      onRefreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-slate-200 bg-white p-6 shadow-2xl animate-slideLeft flex flex-col justify-between">
      
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Bell className="h-5 w-5 text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
              )}
            </div>
            <h3 className="font-sans text-base font-extrabold text-slate-900">
              Notification Center
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            id="btn-close-notifications"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info label */}
        <div className="rounded-lg bg-blue-50 p-3 text-[11px] text-blue-800 leading-normal mb-4 flex items-start gap-1.5 border border-blue-100">
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
          <span>You receive urgent matches here whenever a patient requests blood matching your blood type and district in Tamil Nadu.</span>
        </div>

        {/* Notifications Feed */}
        <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto h-10 w-10 text-slate-200 stroke-1" />
              <p className="mt-3 text-xs font-semibold text-slate-400">No notifications yet</p>
              <p className="mt-1 text-[10px] text-slate-400">You will be alerted here for matching blood drives.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                className={`rounded-lg border p-3.5 space-y-2 relative transition-all ${
                  notif.isRead 
                    ? 'border-slate-100 bg-white opacity-70' 
                    : 'border-blue-100 bg-blue-50/20 shadow-xs'
                }`}
                id={`notification-card-${notif.id}`}
              >
                <div className="pr-12">
                  <span className={`block text-xs font-bold leading-tight ${notif.isRead ? 'text-slate-700' : 'text-blue-900'}`}>
                    {notif.title}
                  </span>
                  <span className="block text-[11px] text-slate-500 leading-relaxed mt-1">
                    {notif.message}
                  </span>
                  <span className="block text-[9px] text-slate-400 mt-1.5">
                    {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Control Actions (Read / Trash) */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="rounded-full border border-blue-100 bg-blue-50 p-1 text-blue-600 hover:bg-blue-100"
                      title="Mark as Read"
                      id={`btn-read-notif-${notif.id}`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteNotification(notif.id)}
                    className="rounded-full border border-slate-100 bg-white p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                    title="Delete Notification"
                    id={`btn-delete-notif-${notif.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 pt-4 text-center">
        <button
          onClick={onClose}
          className="w-full rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          Dismiss Panel
        </button>
      </div>

    </div>
  );
}

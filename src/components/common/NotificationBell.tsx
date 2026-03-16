import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/db/api';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<{id: string, text: string, time: string, read: boolean, link?: string}[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadNotifications() {
      if (!profile) return;
      
      try {
        const readIds: string[] = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        const newNotifs: {id: string, text: string, time: string, read: boolean, link?: string}[] = [];

        if (profile.role === 'admin') {
            const data = await dashboardApi.getAdminDashboard();
            if (data.pendingAdmissions > 0) {
               newNotifs.push({ id: `admin-adm-${data.pendingAdmissions}`, text: `You have ${data.pendingAdmissions} pending admissions to review.`, time: 'System Alert', read: readIds.includes(`admin-adm-${data.pendingAdmissions}`), link: '/admin/admissions' });
            }
            if (data.pendingPayments > 0) {
               newNotifs.push({ id: `admin-pay-${data.pendingPayments}`, text: `You have ${data.pendingPayments} payments waiting for verification.`, time: 'System Alert', read: readIds.includes(`admin-pay-${data.pendingPayments}`), link: '/admin/payments' });
            }
        } else {
            const data = await dashboardApi.getParentDashboard();
            if (data.remainingBalance > 0) {
               newNotifs.push({ id: `parent-fee-${data.remainingBalance}`, text: `You have a pending fee balance of ₹${data.remainingBalance.toLocaleString()}.`, time: 'Action Required', read: readIds.includes(`parent-fee-${data.remainingBalance}`), link: '/payments' });
            }
            if (data.recentAnnouncements && data.recentAnnouncements.length > 0) {
               data.recentAnnouncements.slice(0, 3).forEach(ann => {
                   newNotifs.push({ id: `ann-${ann.id}`, text: `Announcement: ${ann.title}`, time: new Date(ann.created_at).toLocaleDateString(), read: readIds.includes(`ann-${ann.id}`) });
               });
            }
            if (data.upcomingEvents && data.upcomingEvents.length > 0) {
               const nextEvent = data.upcomingEvents[0];
               newNotifs.push({ id: `evt-${nextEvent.id}`, text: `Upcoming Event: ${nextEvent.title}`, time: new Date(nextEvent.event_date).toLocaleDateString(), read: readIds.includes(`evt-${nextEvent.id}`), link: '/dashboard' });
            }
        }
        
        if (newNotifs.length === 0) {
            newNotifs.push({ id: 'welcome', text: 'Welcome to Awesome Parents Portal!', time: 'Just now', read: readIds.includes('welcome') });
        }
        
        setNotifications(newNotifs);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    }
    loadNotifications();
  }, [profile]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const saveReadState = (ids: string[]) => {
      localStorage.setItem('read_notifications', JSON.stringify(ids));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveReadState(updated.map(n => n.id));
  };

  const markAsRead = (id: string, link?: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveReadState(updated.filter(n => n.read).map(n => n.id));
    
    if (link) {
        navigate(link);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-1.5 right-1.5"
              >
                <div className="flex h-2 w-2 items-center justify-center rounded-full bg-red-600 ring-2 ring-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs font-normal" onClick={(e) => { e.preventDefault(); markAllAsRead(); }}>
              Mark all read
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${notification.read ? 'opacity-70' : 'bg-primary/5'}`}
                onClick={(e) => {
                  e.preventDefault(); // Prevents dropdown from immediately closing before state updates if click is internal
                  markAsRead(notification.id, notification.link);
                }}
              >
                <div className="flex items-start justify-between w-full gap-2">
                    <span className="text-sm leading-tight">{notification.text}</span>
                    {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />}
                </div>
                <span className="text-xs text-muted-foreground">{notification.time}</span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

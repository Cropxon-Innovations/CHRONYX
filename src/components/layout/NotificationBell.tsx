import { useState, useEffect } from "react";
import { Bell, X, CheckCheck, Info, AlertTriangle, Sparkles, Gift, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  action_url: string | null;
  action_label: string | null;
  is_dismissible: boolean;
  created_at: string;
  is_read?: boolean;
  is_dismissed?: boolean;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case "success":
      return <CheckCheck className="w-4 h-4 text-emerald-500" />;
    case "feature":
      return <Sparkles className="w-4 h-4 text-violet-500" />;
    case "promo":
      return <Gift className="w-4 h-4 text-rose-500" />;
    case "announcement":
      return <Megaphone className="w-4 h-4 text-blue-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
};

const getNotificationStyle = (type: string) => {
  switch (type) {
    case "warning":
      return "border-l-amber-500 bg-amber-500/5";
    case "success":
      return "border-l-emerald-500 bg-emerald-500/5";
    case "feature":
      return "border-l-violet-500 bg-violet-500/5";
    case "promo":
      return "border-l-rose-500 bg-rose-500/5";
    case "announcement":
      return "border-l-blue-500 bg-blue-500/5";
    default:
      return "border-l-primary bg-primary/5";
  }
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      // Fetch active system notifications
      const { data: sysNotifs, error: sysError } = await supabase
        .from("system_notifications")
        .select("*")
        .eq("is_active", true)
        .or(`target_audience.eq.all,target_audience.is.null`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (sysError) {
        console.error("Error fetching notifications:", sysError);
        return;
      }

      // Fetch user's notification status
      const { data: statusData } = await supabase
        .from("user_notification_status")
        .select("notification_id, is_read, is_dismissed")
        .eq("user_id", user.id);

      const statusMap = new Map(
        (statusData || []).map((s) => [s.notification_id, s])
      );

      // Merge notifications with status
      const mergedNotifications = (sysNotifs || [])
        .map((n) => {
          const status = statusMap.get(n.id);
          return {
            ...n,
            is_read: status?.is_read || false,
            is_dismissed: status?.is_dismissed || false,
          };
        })
        .filter((n) => !n.is_dismissed);

      setNotifications(mergedNotifications);
      setUnreadCount(mergedNotifications.filter((n) => !n.is_read).length);
    };

    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("notifications-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_notifications" },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    await supabase.from("user_notification_status").upsert(
      {
        user_id: user.id,
        notification_id: notificationId,
        is_read: true,
        read_at: new Date().toISOString(),
      },
      { onConflict: "user_id,notification_id" }
    );

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const dismissNotification = async (notificationId: string) => {
    if (!user) return;

    await supabase.from("user_notification_status").upsert(
      {
        user_id: user.id,
        notification_id: notificationId,
        is_dismissed: true,
        dismissed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,notification_id" }
    );

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const unreadNotifs = notifications.filter((n) => !n.is_read);
    
    await Promise.all(
      unreadNotifs.map((n) =>
        supabase.from("user_notification_status").upsert(
          {
            user_id: user.id,
            notification_id: n.id,
            is_read: true,
            read_at: new Date().toISOString(),
          },
          { onConflict: "user_id,notification_id" }
        )
      )
    );

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-4 h-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 md:w-96 p-0 overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                We'll notify you when something important happens
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 border-l-4 transition-colors cursor-pointer hover:bg-muted/50",
                    getNotificationStyle(notification.notification_type),
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (!notification.is_read) markAsRead(notification.id);
                    if (notification.action_url) {
                      window.location.href = notification.action_url;
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={cn(
                            "text-sm font-medium truncate",
                            !notification.is_read && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </h4>
                        {notification.is_dismissible && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                            className="text-muted-foreground/50 hover:text-muted-foreground flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground/70">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        {notification.action_url && notification.action_label && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {notification.action_label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

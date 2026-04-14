"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/stores/NotificationStore";
import {
  Bell,
  CheckCheck,
  Rocket,
  AlertTriangle,
  Package,
  Info,
} from "lucide-react";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function notificationIcon(type: string) {
  switch (type) {
    case "workflow_deployed":
      return <Rocket className="h-4 w-4 text-green-500" />;
    case "workflow_failed":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "build_completed":
      return <Package className="h-4 w-4 text-green-500" />;
    case "build_failed":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "resource_warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(50);
  }, [fetchNotifications]);

  return (
    <AppLayout>
      <PageContainer
        title="Notifications"
        description="View all your notifications"
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          ) : undefined
        }
      >
        <div className="p-6">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="mb-3 h-10 w-10" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  className={`flex items-start gap-3 rounded-lg border p-4 transition-colors cursor-pointer hover:bg-accent ${
                    !notification.read
                      ? "border-primary/20 bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                    if (notification.link) {
                      router.push(notification.link);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      if (!notification.read) markAsRead(notification.id);
                      if (notification.link) router.push(notification.link);
                    }
                  }}
                >
                  <div className="mt-0.5">
                    {notificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${!notification.read ? "font-medium" : ""}`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}

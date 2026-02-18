import { create } from "zustand";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/lib/services/notification";

type NotificationStore = {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  isLoading: boolean;

  fetchNotifications: (limit?: number, offset?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addRealtimeNotification: (notification: Notification) => void;
  clearNotificationState: () => void;
};

export const useNotificationStore = create<NotificationStore>()(set => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  isLoading: false,

  fetchNotifications: async (limit = 20, offset = 0) => {
    set({ isLoading: true });
    try {
      const data = await listNotifications(limit, offset);
      set({
        notifications: data.notifications,
        total: data.total,
        unreadCount: data.unreadCount,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await getUnreadCount();
      set({ unreadCount: data.unreadCount });
    } catch {
      // silently fail
    }
  },

  markAsRead: async (id: string) => {
    try {
      await markNotificationRead(id);
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silently fail
    }
  },

  markAllAsRead: async () => {
    try {
      await markAllNotificationsRead();
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      // silently fail
    }
  },

  addRealtimeNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      total: state.total + 1,
    }));
  },

  clearNotificationState: () => {
    set({
      notifications: [],
      unreadCount: 0,
      total: 0,
      isLoading: false,
    });
  },
}));

import api from "@/lib/api";

export interface Notification {
  id: string;
  userId: string;
  type:
    | "workflow_deployed"
    | "workflow_failed"
    | "build_completed"
    | "build_failed"
    | "resource_warning"
    | "system";
  title: string;
  message: string;
  read: boolean;
  link?: string;
  refId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export async function listNotifications(
  limit = 20,
  offset = 0
): Promise<NotificationListResponse> {
  const res = await api.get("/user-notifications", {
    params: { limit, offset },
  });
  return res.data;
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const res = await api.get("/user-notifications/unread-count");
  return res.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/user-notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/user-notifications/mark-all-read");
}

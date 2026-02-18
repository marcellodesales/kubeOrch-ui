import api from "@/lib/api";
import type { NotificationChannelType } from "@/lib/types/notification";

export interface NotificationChannel {
  id: string;
  userId: string;
  name: string;
  type: NotificationChannelType;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelRequest {
  name: string;
  type: NotificationChannelType;
  config: Record<string, unknown>;
  enabled?: boolean;
}

class NotificationService {
  async listChannels(): Promise<NotificationChannel[]> {
    const response = await api.get("/notifications/channels");
    return response.data.channels || [];
  }

  async createChannel(
    data: CreateChannelRequest
  ): Promise<NotificationChannel> {
    const response = await api.post("/notifications/channels", data);
    return response.data.channel;
  }

  async getChannel(id: string): Promise<NotificationChannel> {
    const response = await api.get(`/notifications/channels/${id}`);
    return response.data;
  }

  async updateChannel(
    id: string,
    data: CreateChannelRequest
  ): Promise<NotificationChannel> {
    const response = await api.put(`/notifications/channels/${id}`, data);
    return response.data.channel;
  }

  async deleteChannel(id: string): Promise<void> {
    await api.delete(`/notifications/channels/${id}`);
  }

  async testChannel(id: string): Promise<void> {
    await api.post(`/notifications/channels/${id}/test`);
  }
}

export const notificationService = new NotificationService();

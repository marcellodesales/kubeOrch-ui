import { create } from "zustand";
import {
  notificationService,
  type NotificationChannel,
  type CreateChannelRequest,
} from "@/lib/services/notifications";
import { toast } from "sonner";

type NotificationChannelStore = {
  channels: NotificationChannel[];
  isLoading: boolean;
  error: string | null;

  fetchChannels: () => Promise<void>;
  createChannel: (data: CreateChannelRequest) => Promise<NotificationChannel>;
  updateChannel: (id: string, data: CreateChannelRequest) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  testChannel: (id: string) => Promise<void>;
};

export const useNotificationChannelStore = create<NotificationChannelStore>()(
  (set, get) => ({
    channels: [],
    isLoading: false,
    error: null,

    fetchChannels: async () => {
      set({ isLoading: true, error: null });
      try {
        const channels = await notificationService.listChannels();
        set({ channels, isLoading: false });
      } catch {
        set({ error: "Failed to fetch channels", isLoading: false });
      }
    },

    createChannel: async data => {
      const channel = await notificationService.createChannel(data);
      set({ channels: [channel, ...get().channels] });
      toast.success("Notification channel created");
      return channel;
    },

    updateChannel: async (id, data) => {
      await notificationService.updateChannel(id, data);
      get().fetchChannels();
      toast.success("Channel updated");
    },

    deleteChannel: async id => {
      await notificationService.deleteChannel(id);
      set({ channels: get().channels.filter(c => c.id !== id) });
      toast.success("Channel deleted");
    },

    testChannel: async id => {
      await notificationService.testChannel(id);
      toast.success("Test notification sent");
    },
  })
);

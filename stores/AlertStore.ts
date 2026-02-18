import { create } from "zustand";
import {
  alertService,
  type AlertRule,
  type AlertEvent,
  type AlertTemplate,
  type AlertOverviewStats,
  type CreateRuleRequest,
  type EnableTemplateRequest,
} from "@/lib/services/alerts";
import { toast } from "sonner";

type AlertStore = {
  overview: AlertOverviewStats | null;
  rules: AlertRule[];
  events: AlertEvent[];
  eventsTotal: number;
  templates: AlertTemplate[];
  isLoading: boolean;
  error: string | null;

  fetchOverview: () => Promise<void>;
  fetchRules: (params?: {
    type?: string;
    severity?: string;
    enabled?: string;
  }) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  fetchEvents: (params?: {
    severity?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  createRule: (data: CreateRuleRequest) => Promise<AlertRule>;
  updateRule: (id: string, data: CreateRuleRequest) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string, enabled: boolean) => Promise<void>;
  enableTemplate: (
    templateId: string,
    data?: EnableTemplateRequest
  ) => Promise<void>;
  acknowledgeEvent: (id: string) => Promise<void>;
  resolveEvent: (id: string) => Promise<void>;
  fireTestAlert: () => Promise<void>;
};

export const useAlertStore = create<AlertStore>()((set, get) => ({
  overview: null,
  rules: [],
  events: [],
  eventsTotal: 0,
  templates: [],
  isLoading: false,
  error: null,

  fetchOverview: async () => {
    try {
      const overview = await alertService.getOverview();
      set({ overview });
    } catch {
      // Silently fail for overview
    }
  },

  fetchRules: async params => {
    set({ isLoading: true, error: null });
    try {
      const rules = await alertService.listRules(params);
      set({ rules, isLoading: false });
    } catch {
      set({ error: "Failed to fetch rules", isLoading: false });
    }
  },

  fetchTemplates: async () => {
    try {
      const templates = await alertService.listTemplates();
      set({ templates });
    } catch {
      // Silently fail for templates
    }
  },

  fetchEvents: async params => {
    set({ isLoading: true, error: null });
    try {
      const response = await alertService.listEvents(params);
      set({
        events: response.events,
        eventsTotal: response.total,
        isLoading: false,
      });
    } catch {
      set({ error: "Failed to fetch events", isLoading: false });
    }
  },

  createRule: async data => {
    const rule = await alertService.createRule(data);
    get().fetchRules();
    get().fetchOverview();
    return rule;
  },

  updateRule: async (id, data) => {
    await alertService.updateRule(id, data);
    get().fetchRules();
  },

  deleteRule: async id => {
    await alertService.deleteRule(id);
    set({ rules: get().rules.filter(r => r.id !== id) });
    get().fetchOverview();
    toast.success("Alert rule deleted");
  },

  toggleRule: async (id, enabled) => {
    await alertService.toggleRule(id, enabled);
    set({
      rules: get().rules.map(r => (r.id === id ? { ...r, enabled } : r)),
    });
    get().fetchOverview();
  },

  enableTemplate: async (templateId, data) => {
    await alertService.enableTemplate(templateId, data);
    await get().fetchRules();
    get().fetchOverview();
    toast.success("Alert template enabled");
  },

  acknowledgeEvent: async id => {
    await alertService.acknowledgeEvent(id);
    set({
      events: get().events.map(e =>
        e.id === id ? { ...e, status: "acknowledged" as const } : e
      ),
    });
    get().fetchOverview();
    toast.success("Alert acknowledged");
  },

  resolveEvent: async id => {
    await alertService.resolveEvent(id);
    set({
      events: get().events.map(e =>
        e.id === id ? { ...e, status: "resolved" as const } : e
      ),
    });
    get().fetchOverview();
    toast.success("Alert resolved");
  },

  fireTestAlert: async () => {
    await alertService.fireTestAlert();
    get().fetchEvents({ limit: 10 });
    get().fetchOverview();
    toast.success("Test alert fired");
  },
}));

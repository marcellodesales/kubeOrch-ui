import api from "@/lib/api";

// --- Types ---

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertRuleType = "cluster" | "workflow" | "resource";
export type AlertConditionOperator = "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
export type AlertEventStatus = "firing" | "resolved" | "acknowledged";

export interface AlertCondition {
  metric: string;
  operator: AlertConditionOperator;
  value: unknown;
  duration: number;
}

export interface AlertRule {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: AlertRuleType;
  severity: AlertSeverity;
  enabled: boolean;
  conditions: AlertCondition[];
  clusterIds?: string[];
  workflowIds?: string[];
  resourceTypes?: string[];
  namespaces?: string[];
  templateId?: string;
  isPredefined: boolean;
  notificationChannelIds?: string[];
  evaluationInterval: number;
  cooldownPeriod: number;
  lastTriggeredAt?: string;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  userId: string;
  status: AlertEventStatus;
  severity: AlertSeverity;
  ruleName: string;
  ruleType: AlertRuleType;
  message: string;
  details?: Record<string, unknown>;
  clusterId?: string;
  clusterName?: string;
  workflowId?: string;
  workflowName?: string;
  resourceName?: string;
  resourceType?: string;
  firedAt: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  category: AlertRuleType;
  severity: AlertSeverity;
  conditions: AlertCondition[];
  evaluationInterval: number;
  cooldownPeriod: number;
}

export interface AlertOverviewStats {
  activeAlerts: number;
  totalRules: number;
  enabledRules: number;
  severityBreakdown: {
    critical: number;
    warning: number;
    info: number;
  };
}

export interface CreateRuleRequest {
  name: string;
  description?: string;
  type: AlertRuleType;
  severity: AlertSeverity;
  conditions: AlertCondition[];
  clusterIds?: string[];
  workflowIds?: string[];
  resourceTypes?: string[];
  namespaces?: string[];
  notificationChannelIds?: string[];
  evaluationInterval?: number;
  cooldownPeriod?: number;
}

export interface EnableTemplateRequest {
  clusterIds?: string[];
  workflowIds?: string[];
  namespaces?: string[];
}

// --- Service ---

class AlertService {
  async getOverview(): Promise<AlertOverviewStats> {
    const response = await api.get("/alerts/overview");
    return response.data;
  }

  async listRules(params?: {
    type?: string;
    severity?: string;
    enabled?: string;
  }): Promise<AlertRule[]> {
    const response = await api.get("/alerts/rules", { params });
    return response.data.rules || [];
  }

  async createRule(data: CreateRuleRequest): Promise<AlertRule> {
    const response = await api.post("/alerts/rules", data);
    return response.data.rule;
  }

  async getRule(id: string): Promise<AlertRule> {
    const response = await api.get(`/alerts/rules/${id}`);
    return response.data;
  }

  async updateRule(id: string, data: CreateRuleRequest): Promise<AlertRule> {
    const response = await api.put(`/alerts/rules/${id}`, data);
    return response.data.rule;
  }

  async deleteRule(id: string): Promise<void> {
    await api.delete(`/alerts/rules/${id}`);
  }

  async toggleRule(id: string, enabled: boolean): Promise<void> {
    await api.patch(`/alerts/rules/${id}/toggle`, { enabled });
  }

  async listTemplates(): Promise<AlertTemplate[]> {
    const response = await api.get("/alerts/templates");
    return response.data.templates || [];
  }

  async enableTemplate(
    templateId: string,
    data?: EnableTemplateRequest
  ): Promise<AlertRule> {
    const response = await api.post(
      `/alerts/templates/${templateId}/enable`,
      data || {}
    );
    return response.data.rule;
  }

  async listEvents(params?: {
    severity?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    events: AlertEvent[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await api.get("/alerts/events", { params });
    return response.data;
  }

  async acknowledgeEvent(id: string): Promise<void> {
    await api.patch(`/alerts/events/${id}/acknowledge`);
  }

  async resolveEvent(id: string): Promise<void> {
    await api.patch(`/alerts/events/${id}/resolve`);
  }

  async fireTestAlert(): Promise<void> {
    await api.post("/alerts/test-fire");
  }
}

export const alertService = new AlertService();

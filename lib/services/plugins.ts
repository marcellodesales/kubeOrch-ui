import api from "@/lib/api";

export type PluginCategory =
  | "virtualization"
  | "networking"
  | "storage"
  | "monitoring"
  | "security"
  | "workflow"
  | "database"
  | "messaging"
  | "backup"
  | "cicd"
  | "ml"
  | "policy"
  | "scaling";

export type PluginStatus = "enabled" | "disabled";

export interface PluginNodeField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  default?: string;
  options?: string[];
  placeholder?: string;
}

export interface PluginNodeType {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: string;
  fields: PluginNodeField[];
  defaultYaml?: string;
}

export interface Plugin {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: PluginCategory;
  icon: string;
  version: string;
  crdGroup: string;
  crdKinds: string[];
  nodeTypes: PluginNodeType[];
  createdAt: string;
  updatedAt: string;
}

export interface PluginWithStatus extends Plugin {
  enabled: boolean;
  enabledAt?: string;
}

class PluginService {
  async listPlugins(): Promise<{ plugins: PluginWithStatus[] }> {
    const response = await api.get("/plugins");
    return response.data;
  }

  async getPlugin(id: string): Promise<{ plugin: Plugin; enabled: boolean }> {
    const response = await api.get(`/plugins/${id}`);
    return response.data;
  }

  async getEnabledPlugins(): Promise<{ plugins: Plugin[] }> {
    const response = await api.get("/plugins/enabled");
    return response.data;
  }

  async enablePlugin(id: string): Promise<{ message: string }> {
    const response = await api.post(`/plugins/${id}/enable`);
    return response.data;
  }

  async disablePlugin(id: string): Promise<{ message: string }> {
    const response = await api.post(`/plugins/${id}/disable`);
    return response.data;
  }

  async getCategories(): Promise<{ categories: PluginCategory[] }> {
    const response = await api.get("/plugins/categories");
    return response.data;
  }
}

export const pluginService = new PluginService();

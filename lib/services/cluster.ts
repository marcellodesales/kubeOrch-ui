import api from "@/lib/api";

export type AuthType =
  | "kubeconfig"
  | "token"
  | "certificate"
  | "serviceaccount"
  | "oidc";

export interface ClusterCredentials {
  token?: string;
  caData?: string;
  namespace?: string;
  kubeconfig?: string;
  clientCertData?: string;
  clientKeyData?: string;
  oidcIssuerUrl?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcRefreshToken?: string;
  oidcScopes?: string[];
}

export interface Cluster {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  server: string;
  authType: AuthType;
  status: "connected" | "disconnected" | "error" | "unknown";
  default?: boolean;
  metadata?: {
    version: string;
    nodeCount: number;
    platform: string;
    namespaces: string[];
  };
  labels?: Record<string, string>;
}

export interface AddClusterRequest {
  name: string;
  displayName: string;
  description?: string;
  server: string;
  authType: AuthType;
  credentials: ClusterCredentials;
  labels?: Record<string, string>;
}

export interface ClusterStatus {
  cluster: string;
  status: "connected" | "disconnected" | "error" | "unknown";
  lastCheck: string;
  isStale: boolean;
  isOnline: boolean;
}

export interface ShareClusterRequest {
  targetUserId: string;
  role: "viewer" | "editor" | "admin";
  namespaces?: string[];
}

export interface ClusterLog {
  timestamp: string;
  action: string;
  message: string;
  level: "info" | "warning" | "error";
}

class ClusterService {
  async addCluster(cluster: AddClusterRequest) {
    const response = await api.post("/clusters", cluster);
    return response.data;
  }

  async listClusters(): Promise<{
    clusters: Cluster[];
    default: string | null;
  }> {
    const response = await api.get("/clusters");
    return response.data;
  }

  async getCluster(name: string): Promise<Cluster> {
    const response = await api.get(`/clusters/${name}`);
    return response.data;
  }

  async removeCluster(name: string) {
    const response = await api.delete(`/clusters/${name}`);
    return response.data;
  }

  async setDefaultCluster(name: string) {
    const response = await api.put(`/clusters/${name}/default`);
    return response.data;
  }

  async getClusterStatus(name: string): Promise<ClusterStatus> {
    const response = await api.get(`/clusters/${name}/status`);
    return response.data;
  }

  async testConnection(name: string) {
    const response = await api.post(`/clusters/${name}/test`);
    return response.data;
  }

  async refreshMetadata(name: string) {
    const response = await api.post(`/clusters/${name}/refresh`);
    return response.data;
  }

  async getConnectionLogs(
    name: string,
    limit: number = 100
  ): Promise<ClusterLog[]> {
    const response = await api.get(`/clusters/${name}/logs`, {
      params: { limit },
    });
    return response.data;
  }

  async updateCredentials(name: string, credentials: ClusterCredentials) {
    const response = await api.put(`/clusters/${name}/credentials`, {
      credentials,
    });
    return response.data;
  }

  async shareCluster(name: string, shareRequest: ShareClusterRequest) {
    const response = await api.post(`/clusters/${name}/share`, shareRequest);
    return response.data;
  }
}

export const clusterService = new ClusterService();

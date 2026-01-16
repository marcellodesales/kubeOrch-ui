import api from "@/lib/api";

export interface WorkflowSearchResult {
  id: string;
  name: string;
  description: string;
  status: string;
}

export interface ResourceSearchResult {
  id: string;
  name: string;
  namespace: string;
  type: string;
  clusterName: string;
}

export interface ClusterSearchResult {
  name: string;
  displayName: string;
  status: string;
}

export interface SearchResults {
  workflows: WorkflowSearchResult[];
  resources: ResourceSearchResult[];
  clusters: ClusterSearchResult[];
}

export async function search(query: string): Promise<SearchResults> {
  const response = await api.get<SearchResults>(
    `/search?q=${encodeURIComponent(query)}`
  );
  return response.data;
}

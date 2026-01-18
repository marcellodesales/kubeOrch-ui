import api from "@/lib/api";

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published" | "archived";
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  owner_id: string;
  cluster_id: string;
  created_at: string;
  updated_at: string;
  run_count: number;
  success_count: number;
  failure_count: number;
  last_run_at?: string;
  current_version?: number;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  cluster_id: string;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

// Create a new workflow
export async function createWorkflow(data: CreateWorkflowRequest) {
  const response = await api.post("/workflows", data);
  return response.data;
}

// List all workflows
export async function listWorkflows() {
  const response = await api.get("/workflows");
  return response.data.workflows || [];
}

// Get a specific workflow
export async function getWorkflow(id: string) {
  const response = await api.get(`/workflows/${id}`);
  return response.data;
}

// Update a workflow
export async function updateWorkflow(id: string, data: UpdateWorkflowRequest) {
  const response = await api.put(`/workflows/${id}`, data);
  return response.data;
}

// Save workflow (update nodes and edges without creating version)
export async function saveWorkflow(
  id: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  description?: string
) {
  const response = await api.post(`/workflows/${id}/save`, {
    nodes,
    edges,
    description,
  });
  return response.data;
}

export interface RunWorkflowResponse {
  message: string;
  run_id: string;
  status: string;
  logs: string[];
}

// Run workflow (creates version and executes)
export async function runWorkflow(
  id: string,
  triggerData?: Record<string, any>
): Promise<RunWorkflowResponse> {
  const response = await api.post(`/workflows/${id}/run`, {
    trigger_data: triggerData || {},
  });
  return response.data;
}

// Delete a workflow
export async function deleteWorkflow(id: string) {
  const response = await api.delete(`/workflows/${id}`);
  return response.data;
}

// Clone a workflow
export async function cloneWorkflow(id: string, newName: string) {
  const response = await api.post(`/workflows/${id}/clone`, { name: newName });
  return response.data;
}

// Update workflow status
export async function updateWorkflowStatus(
  id: string,
  status: "draft" | "published" | "archived"
) {
  const response = await api.put(`/workflows/${id}/status`, { status });
  return response.data;
}

// Get workflow runs
export async function getWorkflowRuns(id: string, limit: number = 10) {
  const response = await api.get(`/workflows/${id}/runs?limit=${limit}`);
  return response.data.runs || [];
}

// Version types
export interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  name?: string;
  tag?: string;
  description: string;
  created_at: string;
  created_by: string;
  restored_from?: number;
  is_automatic: boolean;
  run_id?: string;
  run_status?: "running" | "completed" | "failed";
}

export interface VersionsResponse {
  versions: WorkflowVersion[];
  total: number;
  page: number;
  limit: number;
}

export interface NodeDiff {
  node_id: string;
  type: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
}

export interface EdgeDiff {
  edge_id: string;
  source: string;
  target: string;
}

export interface VersionDiff {
  from_version: number;
  to_version: number;
  added_nodes: NodeDiff[];
  removed_nodes: NodeDiff[];
  modified_nodes: NodeDiff[];
  added_edges: EdgeDiff[];
  removed_edges: EdgeDiff[];
}

// Get workflow versions with pagination
export async function getWorkflowVersions(
  workflowId: string,
  page: number = 1,
  limit: number = 10
): Promise<VersionsResponse> {
  const response = await api.get(
    `/workflows/${workflowId}/versions?page=${page}&limit=${limit}`
  );
  return response.data;
}

// Get a specific version
export async function getWorkflowVersion(
  workflowId: string,
  version: number
): Promise<WorkflowVersion> {
  const response = await api.get(`/workflows/${workflowId}/versions/${version}`);
  return response.data;
}

// Create a manual version
export async function createWorkflowVersion(
  workflowId: string,
  data: { name?: string; tag?: string; description?: string }
): Promise<{ message: string; version: WorkflowVersion }> {
  const response = await api.post(`/workflows/${workflowId}/versions`, data);
  return response.data;
}

// Update version metadata
export async function updateWorkflowVersion(
  workflowId: string,
  version: number,
  data: { name?: string; tag?: string; description?: string }
): Promise<{ message: string; version: WorkflowVersion }> {
  const response = await api.put(
    `/workflows/${workflowId}/versions/${version}`,
    data
  );
  return response.data;
}

// Restore a previous version
export async function restoreWorkflowVersion(
  workflowId: string,
  version: number
): Promise<{ message: string; version: WorkflowVersion; workflow: Workflow }> {
  const response = await api.post(
    `/workflows/${workflowId}/versions/${version}/restore`
  );
  return response.data;
}

// Compare two versions
export async function compareWorkflowVersions(
  workflowId: string,
  v1: number,
  v2: number
): Promise<VersionDiff> {
  const response = await api.get(
    `/workflows/${workflowId}/versions/compare?v1=${v1}&v2=${v2}`
  );
  return response.data;
}

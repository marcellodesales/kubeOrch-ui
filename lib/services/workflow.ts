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

// Run workflow (creates version and executes)
export async function runWorkflow(
  id: string,
  triggerData?: Record<string, any>
) {
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

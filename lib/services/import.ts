import api from "@/lib/api";
import { WorkflowNode, WorkflowEdge, Workflow } from "@/lib/services/workflow";

export type ImportSource = "file" | "github" | "gitlab" | "git_url";

export interface ImportRequest {
  source: ImportSource;
  url?: string;
  branch?: string;
  fileContent?: string;
  fileName?: string;
  namespace?: string;
  workflowId?: string;
}

export interface PortMapping {
  hostIp?: string;
  hostPort?: number;
  containerPort: number;
  protocol?: string;
}

export interface VolumeMapping {
  source: string;
  target: string;
  readonly?: boolean;
  type: string;
}

export interface BuildConfig {
  context: string;
  dockerfile?: string;
  args?: Record<string, string>;
  target?: string;
}

export interface HealthCheckConfig {
  test?: string[];
  interval?: string;
  timeout?: string;
  retries?: number;
  startPeriod?: string;
}

export interface ImportResourceSpec {
  cpus?: string;
  memory?: string;
}

export interface ImportResourceConfig {
  limits?: ImportResourceSpec;
  reservations?: ImportResourceSpec;
}

export interface ImportedService {
  name: string;
  image?: string;
  build?: BuildConfig;
  ports?: PortMapping[];
  environment?: Record<string, string>;
  envFile?: string[];
  volumes?: VolumeMapping[];
  dependsOn?: string[];
  command?: string[];
  entrypoint?: string[];
  networks?: string[];
  replicas?: number;
  healthcheck?: HealthCheckConfig;
  labels?: Record<string, string>;
  resources?: ImportResourceConfig;
  restart?: string;
  workingDir?: string;
}

export interface ImportedVolume {
  name: string;
  driver?: string;
  external?: boolean;
  labels?: Record<string, string>;
}

export interface ImportedNetwork {
  name: string;
  driver?: string;
  external?: boolean;
}

export interface ImportError {
  code: string;
  message: string;
  service?: string;
  field?: string;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface SourceBuildConfig {
  repoUrl: string;
  branch: string;
  buildContext: string;
  useNixpacks: boolean;
  dockerfile?: string;
}

export interface ImportAnalysis {
  detectedType: string;
  services: ImportedService[];
  volumes?: ImportedVolume[];
  networks?: ImportedNetwork[];
  warnings?: string[];
  errors?: ImportError[];
  suggestedNodes: WorkflowNode[];
  suggestedEdges: WorkflowEdge[];
  layoutPositions: Record<string, NodePosition>;
  needsBuild?: boolean;
  sourceBuildConfig?: SourceBuildConfig;
}

export interface ApplyImportRequest {
  workflowId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  positions: Record<string, NodePosition>;
}

export interface CreateWorkflowFromImportRequest {
  name: string;
  clusterId: string;
  analysis: ImportAnalysis;
}

// Async import response types
export type ImportSessionStatus =
  | "pending"
  | "cloning"
  | "analyzing"
  | "completed"
  | "failed";

export interface ImportSession {
  id: string;
  userId: string;
  source: ImportSource;
  url?: string;
  branch?: string;
  fileName?: string;
  namespace: string;
  status: ImportSessionStatus;
  currentStage: string;
  progress: number;
  analysis?: ImportAnalysis;
  errorMessage?: string;
  errorStage?: string;
  createdAt: string;
  completedAt?: string;
}

// Response from analyze endpoint - can be sync or async
export interface AnalyzeImportResponse {
  async: boolean;
  // Sync response
  analysis?: ImportAnalysis;
  // Async response
  sessionId?: string;
  message?: string;
}

// Analyze import source and get suggested nodes
// Returns either immediate analysis (sync) or session ID (async)
export async function analyzeImport(
  req: ImportRequest
): Promise<AnalyzeImportResponse> {
  const response = await api.post("/import/analyze", req);
  return response.data;
}

// Get import session status
export async function getImportSession(
  sessionId: string
): Promise<{ session: ImportSession }> {
  const response = await api.get(`/import/${sessionId}`);
  return response.data;
}

// Apply import to existing workflow
export async function applyImport(
  req: ApplyImportRequest
): Promise<{ workflow: Workflow; message: string }> {
  const response = await api.post("/import/apply", req);
  return response.data;
}

// Create new workflow from import
export async function createWorkflowFromImport(
  req: CreateWorkflowFromImportRequest
): Promise<{ workflow: Workflow; message: string }> {
  const response = await api.post("/import/create-workflow", req);
  return response.data;
}

// Upload docker-compose file
export async function uploadComposeFile(
  file: File,
  namespace?: string
): Promise<{
  analysis: ImportAnalysis;
  fileName: string;
  fileSize: number;
  fileContent: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  if (namespace) {
    formData.append("namespace", namespace);
  }

  const response = await api.post("/import/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

// Helper to convert file to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/x-yaml;base64,")
      const base64Content = base64.split(",")[1];
      resolve(base64Content);
    };
    reader.onerror = error => reject(error);
  });
}

// Validate URL format
export function isValidGitUrl(url: string): boolean {
  // GitHub URL patterns
  const githubPattern =
    /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+(\/.*)?$/i;
  // GitLab URL patterns
  const gitlabPattern =
    /^https?:\/\/(www\.)?gitlab\.com\/[\w-]+\/[\w.-]+(\/.*)?$/i;
  // Generic git URL
  const gitPattern = /^(https?|git):\/\/.*\.git$/i;

  return (
    githubPattern.test(url) || gitlabPattern.test(url) || gitPattern.test(url)
  );
}

// Detect import source from URL
export function detectSourceFromUrl(url: string): ImportSource {
  if (url.includes("github.com")) {
    return "github";
  }
  if (url.includes("gitlab.com")) {
    return "gitlab";
  }
  return "git_url";
}

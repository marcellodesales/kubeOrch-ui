import api from "@/lib/api";

export type BuildStatus =
  | "pending"
  | "cloning"
  | "building"
  | "pushing"
  | "completed"
  | "failed"
  | "cancelled";

export interface Build {
  id: string;
  workflowId?: string;
  userId: string;
  repoUrl: string;
  branch: string;
  commitSha?: string;
  buildContext: string;
  dockerfile?: string;
  buildArgs?: Record<string, string>;
  useNixpacks: boolean;
  registryId: string;
  imageName: string;
  imageTag: string;
  status: BuildStatus;
  currentStage: string;
  progress: number;
  finalImageRef?: string;
  imageDigest?: string;
  imageSize?: number;
  errorMessage?: string;
  errorStage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

export interface StartBuildRequest {
  repoUrl: string;
  branch?: string;
  registryId: string;
  imageName: string;
  imageTag?: string;
  workflowId?: string;
  buildContext?: string;
  dockerfile?: string;
  buildArgs?: Record<string, string>;
  useNixpacks?: boolean;
}

export interface BuildLog {
  timestamp: string;
  stage: string;
  message: string;
  level: "info" | "warn" | "error";
  stream?: "stdout" | "stderr";
}

export interface BuildsResponse {
  builds: Build[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Start a new build
 */
export async function startBuild(
  req: StartBuildRequest
): Promise<{ build: Build; message: string }> {
  const response = await api.post("/builds/start", req);
  return response.data;
}

/**
 * Get a build by ID
 */
export async function getBuild(buildId: string): Promise<{ build: Build }> {
  const response = await api.get(`/builds/${buildId}`);
  return response.data;
}

/**
 * List builds for current user
 */
export async function listBuilds(
  limit?: number,
  offset?: number
): Promise<BuildsResponse> {
  const params: Record<string, number> = {};
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;

  const response = await api.get("/builds", { params });
  return response.data;
}

/**
 * Cancel an in-progress build
 */
export async function cancelBuild(
  buildId: string
): Promise<{ message: string }> {
  const response = await api.post(`/builds/${buildId}/cancel`);
  return response.data;
}

/**
 * Check if a build is in a terminal state
 */
export function isBuildTerminal(status: BuildStatus): boolean {
  return ["completed", "failed", "cancelled"].includes(status);
}

/**
 * Check if a build is in progress
 */
export function isBuildInProgress(status: BuildStatus): boolean {
  return ["cloning", "building", "pushing"].includes(status);
}

/**
 * Get status color for badge styling
 */
export function getBuildStatusColor(status: BuildStatus): string {
  switch (status) {
    case "pending":
      return "bg-gray-500";
    case "cloning":
      return "bg-blue-500";
    case "building":
      return "bg-yellow-500";
    case "pushing":
      return "bg-purple-500";
    case "completed":
      return "bg-green-500";
    case "failed":
      return "bg-red-500";
    case "cancelled":
      return "bg-gray-400";
    default:
      return "bg-gray-500";
  }
}

/**
 * Get human-readable status label
 */
export function getBuildStatusLabel(status: BuildStatus): string {
  switch (status) {
    case "pending":
      return "Queued";
    case "cloning":
      return "Cloning";
    case "building":
      return "Building";
    case "pushing":
      return "Pushing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

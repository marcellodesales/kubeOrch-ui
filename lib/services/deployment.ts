export interface DeploymentRequest {
  id: string;
  templateId: string;
  parameters: {
    image: string;
    replicas: number;
    port: number;
    env?: Record<string, string>;
    resources?: {
      limits?: {
        cpu?: string;
        memory?: string;
      };
      requests?: {
        cpu?: string;
        memory?: string;
      };
    };
    labels?: Record<string, string>;
  };
  metadata?: {
    owner?: string;
    project?: string;
  };
  hasValidationError?: boolean; // For UI validation state
}

export interface DeploymentResponse {
  id: string;
  status: string;
  message: string;
  resourceId: string;
  timestamp: number;
}

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errorHandling";

export async function deployApplication(
  request: DeploymentRequest
): Promise<DeploymentResponse> {
  try {
    const response = await api.post("/deployments/", request);
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error, "Deployment failed");
    throw new Error(errorMessage);
  }
}

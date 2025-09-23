// Node type definitions for workflow system

export interface DeploymentNodeData {
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
  hasValidationError?: boolean;
}

// Type alias for backward compatibility
export type DeploymentRequest = DeploymentNodeData;

// Future node types can be added here
export interface ConditionalNodeData {
  id: string;
  condition: string;
  trueOutput?: string;
  falseOutput?: string;
}

export interface ParallelNodeData {
  id: string;
  branches: string[];
  waitForAll?: boolean;
}

export interface WebhookNodeData {
  id: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
}

// Union type for all node data types
export type WorkflowNodeData =
  | DeploymentNodeData
  | ConditionalNodeData
  | ParallelNodeData
  | WebhookNodeData;

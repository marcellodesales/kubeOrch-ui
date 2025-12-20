// Node type definitions for workflow system
// These match the backend's WorkflowNode.Data structure

export interface DeploymentNodeData {
  id: string;
  name: string;
  type?: string;
  namespace?: string;
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
  templateId?: string;
  parameters?: {
    image?: string;
    replicas?: number;
    port?: number;
  };
  hasValidationError?: boolean;
}

// Type alias for backward compatibility
export type DeploymentRequest = DeploymentNodeData;

export interface ServiceNodeData {
  id: string;
  name: string;
  type?: string;
  namespace?: string;
  serviceType: "ClusterIP" | "NodePort" | "LoadBalancer";
  targetApp: string;
  port: number;
  targetPort?: number;
  ports?: Array<{
    name?: string;
    protocol?: string;
    port: number;
    targetPort?: number;
    nodePort?: number;
  }>;
  selector?: Record<string, string>;
  sessionAffinity?: "None" | "ClientIP";
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  templateId?: string;
  hasValidationError?: boolean;
}

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
  | ServiceNodeData
  | ConditionalNodeData
  | ParallelNodeData
  | WebhookNodeData;

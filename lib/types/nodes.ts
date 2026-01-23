// Node type definitions for workflow system
// These match the backend's WorkflowNode.Data structure

/** Volume mount configuration for ConfigMap/Secret mounting */
export interface VolumeMount {
  type: "configMap" | "secret";
  name: string;
  mountPath: string;
  nodeId: string;
}

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
  /** Volume mounts from linked ConfigMaps/Secrets */
  volumeMounts?: VolumeMount[];
  /** Internal field: IDs of linked ConfigMap nodes */
  _linkedConfigMaps?: string[];
  /** Internal field: IDs of linked Secret nodes */
  _linkedSecrets?: string[];
  /** Runtime status fields (populated after deployment) */
  _status?: {
    state?: "healthy" | "partial" | "error";
    replicas?: number;
    readyReplicas?: number;
    message?: string;
  };
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
  /** Internal field: ID of linked deployment node (set when connected via edge) */
  _linkedDeployment?: string;
  /** Runtime status fields (populated after deployment) */
  _status?: {
    state?: "healthy" | "partial" | "error";
    clusterIP?: string;
    externalIP?: string;
    nodePort?: number;
    message?: string;
  };
}

/** Represents a single path rule in an Ingress */
export interface IngressPath {
  id: string;
  path: string;
  pathType: "Prefix" | "Exact" | "ImplementationSpecific";
  serviceName?: string;
  servicePort?: number;
  /** Internal field: ID of linked service node (set when connected via edge) */
  _linkedService?: string;
}

export interface IngressNodeData {
  id: string;
  name: string;
  namespace?: string;

  // Routing
  host?: string;

  // Multiple paths support
  paths: IngressPath[];

  // Ingress class
  ingressClassName?: string;

  // TLS
  tlsEnabled?: boolean;
  tlsSecretName?: string;
  tlsHosts?: string[];

  // Annotations for controller-specific settings
  annotations?: Record<string, string>;

  // Template reference
  templateId?: string;

  // Validation
  hasValidationError?: boolean;

  /** Runtime status fields (populated after deployment) */
  _status?: {
    state?: "healthy" | "pending" | "error";
    loadBalancerIP?: string;
    loadBalancerHostname?: string;
    rulesCount?: number;
    message?: string;
  };
}

/** ConfigMap node data - stores non-sensitive configuration */
export interface ConfigMapNodeData {
  id: string;
  name: string;
  namespace?: string;
  /** Key-value pairs stored in MongoDB and created in K8s on workflow run */
  data: Record<string, string>;
  /** Mount path in containers (default: /etc/config) */
  mountPath?: string;
  templateId?: string;
  hasValidationError?: boolean;
  /** Runtime status fields */
  _status?: {
    state?: "created" | "pending" | "error";
    message?: string;
  };
}

/** Secret key entry with stable ID for React reconciliation */
export interface SecretKeyEntry {
  id: string; // Stable unique ID (doesn't change when name is edited)
  name: string; // The actual key name
}

/** Secret node data - stores only metadata, values are pass-through to K8s */
export interface SecretNodeData {
  id: string;
  name: string;
  namespace?: string;
  /** Secret type (default: Opaque) */
  secretType?:
    | "Opaque"
    | "kubernetes.io/tls"
    | "kubernetes.io/dockerconfigjson";
  /** Only key names are stored in MongoDB (NO values for security) */
  keys: SecretKeyEntry[];
  /** Mount path in containers (default: /etc/secrets) */
  mountPath?: string;
  templateId?: string;
  hasValidationError?: boolean;
  /** Track if K8s secret has been created */
  _secretCreated?: boolean;
  /** Runtime status fields */
  _status?: {
    state?: "created" | "pending" | "error";
    message?: string;
  };
}

// Future node types can be added here
export interface ConditionalNodeData {
  id: string;
  name: string;
  condition: string;
  trueOutput?: string;
  falseOutput?: string;
}

export interface ParallelNodeData {
  id: string;
  name: string;
  branches: string[];
  waitForAll?: boolean;
}

export interface WebhookNodeData {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
}

// Union type for all node data types
export type WorkflowNodeData =
  | DeploymentNodeData
  | ServiceNodeData
  | IngressNodeData
  | ConfigMapNodeData
  | SecretNodeData
  | ConditionalNodeData
  | ParallelNodeData
  | WebhookNodeData;

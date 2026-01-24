// Node type definitions for workflow system
// These match the backend's WorkflowNode.Data structure

/** Volume mount configuration for ConfigMap/Secret/PVC mounting */
export interface VolumeMount {
  type: "configMap" | "secret" | "persistentVolumeClaim";
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
  /** Internal field: IDs of linked PVC nodes */
  _linkedPVCs?: string[];
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

/** PersistentVolumeClaim node data - storage requests for stateful workloads */
export interface PersistentVolumeClaimNodeData {
  id: string;
  name: string;
  namespace?: string;
  /** Storage class name (optional, uses cluster default if not specified) */
  storageClassName?: string;
  /** Access modes for the volume */
  accessModes: (
    | "ReadWriteOnce"
    | "ReadOnlyMany"
    | "ReadWriteMany"
    | "ReadWriteOncePod"
  )[];
  /** Storage size (e.g., "10Gi", "500Mi") */
  storage: string;
  /** Volume mode (default: Filesystem) */
  volumeMode?: "Filesystem" | "Block";
  templateId?: string;
  hasValidationError?: boolean;
  /** Runtime status fields */
  _status?: {
    state?: "Bound" | "Pending" | "Lost" | "error";
    /** Actual capacity allocated */
    capacity?: string;
    /** Name of the bound PersistentVolume */
    volumeName?: string;
    message?: string;
  };
}

/** Volume claim template for StatefulSet */
export interface VolumeClaimTemplate {
  /** Stable unique ID for React reconciliation */
  id: string;
  /** Name of the volume claim template */
  name: string;
  /** Storage class name (optional) */
  storageClassName?: string;
  /** Access modes for the volume */
  accessModes: ("ReadWriteOnce" | "ReadOnlyMany" | "ReadWriteMany")[];
  /** Storage size (e.g., "10Gi") */
  storage: string;
}

/** StatefulSet node data - for stateful applications like databases */
export interface StatefulSetNodeData {
  id: string;
  name: string;
  namespace?: string;
  /** Headless service name (required for DNS and stable network identities) */
  serviceName: string;
  /** Container image */
  image: string;
  /** Number of replicas */
  replicas: number;
  /** Container port */
  port: number;
  /** Environment variables */
  env?: Record<string, string>;
  /** Resource limits and requests */
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
  /** Volume claim templates for persistent storage */
  volumeClaimTemplates?: VolumeClaimTemplate[];
  /** Volume mounts from linked ConfigMaps/Secrets */
  volumeMounts?: VolumeMount[];
  labels?: Record<string, string>;
  templateId?: string;
  hasValidationError?: boolean;
  /** Internal field: IDs of linked ConfigMap nodes */
  _linkedConfigMaps?: string[];
  /** Internal field: IDs of linked Secret nodes */
  _linkedSecrets?: string[];
  /** Internal field: IDs of linked PVC nodes */
  _linkedPVCs?: string[];
  /** Runtime status fields */
  _status?: {
    state?: "healthy" | "partial" | "error";
    replicas?: number;
    readyReplicas?: number;
    currentReplicas?: number;
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
  | PersistentVolumeClaimNodeData
  | StatefulSetNodeData
  | ConditionalNodeData
  | ParallelNodeData
  | WebhookNodeData;

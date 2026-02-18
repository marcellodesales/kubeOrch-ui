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
  /** Environment variables - populated at runtime from envKeys + values */
  env?: Record<string, string>;
  /** Environment variable keys only (values stored transiently, not in DB) */
  envKeys?: EnvVarEntry[];
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

/** Environment variable entry with stable ID for React reconciliation */
export interface EnvVarEntry {
  id: string; // Stable unique ID (doesn't change when name is edited)
  name: string; // The env var name (e.g., "DATABASE_URL")
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
  /** Environment variables - populated at runtime from envKeys + values */
  env?: Record<string, string>;
  /** Environment variable keys only (values stored transiently, not in DB) */
  envKeys?: EnvVarEntry[];
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

/** Job node data - for run-to-completion tasks */
export interface JobNodeData {
  id: string;
  name: string;
  namespace?: string;
  /** Container image to run */
  image: string;
  /** Command to run in container */
  command?: string[];
  /** Arguments for the command */
  args?: string[];
  /** Number of successful completions required */
  completions?: number;
  /** Maximum concurrent pods */
  parallelism?: number;
  /** Retry limit before marking failed */
  backoffLimit?: number;
  /** Maximum runtime in seconds */
  activeDeadlineSeconds?: number;
  /** Auto-delete job after completion (seconds) */
  ttlSecondsAfterFinished?: number;
  /** Pod restart policy */
  restartPolicy?: "Never" | "OnFailure";
  /** Environment variables */
  env?: Record<string, string>;
  /** Environment variable keys only */
  envKeys?: EnvVarEntry[];
  /** Resource limits and requests */
  resources?: {
    limits?: { cpu?: string; memory?: string };
    requests?: { cpu?: string; memory?: string };
  };
  /** Volume mounts from linked ConfigMaps/Secrets */
  volumeMounts?: VolumeMount[];
  /** Internal field: IDs of linked ConfigMap nodes */
  _linkedConfigMaps?: string[];
  /** Internal field: IDs of linked Secret nodes */
  _linkedSecrets?: string[];
  templateId?: string;
  hasValidationError?: boolean;
  /** Runtime status fields */
  _status?: {
    state?: "running" | "completed" | "failed" | "pending";
    succeeded?: number;
    failed?: number;
    active?: number;
    completions?: number;
    message?: string;
  };
}

/** CronJob node data - for scheduled recurring tasks */
export interface CronJobNodeData {
  id: string;
  name: string;
  namespace?: string;
  /** Cron schedule expression (e.g., "0 2 * * *") */
  schedule: string;
  /** Container image to run */
  image: string;
  /** Command to run in container */
  command?: string[];
  /** Arguments for the command */
  args?: string[];
  /** How to handle concurrent executions */
  concurrencyPolicy?: "Allow" | "Forbid" | "Replace";
  /** Suspend the CronJob */
  suspend?: boolean;
  /** Number of successful jobs to keep */
  successfulJobsHistoryLimit?: number;
  /** Number of failed jobs to keep */
  failedJobsHistoryLimit?: number;
  /** Retry limit for each job */
  backoffLimit?: number;
  /** Pod restart policy */
  restartPolicy?: "Never" | "OnFailure";
  /** Environment variables */
  env?: Record<string, string>;
  /** Environment variable keys only */
  envKeys?: EnvVarEntry[];
  /** Resource limits and requests */
  resources?: {
    limits?: { cpu?: string; memory?: string };
    requests?: { cpu?: string; memory?: string };
  };
  /** Volume mounts from linked ConfigMaps/Secrets */
  volumeMounts?: VolumeMount[];
  /** Internal field: IDs of linked ConfigMap nodes */
  _linkedConfigMaps?: string[];
  /** Internal field: IDs of linked Secret nodes */
  _linkedSecrets?: string[];
  templateId?: string;
  hasValidationError?: boolean;
  /** Runtime status fields */
  _status?: {
    state?: "active" | "suspended";
    lastScheduleTime?: string;
    lastSuccessfulTime?: string;
    activeJobs?: number;
    message?: string;
  };
}

/** DaemonSet node data - runs one pod on every node */
export interface DaemonSetNodeData {
  id: string;
  name: string;
  namespace?: string;
  /** Container image to run */
  image: string;
  /** Container port */
  port?: number;
  /** Update strategy */
  updateStrategy?: "RollingUpdate" | "OnDelete";
  /** Max unavailable pods during update */
  maxUnavailable?: number | string;
  /** Node selector labels */
  nodeSelector?: Record<string, string>;
  /** Pod tolerations for node taints */
  tolerations?: Array<{
    key: string;
    operator?: "Exists" | "Equal";
    value?: string;
    effect: "NoSchedule" | "PreferNoSchedule" | "NoExecute";
    tolerationSeconds?: number;
  }>;
  /** Use host network namespace */
  hostNetwork?: boolean;
  /** Use host PID namespace */
  hostPID?: boolean;
  /** Environment variables */
  env?: Record<string, string>;
  /** Environment variable keys only */
  envKeys?: EnvVarEntry[];
  /** Resource limits and requests */
  resources?: {
    limits?: { cpu?: string; memory?: string };
    requests?: { cpu?: string; memory?: string };
  };
  /** Volume mounts from linked ConfigMaps/Secrets */
  volumeMounts?: VolumeMount[];
  /** Internal field: IDs of linked ConfigMap nodes */
  _linkedConfigMaps?: string[];
  /** Internal field: IDs of linked Secret nodes */
  _linkedSecrets?: string[];
  templateId?: string;
  hasValidationError?: boolean;
  /** Runtime status fields */
  _status?: {
    state?: "healthy" | "partial" | "error";
    desiredNumberScheduled?: number;
    numberReady?: number;
    numberAvailable?: number;
    message?: string;
  };
}

/** HPA node data - automatically scales workloads */
export interface HPANodeData {
  id: string;
  name: string;
  namespace?: string;
  /** Kind of workload to scale */
  scaleTargetKind?: "Deployment" | "StatefulSet";
  /** Name of workload to scale */
  scaleTargetName?: string;
  /** Minimum replicas */
  minReplicas: number;
  /** Maximum replicas */
  maxReplicas: number;
  /** Target CPU utilization percentage */
  targetCPUUtilization?: number;
  /** Target memory utilization percentage */
  targetMemoryUtilization?: number;
  /** Scale down stabilization window (seconds) */
  scaleDownStabilization?: number;
  /** Scale up stabilization window (seconds) */
  scaleUpStabilization?: number;
  /** Internal field: ID of linked workload node */
  _linkedTarget?: string;
  templateId?: string;
  hasValidationError?: boolean;
  /** Runtime status fields */
  _status?: {
    state?: "scaling" | "stable" | "limited" | "error";
    currentReplicas?: number;
    desiredReplicas?: number;
    currentCPU?: number;
    currentMemory?: number;
    message?: string;
  };
}

/** NetworkPolicy peer - defines allowed sources/destinations */
export interface NetworkPolicyPeer {
  id: string;
  type: "podSelector" | "namespaceSelector" | "ipBlock";
  podSelector?: Record<string, string>;
  namespaceSelector?: Record<string, string>;
  ipBlock?: {
    cidr: string;
    except?: string[];
  };
  /** Internal field: ID of workload node this peer was linked from */
  _linkedWorkload?: string;
}

/** NetworkPolicy port rule */
export interface NetworkPolicyPort {
  id: string;
  protocol?: "TCP" | "UDP" | "SCTP";
  port: number | string;
}

/** NetworkPolicy rule - defines ingress or egress rule */
export interface NetworkPolicyRule {
  id: string;
  from?: NetworkPolicyPeer[]; // For ingress
  to?: NetworkPolicyPeer[]; // For egress
  ports?: NetworkPolicyPort[];
}

/** NetworkPolicy node data - controls network traffic */
export interface NetworkPolicyNodeData {
  id: string;
  name: string;
  namespace?: string;
  /** Pod selector - which pods this policy applies to */
  podSelector?: Record<string, string>;
  /** Policy types to enforce */
  policyTypes: ("Ingress" | "Egress")[];
  /** Ingress rules - who can access these pods */
  ingressRules?: NetworkPolicyRule[];
  /** Egress rules - where these pods can connect */
  egressRules?: NetworkPolicyRule[];
  /** Internal field: IDs of linked workload nodes */
  _linkedWorkloads?: string[];
  templateId?: string;
  hasValidationError?: boolean;
  /** Runtime status fields */
  _status?: {
    state?: "active" | "pending";
    affectedPods?: number;
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

// Plugin field definition for dynamic plugin nodes
export interface PluginFieldDefinition {
  id: string;
  label: string;
  type: string;
  required: boolean;
  default?: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

// Plugin node data - stores field values and metadata for CRD plugin nodes
export interface PluginNodeData {
  id: string;
  name: string;
  namespace: string;
  templateId: string;
  pluginId: string;
  pluginCategory: string;
  displayName: string;
  // Dynamic fields from plugin definition
  _pluginFields: PluginFieldDefinition[];
  // All other fields are dynamic based on the plugin
  [key: string]: unknown;
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
  | JobNodeData
  | CronJobNodeData
  | DaemonSetNodeData
  | HPANodeData
  | NetworkPolicyNodeData
  | ConditionalNodeData
  | ParallelNodeData
  | WebhookNodeData
  | PluginNodeData;

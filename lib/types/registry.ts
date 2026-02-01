// Registry types for container registry credentials management

export type RegistryType =
  | "dockerhub"
  | "ghcr"
  | "ecr"
  | "gcr"
  | "acr"
  | "custom";

export type RegistryStatus = "connected" | "disconnected" | "unknown" | "error";

export interface RegistryCredentials {
  // Common fields (DockerHub, GHCR, Custom)
  username?: string;
  password?: string; // PAT/token

  // AWS ECR specific
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;

  // Google Artifact Registry / GCR specific
  serviceAccountJson?: string;

  // Azure ACR specific
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface Registry {
  id: string;
  name: string;
  registryType: RegistryType;
  registryUrl: string;
  previewUrl?: string; // User-friendly URL preview (e.g., "ghcr.io/username")
  status: RegistryStatus;
  isDefault: boolean;
  lastCheck?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegistryRequest {
  name: string;
  registryType: RegistryType;
  registryUrl?: string;
  credentials: RegistryCredentials;
}

export interface UpdateRegistryRequest {
  name?: string;
  registryUrl?: string;
  credentials?: RegistryCredentials;
}

// Registry type metadata for UI rendering
export interface RegistryTypeInfo {
  type: RegistryType;
  name: string;
  description: string;
  icon: string; // Icon name from lucide-react
  fields: RegistryFormField[];
  urlRequired: boolean;
  urlPlaceholder?: string;
}

export interface RegistryFormField {
  key: keyof RegistryCredentials;
  label: string;
  type: "text" | "password" | "textarea";
  placeholder: string;
  required: boolean;
  helpText?: string;
  helpLink?: {
    prefix: string;
    linkText: string;
    url: string;
  };
}

// Registry type configurations
export const REGISTRY_TYPES: RegistryTypeInfo[] = [
  {
    type: "dockerhub",
    name: "Docker Hub",
    description: "Official Docker registry for container images",
    icon: "Box",
    urlRequired: false,
    fields: [
      {
        key: "username",
        label: "Username",
        type: "text",
        placeholder: "your-dockerhub-username",
        required: true,
      },
      {
        key: "password",
        label: "Personal Access Token",
        type: "password",
        placeholder: "dckr_pat_...",
        required: true,
        helpLink: {
          prefix: "Create a PAT at",
          linkText: "app.docker.com/settings/personal-access-tokens",
          url: "https://app.docker.com/settings/personal-access-tokens",
        },
      },
    ],
  },
  {
    type: "ghcr",
    name: "GitHub Container Registry",
    description: "GitHub's container registry for packages",
    icon: "Github",
    urlRequired: false,
    fields: [
      {
        key: "username",
        label: "GitHub Username",
        type: "text",
        placeholder: "your-github-username",
        required: true,
      },
      {
        key: "password",
        label: "Personal Access Token",
        type: "password",
        placeholder: "ghp_...",
        required: true,
        helpText:
          "Required scopes: repo (private repos), write:packages (push), read:packages (pull)",
        helpLink: {
          prefix: "Create a PAT with required scopes at",
          linkText: "github.com/settings/tokens/new",
          url: "https://github.com/settings/tokens/new?scopes=repo,write:packages,read:packages&description=KubeOrch",
        },
      },
    ],
  },
  {
    type: "ecr",
    name: "AWS ECR",
    description: "Amazon Elastic Container Registry",
    icon: "Cloud",
    urlRequired: true,
    urlPlaceholder: "123456789012.dkr.ecr.us-east-1.amazonaws.com",
    fields: [
      {
        key: "accessKeyId",
        label: "Access Key ID",
        type: "text",
        placeholder: "AKIAIOSFODNN7EXAMPLE",
        required: true,
      },
      {
        key: "secretAccessKey",
        label: "Secret Access Key",
        type: "password",
        placeholder: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        required: true,
      },
      {
        key: "region",
        label: "Region",
        type: "text",
        placeholder: "us-east-1",
        required: true,
      },
    ],
  },
  {
    type: "gcr",
    name: "Google Artifact Registry",
    description: "Google Cloud's container and artifact registry",
    icon: "Cloud",
    urlRequired: true,
    urlPlaceholder: "us-docker.pkg.dev",
    fields: [
      {
        key: "serviceAccountJson",
        label: "Service Account JSON",
        type: "textarea",
        placeholder: '{"type": "service_account", ...}',
        required: true,
        helpText: "Paste the entire service account JSON key file",
      },
    ],
  },
  {
    type: "acr",
    name: "Azure Container Registry",
    description: "Microsoft Azure's container registry",
    icon: "Cloud",
    urlRequired: true,
    urlPlaceholder: "myregistry.azurecr.io",
    fields: [
      {
        key: "tenantId",
        label: "Tenant ID",
        type: "text",
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        required: true,
      },
      {
        key: "clientId",
        label: "Client ID (App ID)",
        type: "text",
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        required: true,
      },
      {
        key: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "Your service principal secret",
        required: true,
      },
    ],
  },
  {
    type: "custom",
    name: "Custom Registry",
    description: "Self-hosted or other container registries",
    icon: "Server",
    urlRequired: true,
    urlPlaceholder: "registry.example.com",
    fields: [
      {
        key: "username",
        label: "Username",
        type: "text",
        placeholder: "username",
        required: true,
      },
      {
        key: "password",
        label: "Password / Token",
        type: "password",
        placeholder: "Your password or token",
        required: true,
      },
    ],
  },
];

// Helper function to get registry type info
export function getRegistryTypeInfo(
  type: RegistryType
): RegistryTypeInfo | undefined {
  return REGISTRY_TYPES.find(rt => rt.type === type);
}

// Helper function to detect registry type from image URL
export function detectRegistryType(image: string): RegistryType {
  // If no slash or no dot in first segment, it's Docker Hub
  if (!image.includes("/")) {
    return "dockerhub";
  }

  const domain = image.split("/")[0];

  // Check if it looks like a domain (contains a dot)
  if (!domain.includes(".")) {
    return "dockerhub";
  }

  // Match known registries
  if (domain === "docker.io" || domain === "index.docker.io") {
    return "dockerhub";
  }
  if (domain === "ghcr.io") {
    return "ghcr";
  }
  if (domain.endsWith(".azurecr.io")) {
    return "acr";
  }
  if (
    (domain.includes(".dkr.ecr.") && domain.includes(".amazonaws.com")) ||
    domain.includes("public.ecr.aws")
  ) {
    return "ecr";
  }
  if (domain.endsWith(".gcr.io") || domain.endsWith("-docker.pkg.dev")) {
    return "gcr";
  }

  return "custom";
}

// Helper function to get status color
export function getStatusColor(status: RegistryStatus): string {
  switch (status) {
    case "connected":
      return "text-green-500";
    case "disconnected":
      return "text-yellow-500";
    case "error":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

// Helper function to get status badge variant
export function getStatusBadgeVariant(
  status: RegistryStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "connected":
      return "default";
    case "disconnected":
      return "secondary";
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}

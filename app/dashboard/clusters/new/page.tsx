"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Info, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/errorHandling";
import { TokenAuthForm } from "@/components/clusters/TokenAuthForm";

type AuthType =
  | "token"
  | "certificate"
  | "kubeconfig"
  | "serviceaccount"
  | "oidc";

interface ClusterFormData {
  name: string;
  displayName: string;
  description: string;
  server: string;
  authType: AuthType;
  singleNode: boolean;
  credentials: {
    token?: string;
    caData?: string;
    clientCertData?: string;
    clientKeyData?: string;
    kubeconfig?: string;
    namespace?: string;
    oidcIssuerUrl?: string;
    oidcClientId?: string;
    oidcClientSecret?: string;
    oidcRefreshToken?: string;
    oidcScopes?: string[];
    insecure?: boolean;
  };
  labels?: Record<string, string>;
}

export default function NewClusterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<ClusterFormData>({
    name: "",
    displayName: "",
    description: "",
    server: "",
    authType: "token",
    singleNode: false,
    credentials: {
      namespace: "default",
      insecure: false,
    },
    labels: {},
  });

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Clusters", href: "/dashboard/clusters" },
    { label: "Add Cluster" },
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith("credentials.")) {
      const credField = field.replace("credentials.", "");
      setFormData(prev => ({
        ...prev,
        credentials: {
          ...prev.credentials,
          [credField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const toBase64 = (str: string): string => btoa(str);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.server) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Base64-encode PEM/sensitive credential fields before sending
      const encodedCredentials = { ...formData.credentials };
      if (encodedCredentials.clientCertData) {
        encodedCredentials.clientCertData = toBase64(
          encodedCredentials.clientCertData
        );
      }
      if (encodedCredentials.clientKeyData) {
        encodedCredentials.clientKeyData = toBase64(
          encodedCredentials.clientKeyData
        );
      }
      if (encodedCredentials.caData) {
        encodedCredentials.caData = toBase64(encodedCredentials.caData);
      }

      const payload = { ...formData, credentials: encodedCredentials };
      const response = await api.post("/clusters", payload);

      // The backend automatically tests the connection and sets the status
      const clusterStatus = response.data?.status;

      if (clusterStatus === "connected") {
        toast.success("Cluster added and connected successfully!");
      } else if (clusterStatus === "error") {
        toast.warning(
          "Cluster added but connection failed. You can update credentials later in cluster settings."
        );
      } else {
        toast.success("Cluster added successfully");
      }

      router.push("/dashboard/clusters");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add cluster"));
    } finally {
      setLoading(false);
    }
  };

  const pageActions = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/dashboard/clusters")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Clusters
      </Button>
    </>
  );

  return (
    <AppLayout>
      <PageContainer
        title="Add Kubernetes Cluster"
        description="Configure a new Kubernetes cluster connection"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cluster Information</CardTitle>
              <CardDescription>
                Basic information about your Kubernetes cluster
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Cluster Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="production-cluster"
                    value={formData.name}
                    onChange={e => handleInputChange("name", e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier for this cluster (lowercase, no spaces)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Production Cluster"
                    value={formData.displayName}
                    onChange={e =>
                      handleInputChange("displayName", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Friendly name for display in the UI
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="server">
                  API Server URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="server"
                  type="url"
                  placeholder="https://kubernetes.example.com:6443"
                  value={formData.server}
                  onChange={e => handleInputChange("server", e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The Kubernetes API server endpoint
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Main production cluster in us-west-2"
                  value={formData.description}
                  onChange={e =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="namespace">Default Namespace</Label>
                <Input
                  id="namespace"
                  placeholder="default"
                  value={formData.credentials.namespace}
                  onChange={e =>
                    handleInputChange("credentials.namespace", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>
                Choose how to authenticate with your cluster
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={formData.authType}
                onValueChange={value => handleInputChange("authType", value)}
              >
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="token">Token</TabsTrigger>
                  <TabsTrigger value="certificate">Certificate</TabsTrigger>
                  <TabsTrigger value="kubeconfig">KubeConfig</TabsTrigger>
                  <TabsTrigger value="serviceaccount">
                    Service Account
                  </TabsTrigger>
                  <TabsTrigger value="oidc">OIDC</TabsTrigger>
                </TabsList>

                <TabsContent value="token" className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Use a bearer token for authentication. You can get this
                      from your cluster admin or service account token.
                    </AlertDescription>
                  </Alert>
                  <TokenAuthForm
                    tokenValue={formData.credentials.token || ""}
                    caDataValue={formData.credentials.caData || ""}
                    onTokenChange={value =>
                      handleInputChange("credentials.token", value)
                    }
                    onCaDataChange={value =>
                      handleInputChange("credentials.caData", value)
                    }
                    tokenLabel="Bearer Token"
                    tokenId="token"
                  />
                </TabsContent>

                <TabsContent value="certificate" className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Use X.509 client certificates for authentication
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="client-cert">Client Certificate</Label>
                    <Textarea
                      id="client-cert"
                      placeholder="-----BEGIN CERTIFICATE-----"
                      value={formData.credentials.clientCertData}
                      onChange={e =>
                        handleInputChange(
                          "credentials.clientCertData",
                          e.target.value
                        )
                      }
                      rows={4}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-key">Client Key</Label>
                    <Textarea
                      id="client-key"
                      placeholder="-----BEGIN RSA PRIVATE KEY-----"
                      value={formData.credentials.clientKeyData}
                      onChange={e =>
                        handleInputChange(
                          "credentials.clientKeyData",
                          e.target.value
                        )
                      }
                      rows={4}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ca-cert">CA Certificate (Optional)</Label>
                    <Textarea
                      id="ca-cert"
                      placeholder="-----BEGIN CERTIFICATE-----"
                      value={formData.credentials.caData}
                      onChange={e =>
                        handleInputChange("credentials.caData", e.target.value)
                      }
                      rows={4}
                      className="font-mono text-xs"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="kubeconfig" className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Paste your complete kubeconfig file contents here
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="kubeconfig">KubeConfig File</Label>
                    <Textarea
                      id="kubeconfig"
                      placeholder="apiVersion: v1&#10;kind: Config&#10;clusters:..."
                      value={formData.credentials.kubeconfig}
                      onChange={e =>
                        handleInputChange(
                          "credentials.kubeconfig",
                          e.target.value
                        )
                      }
                      rows={12}
                      className="font-mono text-xs"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="serviceaccount" className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Use a Kubernetes service account token for authentication
                    </AlertDescription>
                  </Alert>
                  <TokenAuthForm
                    tokenValue={formData.credentials.token || ""}
                    caDataValue={formData.credentials.caData || ""}
                    onTokenChange={value =>
                      handleInputChange("credentials.token", value)
                    }
                    onCaDataChange={value =>
                      handleInputChange("credentials.caData", value)
                    }
                    tokenLabel="Service Account Token"
                    tokenId="sa-token"
                  />
                </TabsContent>

                <TabsContent value="oidc" className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Use OpenID Connect for authentication
                    </AlertDescription>
                  </Alert>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="oidc-issuer">Issuer URL</Label>
                      <Input
                        id="oidc-issuer"
                        placeholder="https://accounts.google.com"
                        value={formData.credentials.oidcIssuerUrl}
                        onChange={e =>
                          handleInputChange(
                            "credentials.oidcIssuerUrl",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oidc-client">Client ID</Label>
                      <Input
                        id="oidc-client"
                        placeholder="client-id"
                        value={formData.credentials.oidcClientId}
                        onChange={e =>
                          handleInputChange(
                            "credentials.oidcClientId",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oidc-secret">Client Secret</Label>
                      <Input
                        id="oidc-secret"
                        type="password"
                        placeholder="client-secret"
                        value={formData.credentials.oidcClientSecret}
                        onChange={e =>
                          handleInputChange(
                            "credentials.oidcClientSecret",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oidc-refresh">Refresh Token</Label>
                      <Input
                        id="oidc-refresh"
                        placeholder="refresh-token"
                        value={formData.credentials.oidcRefreshToken}
                        onChange={e =>
                          handleInputChange(
                            "credentials.oidcRefreshToken",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="mt-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="insecure"
                    checked={formData.credentials.insecure}
                    onCheckedChange={checked =>
                      handleInputChange("credentials.insecure", checked)
                    }
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="insecure"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Skip TLS Verification (Insecure)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow connections to clusters with self-signed or invalid
                      certificates
                    </p>
                  </div>
                </div>
                {formData.credentials.insecure && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> Skipping TLS verification is
                      insecure and should only be used for testing or
                      development clusters. Production clusters should always
                      use proper certificates.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-start space-x-3 mt-4">
                  <Checkbox
                    id="singleNode"
                    checked={formData.singleNode}
                    onCheckedChange={checked =>
                      setFormData(prev => ({
                        ...prev,
                        singleNode: checked as boolean,
                      }))
                    }
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="singleNode"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Single-Node Mode (Development)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Remove control-plane taints to allow workloads on
                      single-node clusters
                    </p>
                  </div>
                </div>
                {formData.singleNode && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Single-node mode will remove control-plane taints,
                      allowing pods to be scheduled on control-plane nodes. This
                      is suitable for development or single-node clusters only.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/clusters")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Cluster"}
              </Button>
            </div>
          </div>
        </form>
      </PageContainer>
    </AppLayout>
  );
}

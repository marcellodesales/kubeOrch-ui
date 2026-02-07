"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { InlineLoader } from "@/components/ui/loader";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import api from "@/lib/api";
import { ArrowLeft, Save, Lock, Info, AlertTriangle } from "lucide-react";
import { TokenAuthForm } from "@/components/clusters/TokenAuthForm";

type AuthType =
  | "token"
  | "certificate"
  | "kubeconfig"
  | "serviceaccount"
  | "oidc";

interface EditClusterFormData {
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
    insecure?: boolean;
  };
}

export default function EditClusterPage() {
  const params = useParams();
  const router = useRouter();
  const clusterName = params.name as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clusterDisplayName, setClusterDisplayName] = useState(clusterName);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formData, setFormData] = useState<EditClusterFormData>({
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
  });

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Clusters", href: "/dashboard/clusters" },
    { label: clusterDisplayName || clusterName },
    { label: "Edit" },
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

  const fetchCluster = async () => {
    try {
      const response = await api.get(`/clusters/${clusterName}`);
      const cluster = response.data;

      if (cluster.displayName || cluster.name) {
        setClusterDisplayName(cluster.displayName || cluster.name);
      }

      let mappedAuthType: AuthType = "token";
      if (cluster.authType === "bearer" || cluster.authType === "token") {
        mappedAuthType = "token";
      } else if (cluster.authType === "certificate") {
        mappedAuthType = "certificate";
      } else if (cluster.authType === "kubeconfig") {
        mappedAuthType = "kubeconfig";
      } else if (
        cluster.authType === "serviceaccount" ||
        cluster.authType === "serviceAccount"
      ) {
        mappedAuthType = "serviceaccount";
      } else if (cluster.authType === "oidc") {
        mappedAuthType = "oidc";
      }

      setFormData({
        name: cluster.name || "",
        displayName: cluster.displayName || "",
        description: cluster.description || "",
        server: cluster.server || "",
        authType: mappedAuthType,
        singleNode: cluster.singleNode || false,
        credentials: {
          namespace: cluster.namespace || "default",
          insecure: cluster.insecure || false,
        },
      });
      setDataLoaded(true);
    } catch (error) {
      toast.error("Failed to load cluster details");
      console.error("Failed to load cluster:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clusterName) {
      fetchCluster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData: Record<string, unknown> = {
        displayName: formData.displayName,
        description: formData.description,
        server: formData.server,
        authType: formData.authType,
        singleNode: formData.singleNode,
        insecure: formData.credentials.insecure,
      };

      // Build credentials object with only non-empty fields
      const credentials: Record<string, unknown> = {};

      if (formData.credentials.namespace) {
        credentials.namespace = formData.credentials.namespace;
      }
      if (formData.credentials.insecure) {
        credentials.insecure = formData.credentials.insecure;
      }

      switch (formData.authType) {
        case "token":
        case "serviceaccount":
          if (formData.credentials.token) {
            credentials.token = formData.credentials.token;
          }
          if (formData.credentials.caData) {
            credentials.caData = formData.credentials.caData;
          }
          break;
        case "certificate":
          if (formData.credentials.clientCertData) {
            credentials.clientCertData = formData.credentials.clientCertData;
          }
          if (formData.credentials.clientKeyData) {
            credentials.clientKeyData = formData.credentials.clientKeyData;
          }
          if (formData.credentials.caData) {
            credentials.caData = formData.credentials.caData;
          }
          break;
        case "kubeconfig":
          if (formData.credentials.kubeconfig) {
            credentials.kubeconfig = formData.credentials.kubeconfig;
          }
          break;
        case "oidc":
          if (formData.credentials.oidcIssuerUrl) {
            credentials.oidcIssuerUrl = formData.credentials.oidcIssuerUrl;
          }
          if (formData.credentials.oidcClientId) {
            credentials.oidcClientId = formData.credentials.oidcClientId;
          }
          if (formData.credentials.oidcClientSecret) {
            credentials.oidcClientSecret =
              formData.credentials.oidcClientSecret;
          }
          if (formData.credentials.oidcRefreshToken) {
            credentials.oidcRefreshToken =
              formData.credentials.oidcRefreshToken;
          }
          break;
      }

      if (Object.keys(credentials).length > 0) {
        updateData.credentials = credentials;
      }

      await api.put(`/clusters/${clusterName}`, updateData);
      toast.success("Cluster updated successfully");
      router.push("/dashboard/clusters");
    } catch (error) {
      toast.error("Failed to update cluster");
      console.error("Failed to update cluster:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      await api.post(`/clusters/${clusterName}/test`);
      toast.success("Connection test successful");
    } catch (error) {
      toast.error("Connection test failed");
      console.error("Connection test failed:", error);
    }
  };

  const pageActions = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/dashboard/clusters")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Clusters
      </Button>
    </div>
  );

  if (loading || !dataLoaded) {
    return (
      <AppLayout>
        <PageContainer
          title="Edit Cluster"
          description="Update cluster configuration"
          breadcrumbs={breadcrumbs}
          actions={pageActions}
        >
          <div className="flex items-center justify-center h-64">
            <InlineLoader />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer
        title="Edit Cluster"
        description="Update cluster configuration and credentials"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cluster Information</CardTitle>
              <CardDescription>
                Update the basic information for this cluster
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={e =>
                    handleInputChange("displayName", e.target.value)
                  }
                  placeholder="Enter a display name for the cluster"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Enter a description for the cluster"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="server">Kubernetes API Server</Label>
                <Input
                  id="server"
                  value={formData.server}
                  onChange={e => handleInputChange("server", e.target.value)}
                  placeholder="https://kubernetes.example.com:6443"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="namespace">Default Namespace</Label>
                <Input
                  id="namespace"
                  value={formData.credentials.namespace}
                  onChange={e =>
                    handleInputChange("credentials.namespace", e.target.value)
                  }
                  placeholder="default"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Authentication
              </CardTitle>
              <CardDescription>
                Update the authentication method and credentials for this
                cluster. Existing credentials are not displayed for security
                reasons — only fill in fields you want to update.
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
                      value={formData.credentials.clientCertData || ""}
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
                      value={formData.credentials.clientKeyData || ""}
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
                      value={formData.credentials.caData || ""}
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
                      value={formData.credentials.kubeconfig || ""}
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
                        value={formData.credentials.oidcIssuerUrl || ""}
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
                        value={formData.credentials.oidcClientId || ""}
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
                        value={formData.credentials.oidcClientSecret || ""}
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
                        value={formData.credentials.oidcRefreshToken || ""}
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
                      handleInputChange(
                        "credentials.insecure",
                        checked as boolean
                      )
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
                      Skip TLS certificate verification when connecting to the
                      cluster
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

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="singleNode"
                    checked={formData.singleNode}
                    onCheckedChange={checked =>
                      handleInputChange("singleNode", checked as boolean)
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

                <div className="flex justify-between items-center pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={saving}
                  >
                    Test Connection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/clusters")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <InlineLoader className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </PageContainer>
    </AppLayout>
  );
}

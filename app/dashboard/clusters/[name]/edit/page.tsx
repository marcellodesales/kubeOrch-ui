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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InlineLoader } from "@/components/ui/loader";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import api from "@/lib/api";
import { ArrowLeft, Save, Lock, Info } from "lucide-react";

export default function EditClusterPage() {
  const params = useParams();
  const router = useRouter();
  const clusterName = params.name as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clusterDisplayName, setClusterDisplayName] = useState(clusterName);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    server: "",
    authType: "serviceAccount" as string,
    token: "",
    singleNode: false,
    insecure: false,
  });

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Clusters", href: "/dashboard/clusters" },
    { label: clusterDisplayName || clusterName },
    { label: "Edit" },
  ];

  const fetchCluster = async () => {
    try {
      const response = await api.get(`/clusters/${clusterName}`);
      const cluster = response.data;

      console.log("Cluster data received:", cluster); // Debug log

      // Update display name for breadcrumb
      if (cluster.displayName || cluster.name) {
        setClusterDisplayName(cluster.displayName || cluster.name);
      }

      // Update form data with the received values
      // Map the authType to match our select options
      let mappedAuthType = cluster.authType;
      if (mappedAuthType === "bearer" || mappedAuthType === "token") {
        mappedAuthType = "token";
      } else if (!mappedAuthType) {
        mappedAuthType = "serviceAccount";
      }

      const newFormData = {
        name: cluster.name || "",
        displayName: cluster.displayName || "",
        description: cluster.description || "",
        server: cluster.server || "",
        authType: mappedAuthType,
        token: "", // Never show existing token for security
        singleNode: cluster.singleNode || false,
        insecure: cluster.insecure || false,
      };

      setFormData(newFormData);
      setDataLoaded(true);

      console.log("Form data set to:", newFormData);
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
        insecure: formData.insecure,
      };

      // Only include credentials if token is provided
      if (formData.token) {
        updateData.credentials = {
          token: formData.token,
        };
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
                    setFormData({ ...formData, displayName: e.target.value })
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
                    setFormData({ ...formData, description: e.target.value })
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
                  onChange={e =>
                    setFormData({ ...formData, server: e.target.value })
                  }
                  placeholder="https://kubernetes.example.com:6443"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authType">Authentication Type</Label>
                <Select
                  value={formData.authType}
                  onValueChange={value =>
                    setFormData({ ...formData, authType: value })
                  }
                >
                  <SelectTrigger id="authType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serviceAccount">
                      Service Account
                    </SelectItem>
                    <SelectItem value="token">Bearer Token</SelectItem>
                    <SelectItem value="kubeconfig">Kubeconfig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Credentials
              </CardTitle>
              <CardDescription>
                Update the authentication token for this cluster. The existing
                token is not shown for security reasons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">
                  Service Account Token / Bearer Token
                </Label>
                <div className="space-y-1">
                  <Textarea
                    id="token"
                    value={formData.token}
                    onChange={e =>
                      setFormData({ ...formData, token: e.target.value })
                    }
                    placeholder="Enter new token to update (leave empty to keep existing)"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Note: Existing token is not displayed for security reasons.
                    Only enter a new token if you want to update it.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-4 border-t">
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
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Single-node mode will remove control-plane taints, allowing
                    pods to be scheduled on control-plane nodes. This is
                    suitable for development or single-node clusters only.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-start space-x-3 pt-4 border-t">
                <Checkbox
                  id="insecure"
                  checked={formData.insecure}
                  onCheckedChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      insecure: checked as boolean,
                    }))
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
              {formData.insecure && (
                <Alert variant="destructive" className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Skipping TLS verification is insecure and should
                    only be used for testing or development environments.
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

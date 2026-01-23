import React, { useCallback, useMemo, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import { SecretNodeData } from "@/lib/types/nodes";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";

// Status renderer for Secret nodes
function SecretStatus({ data }: { data: SecretNodeData }) {
  if (!data._status) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Status</h3>
        <Badge
          variant={
            data._status.state === "created"
              ? "default"
              : data._status.state === "error"
                ? "destructive"
                : "secondary"
          }
          className="flex items-center gap-1"
        >
          {data._status.state === "created" && (
            <CheckCircle2 className="h-3 w-3" />
          )}
          {data._status.state === "error" && (
            <AlertCircle className="h-3 w-3" />
          )}
          {data._status.state || "Pending"}
        </Badge>
      </div>

      {data._secretCreated && (
        <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
          <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Secret exists in Kubernetes
          </p>
        </div>
      )}

      {data._status.message && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            {data._status.message}
          </p>
        </div>
      )}
    </div>
  );
}

// Secret keys editor component
function SecretKeysEditor({
  data,
  nodeId,
  editable,
}: {
  data: SecretNodeData;
  nodeId: string;
  editable: boolean;
}) {
  const {
    updateNodeData,
    secretValues: allSecretValues,
    setSecretValue,
    renameSecretKey,
    removeSecretKey,
  } = useWorkflowStore();
  const keys = useMemo(() => data.keys || [], [data.keys]);

  // Get secret values for this node from store (not stored in DB)
  const secretValues = allSecretValues[nodeId] || {};
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const handleKeyChange = useCallback(
    (oldKey: string, newKey: string) => {
      if (oldKey === newKey) return;
      const newKeys = keys.map(k => (k === oldKey ? newKey : k));
      updateNodeData(nodeId, {
        ...data,
        keys: newKeys,
      } as unknown as WorkflowNodeData);
      // Update secret values in store
      renameSecretKey(nodeId, oldKey, newKey);
    },
    [data, keys, nodeId, updateNodeData, renameSecretKey]
  );

  const handleValueChange = useCallback(
    (key: string, value: string) => {
      setSecretValue(nodeId, key, value);
    },
    [nodeId, setSecretValue]
  );

  const handleAddKey = useCallback(() => {
    // Generate a unique temporary key to avoid collisions
    const tempKey = `_new_${Date.now()}`;
    updateNodeData(nodeId, {
      ...data,
      keys: [...keys, tempKey],
    } as unknown as WorkflowNodeData);
    setSecretValue(nodeId, tempKey, "");
  }, [data, keys, nodeId, updateNodeData, setSecretValue]);

  const handleRemoveKey = useCallback(
    (key: string) => {
      // Prevent removing the last key - must have at least 1
      if (keys.length <= 1) return;
      const newKeys = keys.filter(k => k !== key);
      updateNodeData(nodeId, {
        ...data,
        keys: newKeys,
      } as unknown as WorkflowNodeData);
      removeSecretKey(nodeId, key);
    },
    [data, keys, nodeId, updateNodeData, removeSecretKey]
  );

  const toggleShowValue = useCallback((key: string) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Secret Data</h3>
        </div>
        {editable && (
          <Button size="sm" variant="outline" onClick={handleAddKey}>
            <Plus className="h-3 w-3 mr-1" />
            Add Key
          </Button>
        )}
      </div>

      <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Security Note:</strong> Secret values are sent directly to
          Kubernetes when the workflow runs. Only key names are stored in the
          workflow data.
        </p>
      </div>

      <div className="space-y-3">
        {keys.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-md">
            No secret keys. Click &quot;Add Key&quot; to create one.
          </div>
        ) : (
          keys.map((key, index) => (
            <div key={index} className="p-3 border rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground w-12">
                  Key
                </Label>
                <Input
                  value={key.startsWith("_new_") ? "" : key}
                  placeholder="SECRET_KEY"
                  onChange={e => handleKeyChange(key, e.target.value)}
                  disabled={!editable}
                  className="h-8 text-sm font-mono"
                />
                {editable && keys.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleRemoveKey(key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground w-12">
                  Value
                </Label>
                <div className="flex-1 relative">
                  <Input
                    type={showValues[key] ? "text" : "password"}
                    value={secretValues[key] || ""}
                    placeholder="Enter secret value..."
                    onChange={e => handleValueChange(key, e.target.value)}
                    disabled={!editable}
                    className="h-8 text-sm font-mono pr-10"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 absolute right-1 top-1"
                    onClick={() => toggleShowValue(key)}
                  >
                    {showValues[key] ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const secretSettingsConfig: NodeSettingsConfig = {
  title: "Secret Settings",
  sections: [
    {
      id: "basic",
      title: "Basic Configuration",
      fields: [
        {
          id: "namespace",
          label: "Namespace",
          type: "text",
          field: "namespace",
          placeholder: "default",
        },
        {
          id: "secretType",
          label: "Secret Type",
          type: "select",
          field: "secretType",
          options: [
            { value: "Opaque", label: "Opaque (Generic)" },
            { value: "kubernetes.io/tls", label: "TLS Certificate" },
            {
              value: "kubernetes.io/dockerconfigjson",
              label: "Docker Registry",
            },
          ],
        },
        {
          id: "mountPath",
          label: "Mount Path",
          type: "text",
          field: "mountPath",
          placeholder: "/etc/secrets",
          description:
            "Directory path where Secret will be mounted in containers",
        },
      ],
    },
  ],
  statusRenderer: data => <SecretStatus data={data as SecretNodeData} />,
  extraContent: (data, { nodeId, editable }) => (
    <SecretKeysEditor
      data={data as SecretNodeData}
      nodeId={nodeId}
      editable={editable}
    />
  ),
};

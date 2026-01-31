import React from "react";
import { Shield, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import { NetworkPolicyNodeData } from "@/lib/types/nodes";

// Status renderer for NetworkPolicy nodes
function NetworkPolicyStatus({
  data,
}: {
  data: NetworkPolicyNodeData;
  editable: boolean;
}) {
  if (!data._status) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Status</h3>
        <Badge variant="default" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {data._status.state || "active"}
        </Badge>
      </div>

      {data._status.affectedPods !== undefined && (
        <div className="text-xs text-muted-foreground">
          Affecting {data._status.affectedPods} pod(s)
        </div>
      )}

      <div className="flex gap-2">
        {data.policyTypes?.includes("Ingress") && (
          <Badge variant="outline" className="text-xs">
            <ArrowDownToLine className="h-3 w-3 mr-1" />
            Ingress ({data.ingressRules?.length ?? 0} rules)
          </Badge>
        )}
        {data.policyTypes?.includes("Egress") && (
          <Badge variant="outline" className="text-xs">
            <ArrowUpFromLine className="h-3 w-3 mr-1" />
            Egress ({data.egressRules?.length ?? 0} rules)
          </Badge>
        )}
      </div>

      {data._status.message && (
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-xs">{data._status.message}</p>
        </div>
      )}
    </div>
  );
}

// Pod selector display
function PodSelectorDisplay({ data }: { data: NetworkPolicyNodeData }) {
  const selector = data.podSelector || {};
  const entries = Object.entries(selector);

  if (entries.length === 0) {
    return (
      <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
        <strong>Pod Selector:</strong> {} (applies to all pods in namespace)
      </div>
    );
  }

  return (
    <div className="text-xs bg-muted/50 rounded p-2">
      <strong>Pod Selector:</strong>
      <div className="mt-1 space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="font-mono">
            {key}: {value}
          </div>
        ))}
      </div>
    </div>
  );
}

export const networkPolicySettingsConfig: NodeSettingsConfig = {
  title: "NetworkPolicy Settings",
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
      ],
    },
  ],
  statusRenderer: (data, editable) => (
    <NetworkPolicyStatus
      data={data as NetworkPolicyNodeData}
      editable={editable}
    />
  ),
  extraContent: data => (
    <div className="space-y-4">
      <PodSelectorDisplay data={data as NetworkPolicyNodeData} />
      <div className="text-xs text-muted-foreground">
        <p>
          <strong>Note:</strong> NetworkPolicy rules are complex and are best
          edited through the YAML view or by connecting to workload nodes.
        </p>
        <p className="mt-2">
          When connected to a Deployment/StatefulSet/DaemonSet, the pod selector
          will be automatically populated.
        </p>
      </div>
    </div>
  ),
};

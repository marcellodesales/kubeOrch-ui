import React, { memo, useCallback } from "react";
import { Handle, Position, NodeProps as ReactFlowNodeProps } from "reactflow";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";
import { NetworkPolicyNodeData, NetworkPolicyRule } from "@/lib/types/nodes";
import {
  CompactCard,
  CompactCardContent,
  CompactCardHeader,
  CompactCardTitle,
} from "@/components/ui/compact-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Shield } from "lucide-react";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

export type { NetworkPolicyNodeData };

const generateRuleId = () =>
  `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const NetworkPolicyNode = memo(
  ({ data, id }: ReactFlowNodeProps<NetworkPolicyNodeData>) => {
    const { updateNodeData, openNodeSettings, editable } = useWorkflowStore();

    const handlePolicyTypeToggle = useCallback(
      (type: "Ingress" | "Egress") => {
        const currentTypes = data.policyTypes || [];
        let newTypes: ("Ingress" | "Egress")[];

        if (currentTypes.includes(type)) {
          newTypes = currentTypes.filter(t => t !== type);
          if (newTypes.length === 0) {
            newTypes = [type];
          }
        } else {
          newTypes = [...currentTypes, type];
        }

        updateNodeData(id, {
          ...data,
          policyTypes: newTypes,
        } as unknown as WorkflowNodeData);
      },
      [data, id, updateNodeData]
    );

    const handleAddRule = useCallback(
      (direction: "ingress" | "egress") => {
        const rulesField =
          direction === "ingress" ? "ingressRules" : "egressRules";
        const peerField = direction === "ingress" ? "from" : "to";
        const existingRules = data[rulesField] || [];
        const newRule: NetworkPolicyRule = {
          id: generateRuleId(),
          [peerField]: [],
          ports: [],
        };
        updateNodeData(id, {
          ...data,
          [rulesField]: [...existingRules, newRule],
        } as unknown as WorkflowNodeData);
      },
      [data, id, updateNodeData]
    );

    const openSettings = useCallback(() => {
      openNodeSettings(id, data as unknown as WorkflowNodeData);
    }, [id, data, openNodeSettings]);

    const hasIngress = data.policyTypes?.includes("Ingress");
    const hasEgress = data.policyTypes?.includes("Egress");

    const ingressRules: NetworkPolicyRule[] = data.ingressRules || [];
    const egressRules: NetworkPolicyRule[] = data.egressRules || [];

    const getRulePeerCount = (
      rule: NetworkPolicyRule,
      direction: "ingress" | "egress"
    ) => {
      const peers = direction === "ingress" ? rule.from : rule.to;
      return peers?.length ?? 0;
    };

    const ruleHasLinkedPeers = (
      rule: NetworkPolicyRule,
      direction: "ingress" | "egress"
    ) => {
      const peers = direction === "ingress" ? rule.from : rule.to;
      return peers?.some(p => !!p._linkedWorkload) ?? false;
    };

    const podSelectorText =
      data.podSelector && Object.keys(data.podSelector).length > 0
        ? Object.entries(data.podSelector)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")
        : "";

    const cardContent = (
      <CompactCard className="w-[260px] shadow-md border relative">
        <CompactCardHeader className="flex flex-row items-center justify-between relative">
          {/* Header output handle - for top-level podSelector linking */}
          <Handle
            type="source"
            position={Position.Right}
            id="output"
            className="w-2 h-2 absolute"
            style={{
              background: data._linkedWorkloads?.length
                ? "var(--primary)"
                : "var(--handle-color)",
              right: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
            }}
          />

          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-red-500/10">
              <Shield className="h-3.5 w-3.5 text-red-600" />
            </div>
            <CompactCardTitle>NetworkPolicy</CompactCardTitle>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={openSettings}
          >
            <Settings className="h-3 w-3" />
          </Button>
        </CompactCardHeader>

        <CompactCardContent className="space-y-2">
          {/* Pod Selector field */}
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Pod Selector
            </Label>
            <Input
              value={podSelectorText}
              placeholder={
                data._linkedWorkloads?.length ? "Auto-linked" : "app=myapp"
              }
              onChange={e => {
                const parsed: Record<string, string> = {};
                if (e.target.value.trim()) {
                  e.target.value.split(",").forEach(pair => {
                    const [k, ...rest] = pair.split("=");
                    if (k?.trim()) {
                      parsed[k.trim()] = rest.join("=").trim();
                    }
                  });
                }
                updateNodeData(id, {
                  ...data,
                  podSelector: parsed,
                } as unknown as WorkflowNodeData);
              }}
              disabled={!editable}
              className="h-7 text-sm rounded-sm py-1 focus:ring-1 focus:ring-offset-0"
            />
          </div>

          {/* Policy type toggle buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePolicyTypeToggle("Ingress")}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                hasIngress
                  ? "bg-blue-500/20 border-blue-500 text-blue-600"
                  : "bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600"
              }`}
              disabled={!editable}
            >
              Ingress
            </button>
            <button
              type="button"
              onClick={() => handlePolicyTypeToggle("Egress")}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                hasEgress
                  ? "bg-green-500/20 border-green-500 text-green-600"
                  : "bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600"
              }`}
              disabled={!editable}
            >
              Egress
            </button>
          </div>

          {/* Ingress rules with per-rule handles */}
          {hasIngress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">
                  Ingress Rules
                </Label>
                {editable && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                    onClick={() => handleAddRule("ingress")}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {ingressRules.map((rule, index) => {
                  const peerCount = getRulePeerCount(rule, "ingress");
                  const hasLinked = ruleHasLinkedPeers(rule, "ingress");

                  return (
                    <div
                      key={rule.id}
                      className="relative flex items-center text-xs text-muted-foreground px-1 py-0.5"
                    >
                      <span className="truncate">
                        Rule {index + 1}: {peerCount} peer
                        {peerCount !== 1 ? "s" : ""}
                      </span>

                      <Handle
                        type="source"
                        position={Position.Right}
                        id={rule.id}
                        className="w-2 h-2 absolute"
                        style={{
                          background: hasLinked
                            ? "var(--primary)"
                            : "var(--handle-color)",
                          right: "-20px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 10,
                        }}
                      />
                    </div>
                  );
                })}
                {ingressRules.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic px-1">
                    No rules — all ingress blocked
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Egress rules with per-rule handles */}
          {hasEgress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">
                  Egress Rules
                </Label>
                {editable && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                    onClick={() => handleAddRule("egress")}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {egressRules.map((rule, index) => {
                  const peerCount = getRulePeerCount(rule, "egress");
                  const hasLinked = ruleHasLinkedPeers(rule, "egress");

                  return (
                    <div
                      key={rule.id}
                      className="relative flex items-center text-xs text-muted-foreground px-1 py-0.5"
                    >
                      <span className="truncate">
                        Rule {index + 1}: {peerCount} peer
                        {peerCount !== 1 ? "s" : ""}
                      </span>

                      <Handle
                        type="source"
                        position={Position.Right}
                        id={rule.id}
                        className="w-2 h-2 absolute"
                        style={{
                          background: hasLinked
                            ? "var(--primary)"
                            : "var(--handle-color)",
                          right: "-20px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 10,
                        }}
                      />
                    </div>
                  );
                })}
                {egressRules.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic px-1">
                    No rules — all egress blocked
                  </p>
                )}
              </div>
            </div>
          )}
        </CompactCardContent>
      </CompactCard>
    );

    return (
      <DisabledInputWrapper disabled={!editable}>
        {cardContent}
      </DisabledInputWrapper>
    );
  }
);

NetworkPolicyNode.displayName = "NetworkPolicyNode";

export default NetworkPolicyNode;

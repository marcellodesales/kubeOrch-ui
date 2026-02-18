import React, { useState, useEffect } from "react";
import {
  Shield,
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
  X,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import {
  NetworkPolicyNodeData,
  NetworkPolicyRule,
  NetworkPolicyPeer,
  NetworkPolicyPort,
} from "@/lib/types/nodes";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import { WorkflowNodeData } from "@/stores/WorkflowStore";
import { Switch } from "@/components/ui/switch";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// --- Status renderer ---

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

// --- Key-value pair editor ---

let kvIdCounter = 0;

interface KVPair {
  id: number;
  key: string;
  value: string;
}

function entriesToPairs(entries: Record<string, string>): KVPair[] {
  return Object.entries(entries).map(([key, value]) => ({
    id: kvIdCounter++,
    key,
    value,
  }));
}

function pairsToEntries(pairs: KVPair[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of pairs) {
    if (pair.key !== "" || pair.value !== "") {
      result[pair.key] = pair.value;
    }
  }
  return result;
}

function KeyValueEditor({
  entries,
  onChange,
  editable,
  placeholder,
}: {
  entries: Record<string, string>;
  onChange: (entries: Record<string, string>) => void;
  editable: boolean;
  placeholder?: { key: string; value: string };
}) {
  const [pairs, setPairs] = useState<KVPair[]>(() => entriesToPairs(entries));

  // Sync from parent when entries change externally
  useEffect(() => {
    const currentEntries = pairsToEntries(pairs);
    const entriesKeys = Object.keys(entries).sort().join(",");
    const currentKeys = Object.keys(currentEntries).sort().join(",");
    if (entriesKeys !== currentKeys) {
      setPairs(entriesToPairs(entries));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  const handleChange = (id: number, field: "key" | "value", newVal: string) => {
    const updated = pairs.map(p =>
      p.id === id ? { ...p, [field]: newVal } : p
    );
    setPairs(updated);
    onChange(pairsToEntries(updated));
  };

  const handleAdd = () => {
    const newPair: KVPair = { id: kvIdCounter++, key: "", value: "" };
    const updated = [...pairs, newPair];
    setPairs(updated);
  };

  const handleRemove = (id: number) => {
    const updated = pairs.filter(p => p.id !== id);
    setPairs(updated);
    onChange(pairsToEntries(updated));
  };

  return (
    <div className="space-y-2">
      {pairs.map(pair => (
        <div key={pair.id} className="flex items-center gap-2">
          <DisabledInputWrapper disabled={!editable} className="flex-1">
            <Input
              value={pair.key}
              placeholder={placeholder?.key ?? "key"}
              onChange={e => handleChange(pair.id, "key", e.target.value)}
              disabled={!editable}
              className="h-7 text-xs"
            />
          </DisabledInputWrapper>
          <span className="text-xs text-muted-foreground">=</span>
          <DisabledInputWrapper disabled={!editable} className="flex-1">
            <Input
              value={pair.value}
              placeholder={placeholder?.value ?? "value"}
              onChange={e => handleChange(pair.id, "value", e.target.value)}
              disabled={!editable}
              className="h-7 text-xs"
            />
          </DisabledInputWrapper>
          {editable && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0"
              onClick={() => handleRemove(pair.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      {editable && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdd}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Label
        </Button>
      )}
    </div>
  );
}

// --- Pod selector editor ---

function PodSelectorEditor({
  data,
  nodeId,
  editable,
}: {
  data: NetworkPolicyNodeData;
  nodeId: string;
  editable: boolean;
}) {
  const { updateNodeData } = useWorkflowStore();
  const selector = data.podSelector || {};

  const handleChange = (newSelector: Record<string, string>) => {
    updateNodeData(nodeId, {
      ...data,
      podSelector: newSelector,
    } as unknown as WorkflowNodeData);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Pod Selector</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Select which pods this policy applies to. Empty selector matches all
        pods in the namespace.
      </p>

      {data._linkedWorkloads && data._linkedWorkloads.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Linked:</span>
          {data._linkedWorkloads.map(wl => (
            <Badge key={wl} variant="secondary" className="text-xs">
              {wl}
            </Badge>
          ))}
        </div>
      )}

      <KeyValueEditor
        entries={selector}
        onChange={handleChange}
        editable={editable}
        placeholder={{ key: "app", value: "myapp" }}
      />
    </div>
  );
}

// --- Port editor within a rule ---

function PortsEditor({
  ports,
  onChange,
  editable,
}: {
  ports: NetworkPolicyPort[];
  onChange: (ports: NetworkPolicyPort[]) => void;
  editable: boolean;
}) {
  const handlePortChange = (
    portId: string,
    field: keyof NetworkPolicyPort,
    value: string | number
  ) => {
    onChange(ports.map(p => (p.id === portId ? { ...p, [field]: value } : p)));
  };

  const handleAddPort = () => {
    onChange([
      ...ports,
      { id: generateId("port"), protocol: "TCP", port: "" as any },
    ]);
  };

  const handleRemovePort = (portId: string) => {
    onChange(ports.filter(p => p.id !== portId));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Ports</Label>
        {editable && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddPort}
            className="h-6 text-xs px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Port
          </Button>
        )}
      </div>
      {ports.map(port => (
        <div key={port.id} className="flex items-center gap-2">
          <DisabledInputWrapper disabled={!editable} className="w-24">
            <Select
              value={port.protocol || "TCP"}
              onValueChange={v => handlePortChange(port.id, "protocol", v)}
              disabled={!editable}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TCP">TCP</SelectItem>
                <SelectItem value="UDP">UDP</SelectItem>
                <SelectItem value="SCTP">SCTP</SelectItem>
              </SelectContent>
            </Select>
          </DisabledInputWrapper>
          <DisabledInputWrapper disabled={!editable} className="flex-1">
            <Input
              value={port.port ?? ""}
              placeholder="Port number"
              onChange={e => {
                const val = e.target.value;
                const num = parseInt(val);
                handlePortChange(port.id, "port", isNaN(num) ? val : num);
              }}
              disabled={!editable}
              className="h-7 text-xs"
            />
          </DisabledInputWrapper>
          {editable && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0"
              onClick={() => handleRemovePort(port.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      {ports.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          No ports specified (all ports allowed)
        </p>
      )}
    </div>
  );
}

// --- Peer editor within a rule ---

function PeerEditor({
  peer,
  onChange,
  onRemove,
  editable,
}: {
  peer: NetworkPolicyPeer;
  onChange: (peer: NetworkPolicyPeer) => void;
  onRemove: () => void;
  editable: boolean;
}) {
  const isLinked = !!peer._linkedWorkload;

  const handleTypeChange = (
    type: "podSelector" | "namespaceSelector" | "ipBlock"
  ) => {
    const updated: NetworkPolicyPeer = { id: peer.id, type };
    if (type === "podSelector") updated.podSelector = {};
    else if (type === "namespaceSelector") updated.namespaceSelector = {};
    else updated.ipBlock = { cidr: "" };
    onChange(updated);
  };

  // Linked peers are read-only — managed by canvas edges
  if (isLinked) {
    const labels = peer.podSelector
      ? Object.entries(peer.podSelector)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")
      : "";

    return (
      <div className="rounded border bg-background p-2 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Link2 className="h-3 w-3" />
            Linked
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            {labels || "Pod Selector"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border bg-background p-2 space-y-2">
      <div className="flex items-center justify-between">
        <DisabledInputWrapper disabled={!editable} className="flex-1">
          <Select
            value={peer.type}
            onValueChange={v => handleTypeChange(v as any)}
            disabled={!editable}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="podSelector">Pod Selector</SelectItem>
              <SelectItem value="namespaceSelector">
                Namespace Selector
              </SelectItem>
              <SelectItem value="ipBlock">IP Block</SelectItem>
            </SelectContent>
          </Select>
        </DisabledInputWrapper>
        {editable && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 ml-2 shrink-0"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {peer.type === "podSelector" && (
        <KeyValueEditor
          entries={peer.podSelector || {}}
          onChange={podSelector => onChange({ ...peer, podSelector })}
          editable={editable}
          placeholder={{ key: "app", value: "frontend" }}
        />
      )}

      {peer.type === "namespaceSelector" && (
        <KeyValueEditor
          entries={peer.namespaceSelector || {}}
          onChange={namespaceSelector =>
            onChange({ ...peer, namespaceSelector })
          }
          editable={editable}
          placeholder={{ key: "env", value: "production" }}
        />
      )}

      {peer.type === "ipBlock" && (
        <div className="space-y-2">
          <DisabledInputWrapper disabled={!editable}>
            <Input
              value={peer.ipBlock?.cidr || ""}
              placeholder="10.0.0.0/8"
              onChange={e =>
                onChange({
                  ...peer,
                  ipBlock: {
                    ...peer.ipBlock,
                    cidr: e.target.value,
                    except: peer.ipBlock?.except,
                  },
                })
              }
              disabled={!editable}
              className="h-7 text-xs"
            />
          </DisabledInputWrapper>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Except CIDRs (one per line)
            </Label>
            <DisabledInputWrapper disabled={!editable}>
              <textarea
                value={(peer.ipBlock?.except || []).join("\n")}
                placeholder="10.0.1.0/24"
                onChange={e => {
                  const except = e.target.value
                    .split("\n")
                    .filter(s => s.trim() !== "");
                  onChange({
                    ...peer,
                    ipBlock: {
                      cidr: peer.ipBlock?.cidr || "",
                      except: except.length > 0 ? except : undefined,
                    },
                  });
                }}
                disabled={!editable}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs resize-none h-14"
              />
            </DisabledInputWrapper>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Single rule editor ---

function RuleEditor({
  rule,
  direction,
  onChange,
  onRemove,
  editable,
  index,
}: {
  rule: NetworkPolicyRule;
  direction: "ingress" | "egress";
  onChange: (rule: NetworkPolicyRule) => void;
  onRemove: () => void;
  editable: boolean;
  index: number;
}) {
  const peerField = direction === "ingress" ? "from" : "to";
  const peers: NetworkPolicyPeer[] = rule[peerField] || [];
  const ports: NetworkPolicyPort[] = rule.ports || [];
  const peerLabel = direction === "ingress" ? "From" : "To";

  const handlePeerChange = (peerId: string, updated: NetworkPolicyPeer) => {
    const newPeers = peers.map(p => (p.id === peerId ? updated : p));
    onChange({ ...rule, [peerField]: newPeers });
  };

  const handleAddPeer = () => {
    const newPeer: NetworkPolicyPeer = {
      id: generateId("peer"),
      type: "podSelector",
      podSelector: {},
    };
    onChange({ ...rule, [peerField]: [...peers, newPeer] });
  };

  const handleRemovePeer = (peerId: string) => {
    onChange({ ...rule, [peerField]: peers.filter(p => p.id !== peerId) });
  };

  const handlePortsChange = (newPorts: NetworkPolicyPort[]) => {
    onChange({ ...rule, ports: newPorts });
  };

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Rule {index + 1}
        </span>
        {editable && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Peers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">{peerLabel}</Label>
          {editable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddPeer}
              className="h-6 text-xs px-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Peer
            </Button>
          )}
        </div>
        {peers.map(peer => (
          <PeerEditor
            key={peer.id}
            peer={peer}
            onChange={updated => handlePeerChange(peer.id, updated)}
            onRemove={() => handleRemovePeer(peer.id)}
            editable={editable}
          />
        ))}
        {peers.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No peers specified (allows all{" "}
            {direction === "ingress" ? "sources" : "destinations"})
          </p>
        )}
      </div>

      {/* Ports */}
      <PortsEditor
        ports={ports}
        onChange={handlePortsChange}
        editable={editable}
      />
    </div>
  );
}

// --- Rules list editor (ingress or egress) ---

function RulesEditor({
  data,
  nodeId,
  direction,
  editable,
}: {
  data: NetworkPolicyNodeData;
  nodeId: string;
  direction: "ingress" | "egress";
  editable: boolean;
}) {
  const { updateNodeData } = useWorkflowStore();
  const rulesField = direction === "ingress" ? "ingressRules" : "egressRules";
  const rules: NetworkPolicyRule[] = data[rulesField] || [];
  const icon =
    direction === "ingress" ? (
      <ArrowDownToLine className="h-3.5 w-3.5" />
    ) : (
      <ArrowUpFromLine className="h-3.5 w-3.5" />
    );

  const updateRules = (newRules: NetworkPolicyRule[]) => {
    updateNodeData(nodeId, {
      ...data,
      [rulesField]: newRules,
    } as unknown as WorkflowNodeData);
  };

  const handleAddRule = () => {
    const newRule: NetworkPolicyRule = {
      id: generateId("rule"),
      [direction === "ingress" ? "from" : "to"]: [],
      ports: [],
    };
    updateRules([...rules, newRule]);
  };

  const handleRuleChange = (ruleId: string, updated: NetworkPolicyRule) => {
    updateRules(rules.map(r => (r.id === ruleId ? updated : r)));
  };

  const handleRemoveRule = (ruleId: string) => {
    updateRules(rules.filter(r => r.id !== ruleId));
  };

  if (
    !data.policyTypes?.includes(direction === "ingress" ? "Ingress" : "Egress")
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {icon}
          {direction === "ingress" ? "Ingress" : "Egress"} Rules
        </h3>
        {editable && (
          <Button size="sm" variant="outline" onClick={handleAddRule}>
            <Plus className="h-3 w-3 mr-1" />
            Add Rule
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {direction === "ingress"
          ? "Define which traffic is allowed to reach the selected pods."
          : "Define which traffic the selected pods are allowed to send."}
      </p>

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <RuleEditor
            key={rule.id}
            rule={rule}
            direction={direction}
            onChange={updated => handleRuleChange(rule.id, updated)}
            onRemove={() => handleRemoveRule(rule.id)}
            editable={editable}
            index={index}
          />
        ))}
      </div>

      {rules.length === 0 && (
        <div className="rounded-md border border-dashed p-4 text-center">
          <p className="text-xs text-muted-foreground">
            No {direction} rules. All {direction} traffic will be blocked.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Policy types toggle ---

function PolicyTypesEditor({
  data,
  nodeId,
  editable,
}: {
  data: NetworkPolicyNodeData;
  nodeId: string;
  editable: boolean;
}) {
  const { updateNodeData } = useWorkflowStore();
  const policyTypes = data.policyTypes || [];

  const handleToggle = (type: "Ingress" | "Egress") => {
    let newTypes: ("Ingress" | "Egress")[];
    if (policyTypes.includes(type)) {
      newTypes = policyTypes.filter(t => t !== type);
      if (newTypes.length === 0) newTypes = [type]; // keep at least one
    } else {
      newTypes = [...policyTypes, type];
    }
    updateNodeData(nodeId, {
      ...data,
      policyTypes: newTypes,
    } as unknown as WorkflowNodeData);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Policy Types</h3>
      <p className="text-xs text-muted-foreground">
        Choose which traffic directions this policy controls.
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="h-3.5 w-3.5 text-blue-500" />
            <Label className="text-sm">Ingress</Label>
          </div>
          <Switch
            checked={policyTypes.includes("Ingress")}
            onCheckedChange={() => handleToggle("Ingress")}
            disabled={!editable}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="h-3.5 w-3.5 text-green-500" />
            <Label className="text-sm">Egress</Label>
          </div>
          <Switch
            checked={policyTypes.includes("Egress")}
            onCheckedChange={() => handleToggle("Egress")}
            disabled={!editable}
          />
        </div>
      </div>
    </div>
  );
}

// --- Main editor that combines everything ---

function NetworkPolicyEditor({
  data,
  nodeId,
  editable,
}: {
  data: NetworkPolicyNodeData;
  nodeId: string;
  editable: boolean;
}) {
  return (
    <div className="space-y-6">
      <PodSelectorEditor data={data} nodeId={nodeId} editable={editable} />
      <PolicyTypesEditor data={data} nodeId={nodeId} editable={editable} />
      <RulesEditor
        data={data}
        nodeId={nodeId}
        direction="ingress"
        editable={editable}
      />
      <RulesEditor
        data={data}
        nodeId={nodeId}
        direction="egress"
        editable={editable}
      />
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
  extraContent: (data, { nodeId, editable }) => (
    <NetworkPolicyEditor
      data={data as NetworkPolicyNodeData}
      nodeId={nodeId}
      editable={editable}
    />
  ),
};

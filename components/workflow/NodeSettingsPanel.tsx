import React, { ReactNode } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowNodeData } from "@/stores/WorkflowStore";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";
import { deploymentSettingsConfig } from "./settings/DeploymentSettings";
import { serviceSettingsConfig } from "./settings/ServiceSettings";
import { ingressSettingsConfig } from "./settings/IngressSettings";
import { configMapSettingsConfig } from "./settings/ConfigMapSettings";
import { secretSettingsConfig } from "./settings/SecretSettings";
import { persistentVolumeClaimSettingsConfig } from "./settings/PersistentVolumeClaimSettings";
import { statefulSetSettingsConfig } from "./settings/StatefulSetSettings";
import { jobSettingsConfig } from "./settings/JobSettings";
import { cronJobSettingsConfig } from "./settings/CronJobSettings";
import { daemonSetSettingsConfig } from "./settings/DaemonSetSettings";
import { hpaSettingsConfig } from "./settings/HPASettings";
import { networkPolicySettingsConfig } from "./settings/NetworkPolicySettings";
import { usePanelStore } from "@/stores/PanelStore";
import { ResizablePanel } from "@/components/ui/ResizablePanel";

// Types
export interface SettingsField {
  id: string;
  label?: string;
  type: "text" | "number" | "select" | "port" | "group" | "toggle" | "stringarray";
  field?: string; // Path like "resources.limits.cpu"
  placeholder?: string;
  required?: boolean;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  fields?: SettingsField[]; // For group (side-by-side)
  min?: number;
  max?: number;
}

export interface SettingsSection {
  id: string;
  title: string;
  description?: string;
  fields: SettingsField[];
}

export interface NodeSettingsConfig {
  title: string;
  sections: SettingsSection[];
  statusRenderer?: (data: any, editable: boolean) => ReactNode;
  extraContent?: (
    data: any,
    props: { workflowId?: string; nodeId: string; editable: boolean }
  ) => ReactNode;
}

interface NodeSettingsPanelProps {
  isOpen: boolean;
  nodeId: string | null;
  data: WorkflowNodeData | null;
  nodeType:
    | "deployment"
    | "service"
    | "ingress"
    | "configmap"
    | "secret"
    | "persistentvolumeclaim"
    | "statefulset"
    | "job"
    | "cronjob"
    | "daemonset"
    | "hpa"
    | "networkpolicy"
    | "plugin";
  onClose: () => void;
  onUpdate: (nodeId: string, data: WorkflowNodeData) => void;
  onDelete?: (nodeId: string) => void;
  editable?: boolean;
  workflowId?: string;
}

// Helper to get nested value from object using dot notation
const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((current, key) => current?.[key], obj);
};

// Helper to set nested value in object using dot notation
const setNestedValue = (obj: any, path: string, value: any): any => {
  const result = { ...obj };
  const paths = path.split(".");
  let current: Record<string, unknown> = result;

  for (let i = 0; i < paths.length - 1; i++) {
    if (!current[paths[i]]) {
      current[paths[i]] = {};
    } else {
      current[paths[i]] = { ...(current[paths[i]] as object) };
    }
    current = current[paths[i]] as Record<string, unknown>;
  }

  current[paths[paths.length - 1]] = value;
  return result;
};

export default function NodeSettingsPanel({
  isOpen,
  nodeId,
  data,
  nodeType,
  onClose,
  onUpdate,
  onDelete,
  editable = true,
  workflowId,
}: NodeSettingsPanelProps) {
  const { nodeSettingsWidth, setNodeSettingsWidth } = usePanelStore();

  if (!isOpen || !data || !nodeId) return null;

  const settingsConfigMap: Record<string, NodeSettingsConfig> = {
    deployment: deploymentSettingsConfig,
    service: serviceSettingsConfig,
    ingress: ingressSettingsConfig,
    configmap: configMapSettingsConfig,
    secret: secretSettingsConfig,
    persistentvolumeclaim: persistentVolumeClaimSettingsConfig,
    statefulset: statefulSetSettingsConfig,
    job: jobSettingsConfig,
    cronjob: cronJobSettingsConfig,
    daemonset: daemonSetSettingsConfig,
    hpa: hpaSettingsConfig,
    networkpolicy: networkPolicySettingsConfig,
  };

  const config = settingsConfigMap[nodeType] || deploymentSettingsConfig;

  const handleFieldUpdate = (
    field: string,
    value: string | number | boolean | string[]
  ) => {
    const updatedData = setNestedValue(data, field, value);
    onUpdate(nodeId, updatedData);
  };

  const handlePortChange = (field: string, value: string) => {
    if (value === "") {
      handleFieldUpdate(field, NaN);
      return;
    }
    const digitsOnly = value.replace(/\D/g, "");
    const numValue = parseInt(digitsOnly, 10);
    if (!isNaN(numValue) && numValue <= 65535) {
      handleFieldUpdate(field, numValue);
    }
  };

  const renderField = (field: SettingsField) => {
    if (field.type === "group" && field.fields) {
      return (
        <div key={field.id} className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {field.fields.map(subField => (
              <div key={subField.id} className="space-y-2">
                {subField.label && (
                  <Label htmlFor={subField.id} className="text-sm">
                    {subField.label}
                  </Label>
                )}
                {renderFieldInput(subField)}
                {subField.description && (
                  <p className="text-xs text-muted-foreground">
                    {subField.description}
                  </p>
                )}
              </div>
            ))}
          </div>
          {field.description && (
            <p className="text-xs text-muted-foreground whitespace-pre-line">{field.description}</p>
          )}
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-2">
        {field.label && (
          <Label htmlFor={field.id} className="text-sm">
            {field.label}
          </Label>
        )}
        {renderFieldInput(field)}
        {field.description && (
          <p className="text-xs text-muted-foreground whitespace-pre-line">{field.description}</p>
        )}
      </div>
    );
  };

  const renderFieldInput = (field: SettingsField) => {
    const value = field.field ? getNestedValue(data, field.field) : undefined;

    if (field.type === "select" && field.options) {
      return (
        <DisabledInputWrapper disabled={!editable}>
          <Select
            value={String(value ?? "")}
            onValueChange={v =>
              field.field && handleFieldUpdate(field.field, v)
            }
            disabled={!editable}
          >
            <SelectTrigger
              id={field.id}
              disabled={!editable}
              className="w-full mt-1.5"
            >
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DisabledInputWrapper>
      );
    }

    if (field.type === "port") {
      return (
        <DisabledInputWrapper disabled={!editable}>
          <Input
            id={field.id}
            className="mt-1.5"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={isNaN(value) ? "" : (value ?? "")}
            placeholder={field.placeholder}
            onChange={e =>
              field.field && handlePortChange(field.field, e.target.value)
            }
            disabled={!editable}
          />
        </DisabledInputWrapper>
      );
    }

    if (field.type === "number") {
      return (
        <DisabledInputWrapper disabled={!editable}>
          <Input
            id={field.id}
            className="mt-1.5"
            type="number"
            min={field.min}
            max={field.max}
            value={isNaN(value) ? "" : (value ?? "")}
            placeholder={field.placeholder}
            onChange={e =>
              field.field &&
              handleFieldUpdate(field.field, parseInt(e.target.value))
            }
            disabled={!editable}
          />
        </DisabledInputWrapper>
      );
    }

    if (field.type === "stringarray") {
      const arrayValue: string[] = Array.isArray(value) ? value : [];
      return (
        <DisabledInputWrapper disabled={!editable}>
          <Input
            id={field.id}
            className="mt-1.5"
            value={arrayValue.join(", ")}
            placeholder={field.placeholder}
            onChange={e => {
              if (!field.field) return;
              const raw = e.target.value;
              if (raw === "") {
                handleFieldUpdate(field.field, []);
              } else {
                handleFieldUpdate(
                  field.field,
                  raw.split(",").map(s => s.trim())
                );
              }
            }}
            disabled={!editable}
          />
        </DisabledInputWrapper>
      );
    }

    if (field.type === "toggle") {
      return (
        <div className="flex items-center space-x-2 mt-1.5">
          <Switch
            id={field.id}
            checked={!!value}
            onCheckedChange={checked =>
              field.field && handleFieldUpdate(field.field, checked)
            }
            disabled={!editable}
          />
        </div>
      );
    }

    // Default: text
    return (
      <DisabledInputWrapper disabled={!editable}>
        <Input
          id={field.id}
          className="mt-1.5"
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={e =>
            field.field && handleFieldUpdate(field.field, e.target.value)
          }
          disabled={!editable}
        />
      </DisabledInputWrapper>
    );
  };

  const renderSection = (section: SettingsSection) => (
    <div key={section.id} className="space-y-4">
      <h3 className="text-sm font-semibold">{section.title}</h3>
      {section.description && (
        <p className="text-xs text-muted-foreground">{section.description}</p>
      )}
      {section.fields.map(renderField)}
    </div>
  );

  return (
    <ResizablePanel
      width={nodeSettingsWidth}
      minWidth={280}
      maxWidth={600}
      onWidthChange={setNodeSettingsWidth}
      className={`fixed right-0 top-0 h-full bg-card border-l shadow-lg transform transition-transform duration-300 z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{config.title}</h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-80px)]">
        {/* Status Section */}
        {config.statusRenderer && (
          <>
            {config.statusRenderer(data, editable)}
            <Separator />
          </>
        )}

        {/* Node Name - Always present */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Node Name</Label>
          <DisabledInputWrapper disabled={!editable}>
            <Input
              value={data.name || ""}
              onChange={e => handleFieldUpdate("name", e.target.value)}
              placeholder="Enter node name"
              className="mt-1.5"
              disabled={!editable}
            />
          </DisabledInputWrapper>
        </div>

        <Separator />

        {/* Configurable Sections */}
        {config.sections.map((section, index) => (
          <React.Fragment key={section.id}>
            {renderSection(section)}
            {index < config.sections.length - 1 && <Separator />}
          </React.Fragment>
        ))}

        {/* Extra Content (e.g., Service Diagnostics) */}
        {config.extraContent && (
          <>
            <Separator />
            {config.extraContent(data, { workflowId, nodeId, editable })}
          </>
        )}

        <Separator />

        {/* Labels - Always present */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Labels</h3>
          <p className="text-xs text-muted-foreground">
            Add custom labels for your {nodeType}
          </p>
          <DisabledInputWrapper disabled={!editable}>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!editable}
            >
              Add Label
            </Button>
          </DisabledInputWrapper>
        </div>

        <Separator />

        {/* Delete Node - Always present */}
        <div className="pt-4">
          <DisabledInputWrapper disabled={!editable}>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              disabled={!editable}
              onClick={() => {
                if (onDelete && nodeId) {
                  onDelete(nodeId);
                  onClose();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Node
            </Button>
          </DisabledInputWrapper>
        </div>
      </div>
    </ResizablePanel>
  );
}

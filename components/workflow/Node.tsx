import React from "react";
import { Handle, Position } from "reactflow";
import {
  CompactCard,
  CompactCardContent,
  CompactCardHeader,
  CompactCardTitle,
} from "@/components/ui/compact-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";

export interface NodeField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "group";
  value?: string | number | boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  required?: boolean;
  hasError?: boolean;
  hasConnector?: boolean;
  options?: Array<{ value: string; label: string }>;
  onChange?: (value: string | number | boolean) => void;
  fields?: NodeField[]; // For grouped fields
}

export interface NodeProps {
  title: string;
  fields: NodeField[];
  onSettingsClick?: () => void;
  className?: string;
}

export default function Node({
  title,
  fields,
  onSettingsClick,
  className,
}: NodeProps) {
  return (
    <CompactCard
      className={`w-[280px] shadow-md border relative ${className || ""}`}
    >
      <CompactCardHeader className="flex flex-row items-center justify-between relative">
        {/* Left connector - centered on header */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 absolute"
          style={{
            background: "#555",
            left: "-12px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />

        <CompactCardTitle>{title}</CompactCardTitle>

        {onSettingsClick && (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={onSettingsClick}
          >
            <Settings className="h-3 w-3" />
          </Button>
        )}
      </CompactCardHeader>

      <CompactCardContent className="space-y-2 relative">
        {fields.map(field => {
          if (field.type === "group" && field.fields) {
            // Render grouped fields (like replicas and port side by side)
            return (
              <div key={field.id} className="relative">
                <div className="grid grid-cols-2 gap-2">
                  {field.fields.map(subField => (
                    <div key={subField.id} className="space-y-1">
                      <Label
                        htmlFor={subField.id}
                        className="text-[10px] text-muted-foreground"
                      >
                        {subField.label}
                      </Label>
                      {subField.type === "select" && subField.options ? (
                        <Select
                          value={String(subField.value ?? "")}
                          onValueChange={value => subField.onChange?.(value)}
                        >
                          <SelectTrigger
                            className={`h-7 text-sm rounded-sm py-1 focus:ring-1 focus:ring-offset-0 ${subField.hasError ? "border-red-500" : ""}`}
                          >
                            <SelectValue placeholder={subField.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {subField.options.map(option => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={subField.id}
                          type={
                            subField.type === "group" ? "text" : subField.type
                          }
                          min={subField.min}
                          max={subField.max}
                          value={
                            typeof subField.value === "boolean"
                              ? String(subField.value)
                              : subField.type === "number" &&
                                  isNaN(subField.value as number)
                                ? ""
                                : (subField.value ?? "")
                          }
                          onChange={e => {
                            subField.onChange?.(
                              subField.type === "number"
                                ? parseInt(e.target.value)
                                : e.target.value
                            );
                          }}
                          placeholder={subField.placeholder}
                          className={`h-7 text-sm rounded-sm py-1 focus:ring-1 focus:ring-offset-0 ${
                            subField.hasError ? "border-red-500" : ""
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {/* Connector for grouped fields - centered on the label row */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`group-${field.id}`}
                  className="w-2 h-2 absolute"
                  style={{
                    background: "#555",
                    right: "-20px",
                    top: "12px", // Positioned at label level
                    zIndex: 10,
                  }}
                />
              </div>
            );
          }

          // Single field with optional individual connector
          return (
            <div key={field.id} className="space-y-1 relative">
              <Label
                htmlFor={field.id}
                className="text-[10px] text-muted-foreground"
              >
                {field.label}
              </Label>

              {field.type === "select" && field.options ? (
                <Select
                  value={String(field.value ?? "")}
                  onValueChange={value => field.onChange?.(value)}
                >
                  <SelectTrigger
                    className={`h-7 text-sm rounded-sm py-1 focus:ring-1 focus:ring-offset-0 ${field.hasError ? "border-red-500" : ""}`}
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
              ) : (
                <Input
                  id={field.id}
                  type={field.type === "group" ? "text" : field.type}
                  min={field.min}
                  max={field.max}
                  value={
                    typeof field.value === "boolean"
                      ? String(field.value)
                      : field.type === "number" && isNaN(field.value as number)
                        ? ""
                        : (field.value ?? "")
                  }
                  onChange={e => {
                    field.onChange?.(
                      field.type === "number"
                        ? parseInt(e.target.value)
                        : e.target.value
                    );
                  }}
                  placeholder={field.placeholder}
                  className={`h-7 text-sm rounded-sm py-1 focus:ring-1 focus:ring-offset-0 ${
                    field.hasError ? "border-red-500" : ""
                  }`}
                />
              )}

              {/* Connector at label level for single fields */}
              <Handle
                type="source"
                position={Position.Right}
                id={field.id}
                className="w-2 h-2 absolute"
                style={{
                  background: "#555",
                  right: "-20px",
                  top: "0px", // Positioned at label level
                  zIndex: 10,
                }}
              />
            </div>
          );
        })}
      </CompactCardContent>
    </CompactCard>
  );
}

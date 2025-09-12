import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TokenAuthFormProps {
  tokenValue: string;
  caDataValue: string;
  onTokenChange: (value: string) => void;
  onCaDataChange: (value: string) => void;
  tokenLabel?: string;
  tokenPlaceholder?: string;
  tokenId?: string;
}

export function TokenAuthForm({
  tokenValue,
  caDataValue,
  onTokenChange,
  onCaDataChange,
  tokenLabel = "Bearer Token",
  tokenPlaceholder = "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  tokenId = "token",
}: TokenAuthFormProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={tokenId}>{tokenLabel}</Label>
        <Textarea
          id={tokenId}
          placeholder={tokenPlaceholder}
          value={tokenValue}
          onChange={e => onTokenChange(e.target.value)}
          rows={4}
          className="font-mono text-xs break-all overflow-hidden resize-none"
          style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`ca-${tokenId}`}>CA Certificate (Optional)</Label>
        <Textarea
          id={`ca-${tokenId}`}
          placeholder="-----BEGIN CERTIFICATE-----"
          value={caDataValue}
          onChange={e => onCaDataChange(e.target.value)}
          rows={4}
          className="font-mono text-xs break-all overflow-hidden resize-none"
          style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
        />
      </div>
    </>
  );
}

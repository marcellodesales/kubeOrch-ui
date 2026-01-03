"use client";

import Editor from "@monaco-editor/react";

interface YAMLEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

export function YAMLEditor({
  value,
  onChange,
  readOnly = false,
  height = "300px",
}: YAMLEditorProps) {
  return (
    <Editor
      height={height}
      defaultLanguage="yaml"
      value={value}
      onChange={val => onChange?.(val || "")}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 12,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
      }}
      theme="vs-dark"
    />
  );
}

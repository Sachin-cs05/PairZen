"use client";

import { useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditorType } from "monaco-editor";
import { Loader2 } from "lucide-react";
import { ProgrammingLanguage } from "@/lib/db/models/interview-room";

interface CodeEditorProps {
  language: ProgrammingLanguage | string;
  isReadOnly?: boolean;
  onMountBinding?: (editor: MonacoEditorType.IStandaloneCodeEditor) => void;
  className?: string;
}

// Map Pairzen language names to Monaco Editor language identifiers
const LANGUAGE_MAP: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
  go: "go",
  rust: "rust",
};

export function CodeEditor({
  language,
  isReadOnly = false,
  onMountBinding,
  className = "",
}: CodeEditorProps) {
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define Pairzen high-contrast dark theme
    monaco.editor.defineTheme("pairzen-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
        { token: "keyword", foreground: "38bdf8", fontStyle: "bold" },
        { token: "string", foreground: "34d399" },
        { token: "number", foreground: "facc15" },
        { token: "type", foreground: "a78bfa" },
        { token: "function", foreground: "60a5fa" },
        { token: "variable", foreground: "f1f5f9" },
      ],
      colors: {
        "editor.background": "#090d16",
        "editor.foreground": "#f8fafc",
        "editor.lineHighlightBackground": "#1e293b40",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#38bdf8",
        "editorCursor.foreground": "#38bdf8",
        "editor.selectionBackground": "#38bdf833",
        "editor.inactiveSelectionBackground": "#38bdf81a",
        "editorIndentGuide.background": "#1e293b",
        "editorIndentGuide.activeBackground": "#334155",
      },
    });

    monaco.editor.setTheme("pairzen-dark");

    // Connect to Yjs Monaco binding
    if (onMountBinding) {
      onMountBinding(editor);
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: isReadOnly });
    }
  }, [isReadOnly]);

  const monacoLanguage = LANGUAGE_MAP[language] || "typescript";

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#090d16] ${className}`}>
      <Editor
        height="100%"
        width="100%"
        language={monacoLanguage}
        theme="pairzen-dark"
        options={{
          readOnly: isReadOnly,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontSize: 14,
          lineHeight: 22,
          tabSize: 2,
          minimap: {
            enabled: true,
            scale: 0.75,
          },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          bracketPairColorization: {
            enabled: true,
          },
          renderLineHighlight: "all",
          formatOnPaste: true,
          formatOnType: true,
          padding: {
            top: 16,
            bottom: 16,
          },
        }}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex h-full w-full flex-col items-center justify-center space-y-3 bg-[#090d16] text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
            <span className="text-sm font-medium">Loading Pairzen Workspace Editor...</span>
          </div>
        }
      />
    </div>
  );
}

'use client'

import React, { useCallback } from "react";
import Editor from '@monaco-editor/react';
import './SQLEditor.css';

interface SQLEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  height?: string | number;
}

const SQLEditor: React.FC<SQLEditorProps> = ({ 
  value = "SELECT * FROM your_table;", 
  onChange,
  height = "100%" 
}) => {
  const handleEditorWillMount = useCallback((monaco: any) => {
    monaco.languages.registerCompletionItemProvider("sql", {
      provideCompletionItems: () => {
        return {
          suggestions: [
            {
              label: "SELECT",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "SELECT",
              documentation: "选择数据列"
            },
            {
              label: "FROM",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "FROM",
              documentation: "指定数据表"
            },
            {
              label: "WHERE",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "WHERE",
              documentation: "添加筛选条件"
            },
            {
              label: "your_table",
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: "your_table",
              documentation: "示例表名"
            },
          ],
        };
      }
    });
  }, []);

  const handleChange = useCallback((value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  }, [onChange]);

  return (
    <div className="sql-editor-container">
      <Editor
        className="sql-editor"
        height={height}
        defaultLanguage="sql"
        defaultValue={value}
        value={value}
        theme="vs-dark"
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          cursorStyle: "line",
          wordWrap: "on",
          folding: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
        }}
        beforeMount={handleEditorWillMount}
        onChange={handleChange}
      />
    </div>
  );
};

export default SQLEditor;

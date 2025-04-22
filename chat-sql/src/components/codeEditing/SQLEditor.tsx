'use client'

import React, { useCallback, useState, useEffect } from "react";
import Editor from '@monaco-editor/react';
import './SQLEditor.css';
import { SQLQueryEngine } from '@/services/sqlExecutor';
import { Button, ButtonGroup } from '@mui/material';
import { PlayArrow, Undo, Save } from '@mui/icons-material';
import { message as antdMessage } from 'antd';
import { useLLMContext } from '@/contexts/LLMContext';
import { useQueryContext } from '@/contexts/QueryContext';

interface SQLEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onExecute?: (data: any) => void;
  height?: string | number;
}

const SQLEditor: React.FC<SQLEditorProps> = ({ 
  value, // 移除默认值，让它由父组件控制
  onChange,
  onExecute,
  height = "100%" 
}) => {
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const { llmResult } = useLLMContext();
  const [queryEngine, setQueryEngine] = useState<SQLQueryEngine | null>(null);
  const [error, setError] = useState<string>('');
  const [hasTransaction, setHasTransaction] = useState(false);
  const [editorValue, setEditorValue] = useState(value || ''); // 添加本地状态
  const { setQueryResult } = useQueryContext();

  // 当外部value改变时更新编辑器内容
  useEffect(() => {
    if (value !== undefined) {
      setEditorValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (llmResult?.data?.outputs) {
      const { tableStructure, tuples } = llmResult.data.outputs;
      if (tableStructure && tuples) {
        console.log('Initializing SQLQueryEngine with:', {
          tableStructure,
          tuples
        });
        setQueryEngine(new SQLQueryEngine(tableStructure, tuples));
      }
    }
  }, [llmResult]);

  const handleExecute = async () => {
    if (!queryEngine) {
      setError('请先生成数据库结构');
      return;
    }

    try {
      console.log('Current queryEngine state:', {
        engineExists: !!queryEngine,
        tables: queryEngine['tables'] // 添加调试信息
      });

      const result = queryEngine.executeQuery(value!);
      if (result.success) {
        if (result.data) {
          setQueryResult(result.data); // 使用上下文存储结果
          onExecute?.(result.data);
        }
        if (result.message) {
          messageApi.success(result.message);
        }
      } else {
        setError(result.message || '查询执行失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询执行失败');
    }
  };

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

  const handleChange = useCallback((newValue: string | undefined) => {
    if (newValue !== undefined) {
      setEditorValue(newValue);
      onChange?.(newValue);
    }
  }, [onChange]);

  return (
    <div className="sql-editor-container">
      {contextHolder}
      <div className="sql-editor-toolbar">
        <ButtonGroup>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleExecute}
            disabled={!queryEngine}
          >
            执行查询
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              try {
                queryEngine?.executeQuery('BEGIN');
                setHasTransaction(true);
                messageApi.info('事务已开始');
              } catch (err) {
                setError(err instanceof Error ? err.message : '开始事务失败');
              }
            }}
            disabled={!queryEngine || hasTransaction}
          >
            开始事务
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              try {
                queryEngine?.executeQuery('COMMIT');
                setHasTransaction(false);
                messageApi.success('事务已提交');
              } catch (err) {
                setError(err instanceof Error ? err.message : '提交事务失败');
              }
            }}
            disabled={!hasTransaction}
          >
            提交
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              try {
                queryEngine?.executeQuery('ROLLBACK');
                setHasTransaction(false);
                messageApi.info('事务已回滚');
              } catch (err) {
                setError(err instanceof Error ? err.message : '回滚事务失败');
              }
            }}
            disabled={!hasTransaction}
          >
            回滚
          </Button>
        </ButtonGroup>
      </div>
      {error && (
        <div className="error-message">{error}</div>
      )}
      <Editor
        className="sql-editor"
        height={height}
        defaultLanguage="sql"
        value={editorValue} // 使用本地状态而不是props直接传入
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

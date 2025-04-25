'use client'

import React, { useCallback, useState, useEffect, useRef } from "react";
import Editor from '@monaco-editor/react';
import './SQLEditor.css';
import './MonacoEditorStyles.css'; // 添加Monaco编辑器样式
import { SQLQueryEngine } from '@/services/sqlExecutor';
import { Button, ButtonGroup, Tooltip } from '@mui/material';
import { PlayArrow, KeyboardCommandKey, KeyboardReturn } from '@mui/icons-material';
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

  // 当表结构变化时，重新加载编辑器以更新自动补全
  const [editorKey, setEditorKey] = useState<number>(0);

  // 当表结构变化时，更新编辑器key以强制重新加载
  useEffect(() => {
    if (llmResult?.data?.outputs?.tableStructure) {
      setEditorKey(prev => prev + 1);
    }
  }, [llmResult?.data?.outputs?.tableStructure]);

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

  const handleExecute = useCallback(async () => {
    if (!queryEngine) {
      setError('请先生成数据库结构');
      return;
    }

    try {
      console.log('Current queryEngine state:', {
        engineExists: !!queryEngine,
        tables: queryEngine['tables'] // 添加调试信息
      });

      const result = queryEngine.executeQuery(editorValue);
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
  }, [queryEngine, editorValue, setError, setQueryResult, onExecute, messageApi]);

  // 保存自动补全提供器的引用，以便在需要时取消注册
  const completionProviderRef = useRef<any>(null);

  const handleEditorWillMount = useCallback((monaco: any) => {
    // 导入自动补全提供器
    const { createSQLCompletionProvider, createSQLHoverProvider } = require('@/lib/sqlCompletionProvider');

    // 尝试清除所有已注册的SQL自动补全提供器
    try {
      // 如果有之前注册的提供器，先取消注册
      if (completionProviderRef.current) {
        completionProviderRef.current.forEach((provider: any) => provider.dispose());
        completionProviderRef.current = [];
      }

      // 清除Monaco编辑器内部可能存在的自动补全提供器
      if (monaco.languages._builtinProviders && monaco.languages._builtinProviders['sql']) {
        const providers = monaco.languages._builtinProviders['sql'].filter(
          (p: any) => p.provider._type !== 'CompletionItemProvider'
        );
        monaco.languages._builtinProviders['sql'] = providers;
      }
    } catch (error) {
      console.warn('清除自动补全提供器失败', error);
    }

    // 初始化提供器引用数组
    if (!completionProviderRef.current) {
      completionProviderRef.current = [];
    }

    // 注册我们自定义的自动补全提供器
    const completionProvider = monaco.languages.registerCompletionItemProvider("sql",
      createSQLCompletionProvider(monaco, llmResult?.data?.outputs?.tableStructure)
    );
    completionProviderRef.current.push(completionProvider);

    // 注册悬停提示提供器
    const hoverProvider = monaco.languages.registerHoverProvider("sql",
      createSQLHoverProvider(monaco, llmResult?.data?.outputs?.tableStructure)
    );
    completionProviderRef.current.push(hoverProvider);

    // 配置编辑器参数，确保显示文档
    monaco.languages.setLanguageConfiguration('sql', {
      wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
      comments: {
        lineComment: '--',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    });
  }, [llmResult?.data?.outputs?.tableStructure]);

  const handleChange = useCallback((newValue: string | undefined) => {
    if (newValue !== undefined) {
      setEditorValue(newValue);
      onChange?.(newValue);
    }
  }, [onChange]);

  // 保存编辑器实例的引用
  const editorRef = useRef<any>(null);

  // 编辑器挂载后设置键盘快捷键
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    // 保存编辑器实例的引用
    editorRef.current = editor;

    // 添加键盘快捷键：Windows/Command + Enter 执行查询
    editor.addCommand(
      // 使用 CtrlCmd 表示在 Windows 上是 Ctrl，在 Mac 上是 Command
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        // 只有在查询引擎可用时才执行查询
        if (queryEngine) {
          // 直接从编辑器获取当前内容
          const currentValue = editor.getValue();
          console.log('执行查询，当前SQL:', currentValue);

          if (!currentValue.trim()) {
            messageApi.warning('SQL语句不能为空');
            return;
          }

          // 更新editorValue状态
          setEditorValue(currentValue);

          // 使用当前编辑器内容执行查询
          try {
            const result = queryEngine.executeQuery(currentValue);
            if (result.success) {
              if (result.data) {
                setQueryResult(result.data);
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
        } else {
          messageApi.warning('请先生成数据库结构');
        }
      }
    );

    // 可以在这里添加更多的键盘快捷键
  }, [queryEngine, setEditorValue, setQueryResult, onExecute, setError, messageApi]);

  return (
    <div className="sql-editor-container">
      {contextHolder}
      <div className="sql-editor-toolbar">
        <ButtonGroup>
          <Tooltip
            title={
              <div className="shortcut-tooltip">
                <span>shortcut：</span>
                <KeyboardCommandKey className="shortcut-icon" />
                <span className="shortcut-plus">+</span>
                <KeyboardReturn className="shortcut-icon" />
              </div>
            }
            arrow
            placement="top"
          >
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => {
                // 如果有编辑器实例，直接从编辑器获取当前内容
                if (editorRef.current) {
                  const currentValue = editorRef.current.getValue();
                  console.log('按钮执行查询，当前SQL:', currentValue);

                  if (!currentValue.trim()) {
                    messageApi.warning('SQL语句不能为空');
                    return;
                  }

                  // 更新editorValue状态
                  setEditorValue(currentValue);

                  // 使用当前编辑器内容执行查询
                  try {
                    const result = queryEngine!.executeQuery(currentValue);
                    if (result.success) {
                      if (result.data) {
                        setQueryResult(result.data);
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
                } else {
                  // 如果没有编辑器实例，使用状态中的值
                  handleExecute();
                }
              }}
              disabled={!queryEngine}
            >
              执行查询
            </Button>
          </Tooltip>
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
        key={editorKey} // 使用key强制重新加载编辑器以更新自动补全
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
          // 增强自动补全体验
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          tabCompletion: "on",
          wordBasedSuggestions: "currentDocument",
          // 禁用默认的自动补全，启用自定义提示
          suggest: {
            showWords: false,
            showSnippets: false,
            filterGraceful: false,
            snippetsPreventQuickSuggestions: true,
            showStatusBar: true, // 显示状态栏，包含文档信息
            preview: true, // 预览补全项
            previewMode: "prefix", // 预览模式
            selectionMode: "always", // 总是选择第一个补全项
          },
          // 启用悬停提示
          hover: {
            enabled: true,
            delay: 300, // 悬停延迟时间（毫秒）
            sticky: true, // 悬停提示保持显示
            above: false, // 提示显示在光标下方而非上方
          },
          // 参数提示
          parameterHints: {
            enabled: true,
            cycle: true, // 循环显示参数提示
          },
        }}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        onChange={handleChange}
      />
    </div>
  );
};

export default SQLEditor;

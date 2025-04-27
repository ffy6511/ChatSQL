'use client'

import React, { useState, useEffect } from 'react';
import styles from './LLMWindow.module.css';
import { Input, Tag, message, Spin, Button, Popover } from 'antd';
import {
  SendOutlined,
  CheckOutlined,
  TagOutlined,
  BarChartOutlined,
  NumberOutlined,
  RobotOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useLLMContext } from '@/contexts/LLMContext';
import LLMResultView from '@/lib/LLMResultView';
import { useSimpleStorage } from '@/hooks/useRecords';
import { DifyResponse } from '@/types/dify';
import {
  Box,
  Paper,
  Typography,
  Stack
} from '@mui/material';
import { useEditorContext } from '@/contexts/EditorContext';
import ShinyText from '@/components/utils/ShinyText';
import { useTagsManager } from '@/hooks/useTagsManager';

const initialTags = [
  { label: '算法', color: 'magenta' },
  { label: '数据结构', color: 'geekblue' },
  { label: '数学', color: 'cyan' },
];

const difficultyOptions = [
  { label: '简单', value: 'simple' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
];


const LLMWindow: React.FC = () => {
  const { setShowLLMWindow, setLLMResult, setCurrentProblemId } = useLLMContext();
  const { clearEditor } = useEditorContext();
  const { tags, addTag, deleteTag } = useTagsManager();

  const [checkedTags, setCheckedTags] = useState<string[]>([]);
  const [declare, setDeclare] = useState('');
  const [difficulty, setDifficulty] = useState('simple');
  const [problemCnt, setProblemCnt] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const {storeProblem, isSaving} = useSimpleStorage();

  // 弹出框状态
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);
  const [difficultyPopoverOpen, setDifficultyPopoverOpen] = useState(false);
  const [countPopoverOpen, setCountPopoverOpen] = useState(false);

  // 添加新状态用于管理新标签输入
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    if (result?.data?.outputs) {
      console.log('LLM Response received:', {
        tableStructure: result.data.outputs.tableStructure,
        tuples: result.data.outputs.tuples
      });
    }
  }, [result]);

  const handleTagCheck = (tag: string, checked: boolean) => {
    setCheckedTags(checked
      ? [...checkedTags, tag]
      : checkedTags.filter(t => t !== tag)
    );
  };

  // 发送请求
  const handleSubmit = async () => {
    if (!declare.trim()) {
      message.warning('请填写题目描述');
      return;
    }
    setLoading(true);

    const requestBody = {
      inputs:{
        tags: checkedTags.join(','),
        declare,
        difficulty,
        count: problemCnt,
      },
      response_mode: "blocking",
      user: "abc-123",
    };

    try {
      const response = await fetch('https://api.dify.ai/v1/workflows/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('请求失败！');

      const data = (await response.json()) as DifyResponse;
      setResult(data);
      message.success('LLM返回成功，请确认。');
    } catch (err) {
      message.error('提交失败，请重试！');
    } finally {
      setLoading(false);
    }
  };

  // 确认按钮
  const handleConfirm = async () => {
    console.log('Confirming...', result);
    if (!result?.data?.outputs) {
      message.error('没有有效的结果数据');
      return;
    }

    try {
      // 直接保存整个outputs对象到IndexedDB
      const savedId = await storeProblem(result.data.outputs);

      setCurrentProblemId(savedId);
      clearEditor();

      // 更新上下文并关闭窗口
      console.log('Setting context...', { result, savedId });
      setLLMResult(result);
      setShowLLMWindow(false);
      console.log('Context updated');
    } catch (error) {
      console.error('Error:', error);
      console.error('保存问题失败:', error);
      message.error('保存失败');
    }
  };

  // 标签选择弹出框内容
  const tagsPopoverContent = (
    <div style={{ padding: '16px', width: 300 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        选择标签
      </Typography>
      
      <div className={styles.tagContainer}>
        {Object.entries(tags).map(([tag, color]) => (
          <Tag
            key={tag}
            className={`${styles.tag} ${checkedTags.includes(tag) ? styles.checked : ''}`}
            closable={false}
            style={checkedTags.includes(tag) ? { backgroundColor: color, borderColor: color } : {}}
            onClick={() => handleTagCheck(tag, !checkedTags.includes(tag))}
          >
            {tag}
            <CloseOutlined
              className={styles.closeBtn}
              onClick={(e) => {
                e.stopPropagation();
                deleteTag(tag);
              }}
            />
          </Tag>
        ))}
      </div>

      <div className={styles.tagInputContainer}>
        <Input
          className={styles.tagInput}
          placeholder="输入新标签"
          value={newTagInput}
          onChange={e => setNewTagInput(e.target.value)}
          onPressEnter={() => {
            if (newTagInput.trim()) {
              addTag(newTagInput.trim());
              setNewTagInput('');
            }
          }}
        />
        <Button 
          type="primary"
          onClick={() => {
            if (newTagInput.trim()) {
              addTag(newTagInput.trim());
              setNewTagInput('');
            }
          }}
          disabled={!newTagInput.trim()}
        >
          添加
        </Button>
      </div>
    </div>
  );

  // 难度选择弹出框内容
  const difficultyPopoverContent = (
    <div style={{ padding: '16px', width: 200 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>选择难度</Typography>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {difficultyOptions.map(opt => (
          <Button
            key={opt.value}
            onClick={() => {
              setDifficulty(opt.value);
              setDifficultyPopoverOpen(false);
            }}
            type={difficulty === opt.value ? 'primary' : 'default'}
            block
            size="middle"
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );

  // 数量选择弹出框内容
  const countPopoverContent = (
    <div style={{ padding: '16px', width: 250 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>选择题目数量</Typography>
      <div style={{ padding: '0 16px' }}>
        <Input
          type="number"
          value={problemCnt}
          onChange={e => setProblemCnt(Number(e.target.value))}
          min={1}
          max={10}
          style={{ width: '100%', marginBottom: '12px', height: '36px', borderRadius: '8px' }}
        />
        <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.45)', display: 'block', textAlign: 'center' }}>
          范围: 1-10 题
        </Typography>
      </div>
    </div>
  );

  return (
    <div className={styles.container} id="llm-window-container">
      <div className={`${styles.windowContainer} ${result ? styles.withResult : ''}`}>
        <div className={`${styles.contentWrapper} ${result ? styles.withResultContent : ''}`}>
          {/* 顶部标题区域 */}
          <div className={styles.headerArea}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                textAlign: 'center',
                flex: 1
              }}
            >
              {loading ? (
                <ShinyText text="正在生成有趣的应用..." speed={3} />
              ) : (
                "今天希望练习什么内容？"
              )}
            </Typography>
          </div>


          {/* 结果展示区域 - 有结果时显示 */}
          {result && (
            <div className={styles.resultArea}>
              <div className={styles.chatBubble}>
                <div className={styles.resultHeader}>
                  <Typography variant="h6">
                    <RobotOutlined style={{ marginRight: '8px' }} /> 这个问题如何?
                  </Typography>

                  <Button
                    type="primary"
                    size="small"
                    onClick={handleConfirm}
                    loading={isSaving}
                    icon={<CheckOutlined />}
                    style={{ backgroundColor: '#52c41a' }}
                  >
                    确认并保存
                  </Button>
                </div>

                {result?.data?.outputs && (
                  <LLMResultView outputs={result.data.outputs} />
                )}
              </div>
            </div>
          )}

          {/* 输入区域 - 始终显示 */}
          <div className={`${styles.inputArea} ${result ? styles.inputAreaWithResult : ''}`}>
          <div className={styles.buttonGroup}>
            {/* 快捷按钮区域 */}
            <Popover
              open={tagsPopoverOpen}
              onOpenChange={setTagsPopoverOpen}
              content={tagsPopoverContent}
              trigger="click"
              placement="bottom"
              destroyTooltipOnHide={false}
            >
              <Button
                type="default"
                size="small"
                icon={<TagOutlined />}
              >
                {checkedTags.length > 0 ? `${checkedTags.length}个标签` : '标签'}
              </Button>
            </Popover>

            <Popover
              open={difficultyPopoverOpen}
              onOpenChange={setDifficultyPopoverOpen}
              content={difficultyPopoverContent}
              trigger="click"
              placement="bottom"
              destroyTooltipOnHide={false}
            >
              <Button
                type="default"
                size="small"
                icon={<BarChartOutlined />}
              >
                {difficultyOptions.find(opt => opt.value === difficulty)?.label || '难度'}
              </Button>
            </Popover>

            <Popover
              open={countPopoverOpen}
              onOpenChange={setCountPopoverOpen}
              content={countPopoverContent}
              trigger="click"
              placement="bottom"
              destroyTooltipOnHide={false}
            >
              <Button
                type="default"
                size="small"
                icon={<NumberOutlined />}
              >
                {problemCnt}题
              </Button>
            </Popover>
          </div>

          {/* 输入框区域 */}
          <div className={styles.textAreaWrapper}>
            <Input.TextArea
              placeholder="请输入你想要训练的内容描述..."
              value={declare}
              onChange={e => setDeclare(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 6 }}
              className={styles.textAreaContainer}
            />

            <div className={styles.actionButtonContainer}>
              <Button
                type="primary"
                loading={loading}
                onClick={handleSubmit}
                icon={<SendOutlined />}
                shape="circle"
                size="large"
                style={{ backgroundColor: '#1677ff', fontSize: '18px' }}
              />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LLMWindow;


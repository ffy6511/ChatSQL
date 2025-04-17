'use client'

import React, { useState } from 'react';
import styles from './LLMWindow.module.css';
import { Input, Tag, Button, message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Slider, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useLLMContext } from '@/contexts/LLMContext'; // 假设你的Context路径

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

const tagColors = [
  'magenta', 'red', 'volcano', 'orange', 'gold',
  'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'
];

function getRandomColor() {
  return tagColors[Math.floor(Math.random() * tagColors.length)];
}

const LLMWindow: React.FC = () => {
  const { setShowLLMWindow, setLLMResult } = useLLMContext();

  const [tags, setTags] = useState(initialTags);
  const [checkedTags, setCheckedTags] = useState<string[]>([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [declare, setDeclare] = useState('');
  const [difficulty, setDifficulty] = useState('simple');
  const [problemCnt, setProblemCnt] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // 标签添加
  const handleTagInputConfirm = () => {
    if (inputValue && !tags.find(tag => tag.label === inputValue)) {
      setTags([...tags, { label: inputValue, color: getRandomColor() }]);
    }
    setInputVisible(false);
    setInputValue('');
  };

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
      const data = await response.json();
      setResult(data);
      message.success('LLM返回成功，请确认。');
    } catch (err) {
      message.error('提交失败，请重试！');
    } finally {
      setLoading(false);
    }
  };

  // 确认按钮
  const handleConfirm = () => {
    setLLMResult(result);
    setShowLLMWindow(false);
  };

  return (
    <div className={styles.container}>
      {!result && (
        <>
          {/* 标签选择 */}
          <div className={styles.section}>
            <span className={styles.label}>标签：</span>
            {tags.map(tag => (
              <CheckableTag
                key={tag.label}
                checked={checkedTags.includes(tag.label)}
                color={tag.color}
                onChange={checked => handleTagCheck(tag.label, checked)}
              >
                {tag.label}
              </CheckableTag>
            ))}
            {inputVisible ? (
              <Input
                size="small"
                style={{ width: 100, marginLeft: 8 }}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onBlur={handleTagInputConfirm}
                onPressEnter={handleTagInputConfirm}
                autoFocus
              />
            ) : (
              <Tag
                onClick={() => setInputVisible(true)}
                style={{
                  background: '#fff',
                  borderStyle: 'dashed',
                  marginLeft: 8,
                  cursor: 'pointer'
                }}
              >
                <PlusOutlined /> 新标签
              </Tag>
            )}
          </div>

          {/* 难度选择 */}
          <div className={styles.section}>
            <span className={styles.label}>难度：</span>
            <ToggleButtonGroup
              value={difficulty}
              exclusive
              onChange={(_, value) => value && setDifficulty(value)}
              size="small"
            >
              {difficultyOptions.map(opt => (
                <ToggleButton key={opt.value} value={opt.value}>
                  {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>

          {/* 题目数量 */}
          <div className={styles.section}>
          <span className={styles.label}>题目数量：</span>
            <Slider
              value={problemCnt}
              onChange={(_, value) => setProblemCnt(Number(value))}
              min={1}
              max={10}
              step={1}
              valueLabelDisplay="auto"
              style={{ width: 200 }}
            />
            <span style={{ marginLeft: 16 }}>{problemCnt} 道</span>
          </div>

          {/* 描述输入 */}
          <div className={styles.section}>
            <span className={styles.label}>描述：</span>
            <Input.TextArea
              rows={4}
              value={declare}
              onChange={e => setDeclare(e.target.value)}
              placeholder="请输入题目描述..."
            />
          </div>

          {/* 提交按钮 */}
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              loading={loading}
              onClick={handleSubmit}
            >
              提交
            </Button>
          </div>
        </>
      )}

      {/* LLM返回结果展示和确认 */}
      {result && (
        <>
          <div className={styles.section}>
            <span className={styles.label}>LLM返回结果：</span>
            <div className={styles.resultBox}>
              {loading ? <Spin /> : (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              onClick={handleConfirm}
            >
              确认
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// antd CheckableTag 增强：支持颜色
const CheckableTag = (props: any) => {
  const { color, checked, children, ...rest } = props;
  return (
    <Tag.CheckableTag
      checked={checked}
      style={{
        borderColor: color,
        color: checked ? '#fff' : color,
        background: checked ? color : '#fff',
        marginBottom: 8,
      }}
      {...rest}
    >
      {children}
    </Tag.CheckableTag>
  );
};

export default LLMWindow;


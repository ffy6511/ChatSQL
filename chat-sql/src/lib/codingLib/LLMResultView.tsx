'use client';
// TODO: 修改可视化, 考虑hint和期望结果的展示

import React from 'react';
import { Card, Tag, List, Typography, Divider, Table } from 'antd';
import { ProblemOutput, TableStructure, TableTuple } from '@/types/CodingTypes/dify';
import styles from './LLMResultView.module.css';

const { Title, Paragraph, Text } = Typography;

interface LLMResultViewProps {
  outputs: ProblemOutput;
}

const colorMap = [
  'magenta', 'red', 'volcano', 'orange', 'gold',
  'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'
];

function getTagColor(idx: number) {
  return colorMap[idx % colorMap.length];
}

const renderTable = (table: TableStructure) => (
  <div className={styles.tableContainer}>
    <strong className={styles.tableTitle}>{table.tableName}</strong>
    <List
      size="small"
    //   header={<div>字段结构</div>}
      dataSource={table.columns}
      renderItem={col => (
        <List.Item>
          <Text code>{col.name}</Text>
          {col.isPrimary && <Tag color="gold" style={{ marginLeft: 'auto' }}>主键</Tag>}
          <Text type="secondary" style={{ marginLeft: 8 }}>{col.type}</Text>
        </List.Item>
      )}
      className={styles.tableList}
    />
  </div>
);

const renderTupleTable = (table: TableTuple) => {
    // 1. 如果没有数据，直接返回
    if (!table.tupleData || table.tupleData.length === 0) return null;

    // 2. 生成 columns
    const columns = Object.keys(table.tupleData[0]).map(key => ({
      title: <Text code>{key}</Text>,
      dataIndex: key,
      key,
      render: (value: any) => <span>{String(value)}</span>,
    }));

    return (
      <div className={styles.tableContainer}>
        <strong className={styles.tableTitle}>{table.tableName}</strong>
        <Table
          columns={columns}
          dataSource={table.tupleData.map((row, idx) => ({ ...row, key: idx }))}
          pagination={false}
          size="small"
          className={styles.tableList}
          bordered
        />
      </div>
    );
  };

const LLMResultView: React.FC<LLMResultViewProps> = ({ outputs }) => {
  return (
    <div className={`${styles.resultCard} ${styles.tableStyles}`}>
      {/* 描述 */}
      <Typography.Title level={4} style={{ color: 'var(--primary-text)' }}>题目描述</Typography.Title>
      <Typography.Paragraph style={{ color: 'var(--secondary-text)' }}>{outputs.description}</Typography.Paragraph>

      {/* 题目要求 */}
      <Typography.Title level={5} className={styles.titleSection} style={{ color: 'var(--primary-text)' }}>题目要求</Typography.Title>
      <List
        size="small"
        dataSource={outputs.problem}
        renderItem={item => (
          <List.Item style={{ 
            color: 'var(--secondary-text)',
            backgroundColor: 'var(--button-hover)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '8px'
          }}>
            {item}
          </List.Item>
        )}
        className={styles.listSection}
      />

      {/* 标签 */}
      <Typography.Title level={5} style={{ color: 'var(--primary-text)' }}>标签</Typography.Title>
      <div className={styles.tagContainer}>
        {outputs.tags.map((tag, idx) =>
          <Tag color={getTagColor(idx)} key={tag} style={{ 
            margin: '4px',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '14px'
          }}>{tag}</Tag>
        )}
      </div>

      <Divider style={{ borderColor: 'var(--divider-color)' }} />

      {/* 表结构 */}
      {outputs.tableStructure && (
        <>
          <Typography.Title level={5} style={{ color: 'var(--primary-text)' }}>表结构</Typography.Title>
          {outputs.tableStructure.map(table => renderTable(table))}
        </>
      )}

      {/* 样例数据 */}
      {outputs.tuples && (
        <>
          <Title level={5} style={{ color: 'var(--primary-text)' }}>样例数据</Title>
          {outputs.tuples.map(table => renderTupleTable(table))}
        </>
      )}

      {/* 期望结果 */}
      {outputs.expected_result && (
        <>
          <Title level={5} style={{ color: 'var(--primary-text)' }}>期望结果</Title>
          {outputs.expected_result.map(table => renderTupleTable(table))}
        </>
      )}

      {/* 提示 */}
      {outputs.hint && (
        <>
          <Divider style={{ borderColor: 'var(--divider-color)' }} />
          <Title level={5} style={{ color: 'var(--primary-text)' }}>提示</Title>
          <Paragraph style={{ color: 'var(--secondary-text)' }}>{outputs.hint}</Paragraph>
        </>
      )}
    </div>
  );
};

export default LLMResultView;

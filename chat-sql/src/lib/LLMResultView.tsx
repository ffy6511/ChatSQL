'use client';
// TODO: 修改可视化, 考虑hint和期望结果的展示

import React from 'react';
import { Card, Tag, List, Typography, Divider, Table } from 'antd';
import { ProblemOutput, TableStructure, TableTuple } from '@/types/dify';

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
  <div style={{ marginBottom: 16 }}>
    <strong style={{ display: 'block',textAlign: 'center' }}>{table.tableName}</strong>
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
      style={{ marginTop: 8 }}
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
      <div style={{ marginBottom: 16 }}>
        <strong style={{ display: 'block',textAlign: 'center' }}>{table.tableName}</strong>
        <Table
          columns={columns}
          dataSource={table.tupleData.map((row, idx) => ({ ...row, key: idx }))}
          pagination={false}
          size="small"
          style={{ marginTop: 8 }}
          bordered
        />
      </div>
    );
  };

const LLMResultView: React.FC<LLMResultViewProps> = ({ outputs }) => {
  return (
    <Card bordered style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* 描述 */}
      <Title level={4}>题目描述</Title>
      <Paragraph>{outputs.description}</Paragraph>

      {/* 题目要求 */}
      <Title level={5} style={{ marginTop: 24 }}>题目要求</Title>
      <List
        size="small"
        dataSource={outputs.problem}
        renderItem={item => <List.Item>{item}</List.Item>}
        style={{ marginBottom: 16 }}
      />

      {/* 标签 */}
      <Title level={5}>标签</Title>
      <div style={{ marginBottom: 16 }}>
        {outputs.tags.map((tag, idx) =>
          <Tag color={getTagColor(idx)} key={tag}>{tag}</Tag>
        )}
      </div>

      <Divider />

      {/* 表结构 */}
      {outputs.tableStructure && (
        <>
          <Title level={5}>表结构</Title>
          {outputs.tableStructure.map(table => renderTable(table))}
        </>
      )}

      {/* 样例数据 */}
      {outputs.tuples && (
        <>
          <Title level={5}>样例数据</Title>
          {outputs.tuples.map(table => renderTupleTable(table))}
        </>
      )}

      {/* 期望结果 */}
      {outputs.expected_result && (
        <>
          <Title level={5}>期望结果</Title>
          {outputs.expected_result.map(table => renderTupleTable(table))}
        </>
      )}

      {/* 提示 */}
      {outputs.hint && (
        <>
          <Divider />
          <Title level={5}>提示</Title>
          <Paragraph>{outputs.hint}</Paragraph>
        </>
      )}
    </Card>
  );
};

export default LLMResultView;

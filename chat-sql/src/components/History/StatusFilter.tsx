'use client'

import React from 'react';
import { Select, Space, Typography } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { ProgressStatus } from '@/utils/progressUtils';

const { Text } = Typography;

interface StatusFilterProps {
  value: ProgressStatus | 'ALL';
  onChange: (value: ProgressStatus | 'ALL') => void;
  tutorialCount?: number;
  className?: string;
}

/**
 * 状态筛选器组件
 * 允许用户按完成状态过滤教程记录
 */
const StatusFilter: React.FC<StatusFilterProps> = ({
  value,
  onChange,
  tutorialCount = 0,
  className
}) => {
  const filterOptions = [
    {
      value: 'ALL',
      label: '全部',
      icon: '📚'
    },
    {
      value: ProgressStatus.NOT_STARTED,
      label: '未开始',
      icon: '⚪'
    },
    {
      value: ProgressStatus.IN_PROGRESS,
      label: '进行中',
      icon: '🔵'
    },
    {
      value: ProgressStatus.COMPLETED,
      label: '已完成',
      icon: '✅'
    }
  ];

  return (
    <div className={className}>
      <Space align="center" size="small">
        <FilterOutlined 
          style={{ 
            color: 'var(--secondary-text)',
            fontSize: '14px'
          }} 
        />
        <Text 
          style={{ 
            color: 'var(--secondary-text)',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          筛选:
        </Text>
        <Select
          value={value}
          onChange={onChange}
          size="small"
          style={{ 
            minWidth: 100,
            fontSize: '12px'
          }}
          dropdownStyle={{
            fontSize: '12px'
          }}
          options={filterOptions.map(option => ({
            value: option.value,
            label: (
              <Space size="small">
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </Space>
            )
          }))}
        />
        {tutorialCount > 0 && (
          <Text 
            style={{ 
              color: 'var(--tertiary-text)',
              fontSize: '11px'
            }}
          >
            ({tutorialCount} 个教程)
          </Text>
        )}
      </Space>
    </div>
  );
};

export default StatusFilter;

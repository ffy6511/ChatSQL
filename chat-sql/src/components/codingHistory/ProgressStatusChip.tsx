'use client'

import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { LLMProblem } from '@/services/codingStorage';
import { calculateProgressStatus, getProgressPercentage, isTutorialRecord } from '@/utils/progressUtils';

interface ProgressStatusChipProps {
  record: LLMProblem;
  size?: 'small' | 'medium';
  showTooltip?: boolean;
}

/**
 * 进度状态显示芯片组件
 * 根据记录的进度信息显示相应的状态标签
 */
const ProgressStatusChip: React.FC<ProgressStatusChipProps> = ({
  record,
  size = 'small',
  showTooltip = true
}) => {
  // 如果不是教程记录，显示传统的标签
  if (!isTutorialRecord(record)) {
    return (
      <>
        {record.data?.isBuiltIn && (
          <Chip
            label={`#${record.data.order}`}
            size={size}
            variant="outlined"
            sx={{
              fontSize: '11px',
              height: '20px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--secondary-text)',
              borderColor: 'var(--secondary-text)',
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          />
        )}
        {record.data?.category && (
          <Chip
            label={record.data.category}
            size={size}
            variant="outlined"
            sx={{
              fontSize: '11px',
              height: '20px',
              color: 'var(--secondary-text)',
              borderColor: 'var(--secondary-text)',
              backgroundColor: 'transparent',
              marginLeft: '4px',
              '&:hover': {
                backgroundColor: 'rgba(0, 188, 212, 0.04)'
              }
            }}
          />
        )}
      </>
    );
  }

  // 教程记录显示进度状态
  const statusInfo = calculateProgressStatus(record);
  const percentage = getProgressPercentage(record);

  // 根据状态设置颜色
  const getChipColor = () => {
    switch (statusInfo.status) {
      case 'NOT_STARTED':
        return {
          color: 'var(--secondary-text)',
          backgroundColor: 'transparent',
          borderColor: 'var(--secondary-text)'
        };
      case 'IN_PROGRESS':
        return {
          color: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.08)',
          borderColor: '#1976d2'
        };
      case 'COMPLETED':
        return {
          color: '#2e7d32',
          backgroundColor: 'rgba(46, 125, 50, 0.08)',
          borderColor: '#2e7d32'
        };
      default:
        return {
          color: 'var(--secondary-text)',
          backgroundColor: 'transparent',
          borderColor: 'var(--secondary-text)'
        };
    }
  };

  const chipStyle = getChipColor();

  const chipElement = (
    <Chip
      label={statusInfo.label}
      size={size}
      variant="outlined"
      sx={{
        fontSize: '11px',
        height: '20px',
        fontFamily: 'var(--font-mono)',
        ...chipStyle,
        '&:hover': {
          backgroundColor: chipStyle.backgroundColor === 'transparent' 
            ? 'rgba(0, 0, 0, 0.04)' 
            : chipStyle.backgroundColor
        }
      }}
    />
  );

  // 如果启用了工具提示，包装在 Tooltip 中
  if (showTooltip && statusInfo.description) {
    return (
      <Tooltip 
        title={`${statusInfo.description} (${percentage}%)`}
        placement="top"
        arrow
      >
        {chipElement}
      </Tooltip>
    );
  }

  return chipElement;
};

export default ProgressStatusChip;

'use client';

import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { AccountTree as AccountTreeIcon, Add as AddIcon } from '@mui/icons-material';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  className?: string;
}

/**
 * ER图空状态组件 - 当没有实体和关系时显示的引导界面
 */
const EmptyState: React.FC<EmptyStateProps> = ({ className }) => {
  return (
    <Box className={`${styles.emptyStateContainer} ${className || ''}`}>
      <Stack 
        spacing={3} 
        alignItems="center" 
        justifyContent="center"
        className={styles.emptyStateContent}
      >
        {/* 主图标 */}
        <Box className={styles.iconContainer}>
          <AccountTreeIcon className={styles.mainIcon} />
          <AddIcon className={styles.addIcon} />
        </Box>

        {/* 主标题 */}
        <Typography 
          variant="h5" 
          component="h2" 
          className={styles.mainTitle}
          sx={{ 
            color: 'var(--primary-text)',
            fontWeight: 600,
            textAlign: 'center'
          }}
        >
          开始创建您的ER图
        </Typography>

        {/* 副标题和引导文字 */}
        <Stack spacing={1} alignItems="center">
          <Typography 
            variant="body1" 
            className={styles.subtitle}
            sx={{ 
              color: 'var(--secondary-text)',
              textAlign: 'center',
              lineHeight: 1.6
            }}
          >
            新建图表-选中“组件库”-拖拽元素到画布开始建模
          </Typography>
          
          <Typography 
            variant="body2" 
            className={styles.description}
            sx={{ 
              color: 'var(--tertiary-text)',
              textAlign: 'center',
              lineHeight: 1.5
            }}
          >
            您可以添加强实体集、弱实体集和关系来构建完整的ER图
          </Typography>
        </Stack>

        {/* 操作提示 */}
        <Box className={styles.hintContainer}>
          <Typography 
            variant="caption" 
            className={styles.hint}
            sx={{ 
              color: 'var(--tertiary-text)',
              textAlign: 'center',
              fontStyle: 'italic'
            }}
          >
            💡 提示：双击节点可以重命名，拖拽连接点可以创建关系
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default EmptyState;

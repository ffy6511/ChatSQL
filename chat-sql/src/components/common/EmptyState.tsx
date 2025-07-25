'use client';

import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { AccountTree as AccountTreeIcon, Add as AddIcon, Subtitles } from '@mui/icons-material';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
    mainIcon: React.ReactElement;
    secondaryIcon?: React.ReactElement;
    title: string;
    subTitle: string;
    // 可选的描述和提示
    description?: string;
    hint?: string;
    className?: string;
}

/**
 * ER图空状态组件 - 当没有实体和关系时显示的引导界面
 */
const EmptyState: React.FC<EmptyStateProps> = ({ 
    mainIcon,
    secondaryIcon,
    title,
    subTitle,
    description,
    hint,
    className }) => {
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
          {React.cloneElement(mainIcon as React.ReactElement<any>, {className: styles.mainIcon})}
          {secondaryIcon && React.cloneElement(secondaryIcon as React.ReactElement<any>, {className: styles.addIcon})}
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
          {title}
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
            {subTitle}
          </Typography>
          
          {description &&
            <Typography 
                variant="body2" 
                className={styles.description}
                sx={{ 
                color: 'var(--tertiary-text)',
                textAlign: 'center',
                lineHeight: 1.5
                }}
            >
               {description}
            </Typography>
          }
         
        </Stack>

        {/* 操作提示 */}
        {hint &&
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
                {hint}
                </Typography>
            </Box>
        }
      </Stack>
    </Box>
  );
};

export default EmptyState;

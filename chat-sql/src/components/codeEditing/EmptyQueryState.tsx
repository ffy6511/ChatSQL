'use client'

import React from 'react';
import { Paper, Typography } from '@mui/material';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import styles from './EmptyQueryState.module.css';

/**
 * SQL查询区域的空状态组件
 * 当没有查询结果时显示
 */
const EmptyQueryState: React.FC = () => {
  return (
    <Paper
      elevation={0}
      className={styles.container}
    >
      <QueryStatsIcon className={styles.icon} />
      <Typography
        variant="h6"
        className={styles.title}
      >
        执行 SQL 查询以查看结果
      </Typography>
      <Typography
        variant="body2"
        className={styles.subtitle}
      >
        在右侧编辑器中编写 SQL 语句并点击"执行查询"按钮
      </Typography>
    </Paper>
  );
};

export default EmptyQueryState;

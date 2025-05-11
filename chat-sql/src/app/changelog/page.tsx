'use client'

import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import styles from './changelog.module.css';
import Chip from '@mui/material/Chip';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import { Box, Divider, Stack } from '@mui/material';

interface Commit {
  hash: string;
  date: string;
  message: string;
  author: string;
  description: string;
}

interface CommitsByDate {
  [date: string]: Commit[];
}

interface ProjectStats {
  totalCommits: number;
  contributors: string[];
  lastUpdate: string;
  activeBranches: number;
}

interface GitData {
  history: Commit[];
  commitsByDate: CommitsByDate;
  stats: ProjectStats;
}

// 新增：按年份分组的日期
interface GroupedDates {
  [year: string]: string[];
}

const getCommitColor = (message: string): "success" | "error" | "secondary" | "grey" => {
  if (message.startsWith('feat') || message.startsWith('Feat')) return "success";
  if (message.startsWith('fix') || message.startsWith('Fix')) return "error";
  if (message.startsWith('style') || message.startsWith('Style')) return "secondary";
  return "grey";
};

const getBackgroundColor = (message: string): string => {
  const type = getCommitColor(message);
  switch (type) {
    case 'success': 
      return 'rgba(82, 196, 26, 0.3)';  
    case 'error':
      return 'rgba(255, 77, 79, 0.3)';  
    case 'secondary':
      return 'rgba(114, 46, 209, 0.3)'; 
    default:
      return 'rgba(140, 140, 140, 0.3)'; 
  }
};

const TimelineCard = styled(Card)({
  background: 'transparent !important',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
});

const CommitCard = styled(Card)({
  background: 'rgba(255, 255, 255, 0.45) !important',
  backdropFilter: 'blur(8px)',
  border: 'none',
  fontFamily: 'Maple Mono !important',
  borderRadius: '12px',
  transition: 'transform 0.2s ease-in-out',
  padding: '8px',
  marginBottom: '16px',
  '& .MuiTypography-root': {
    fontFamily: 'Maple Mono !important'
  },
  '&:hover': {
    transform: 'translateY(-2px)',
  }
});

// 添加详细信息卡片样式
const DescriptionCard = styled(Card)({
  background: 'rgba(0, 0, 0, 0.03) !important',
  border: 'none',
  borderRadius: '8px',
  marginTop: '8px',
  padding: '0',
  '& .MuiCardContent-root': {
    padding: '8px 12px',
  }
});

const TimelineDotStyled = styled(TimelineDot)({
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.1)',
    transition: 'transform 0.2s ease-in-out',
  },
});

// 年份标题样式
const YearTitle = styled(Typography)({
  fontWeight: 'bold',
  fontSize: '1.8rem',
  marginTop: '24px',
  marginBottom: '16px',
  color: 'rgba(0, 0, 0, 0.75)',
  borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
  paddingBottom: '8px',
});

const parseCommitMessage = (message: string) => {
  const parts = message.split(':');
  if (parts.length < 2) {
    return {
      type: message,
      details: ''
    };
  }
  return {
    type: parts[0],
    details: parts.slice(1).join(':').trim()
  };
};

// 格式化日期函数
const formatDate = (dateString: string): { year: string, monthDay: string } => {
  const date = new Date(dateString);
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return {
    year,
    monthDay: `${month}-${day}`
  };
};

const ChangelogPage: React.FC = () => {
  const [gitData, setGitData] = useState<GitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/git_info.json')
      .then(res => res.json())
      .then(data => {
        setGitData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch data:', error);
        setLoading(false);
      });
  }, []);

  const handleCommitClick = (hash: string) => {
    const repoUrl = 'https://github.com/ffy6511/chatSQL';
    window.open(`${repoUrl}/commit/${hash}`, '_blank');
  };

  if (loading || !gitData) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  // 获取日期列表并排序（最新的日期在前）
  const dates = Object.keys(gitData.commitsByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // 按年份分组日期
  const groupedDates: GroupedDates = {};
  dates.forEach(date => {
    const { year } = formatDate(date);
    if (!groupedDates[year]) {
      groupedDates[year] = [];
    }
    groupedDates[year].push(date);
  });

  // 获取年份列表并排序（最新的年份在前）
  const years = Object.keys(groupedDates).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div className={styles.container}>
      <div className={styles.parallaxBackground} />
      <div className={`${styles.content} content-container`}>
        <TimelineCard sx={{ mt: 3, p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{fontSize:'1.7rem', textAlign:'center', fontWeight:'bold', mb: 4}}>
            <ClockCircleOutlined /> 更新日志
          </Typography>
          
          {years.map(year => (
            <React.Fragment key={year}>
              <YearTitle>{year}</YearTitle>
              
              <Timeline position="right">
                {groupedDates[year].map((date, dateIndex) => {
                  const { monthDay } = formatDate(date);
                  return (
                    <TimelineItem key={date}>
                      <TimelineOppositeContent sx={{ flex: 0.1, minWidth: '80px' }}>
                        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                          {monthDay}
                        </Typography>
                      </TimelineOppositeContent>
                      
                      <TimelineSeparator>
                        <TimelineDotStyled color="primary" />
                        {dateIndex !== groupedDates[year].length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      
                      <TimelineContent sx={{ py: '12px', px: 2 }}>
                        <Stack spacing={2}>
                          {gitData.commitsByDate[date].map((commit, commitIndex) => {
                            const { type, details } = parseCommitMessage(commit.message);
                            return (
                              <Tooltip 
                                key={commit.hash}
                                title="点击查看详情" 
                                placement="left"
                                arrow
                              >
                                <CommitCard 
                                  variant="outlined" 
                                  onClick={() => handleCommitClick(commit.hash)}
                                  sx={{ cursor: 'pointer' }}
                                >
                                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Typography 
                                      variant="subtitle2" 
                                      sx={{ 
                                        color: 'rgb(21, 21, 21)',
                                        fontWeight: 600,
                                        mb: 0.5,
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: getBackgroundColor(commit.message),
                                        fontSize: '1.1rem',
                                      }}
                                    >
                                      {type}
                                    </Typography>
                                    
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        color: 'rgba(0, 0, 0, 0.87)',
                                        mb: 1,
                                        fontSize: '1rem',
                                        marginLeft: '8px',
                                      }}
                                    >
                                      {details}
                                    </Typography>
                                    
                                    {/* 如果有详细描述，则显示在单独的卡片中 */}
                                    {commit.description && (
                                      <DescriptionCard>
                                        <CardContent>
                                          <Typography 
                                            variant="body2" 
                                            sx={{ 
                                              color: 'rgba(0, 0, 0, 0.81)',
                                              fontSize: '0.85rem',
                                              whiteSpace: 'pre-line' // 保留换行符
                                            }}
                                          >
                                            {commit.description}
                                          </Typography>
                                        </CardContent>
                                      </DescriptionCard>
                                    )}
                                    
                                    {/* 确保右对齐 */}
                                    <Box 
                                      sx={{ 
                                        display: 'flex', 
                                        gap: 1, 
                                        mt: 1, 
                                        justifyContent: 'flex-end', // 添加右对齐
                                        width: '100%' // 确保Box占据整行宽度
                                      }}
                                    >
                                      <Chip
                                        icon={<PersonIcon sx={{ fontSize: '0.9rem' }} />}
                                        label={commit.author}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          fontFamily: 'Maple Mono',
                                          fontSize: '0.8rem',
                                          background: 'rgba(255, 255, 255, 0.1)',
                                          borderColor: 'rgba(0, 0, 0, 0.1)',
                                        }}
                                      />
                                      <Chip
                                        icon={<CodeIcon sx={{ fontSize: '0.9rem' }} />}
                                        label={commit.hash.substring(0, 7)}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          fontFamily: 'Maple Mono',
                                          fontSize: '0.8rem',
                                          background: 'rgba(255, 255, 255, 0.1)',
                                          borderColor: 'rgba(0, 0, 0, 0.1)',
                                        }}
                                      />
                                    </Box>
                                  </CardContent>
                                </CommitCard>
                              </Tooltip>
                            );
                          })}
                        </Stack>
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </React.Fragment>
          ))}
        </TimelineCard>
      </div>
    </div>
  );
};

export default ChangelogPage;

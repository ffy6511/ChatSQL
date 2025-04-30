'use client'

import React, { useEffect, useState } from 'react';
import { Row, Col, Statistic, Spin } from 'antd';
import { 
  ClockCircleOutlined, 
  CodeOutlined,
  TeamOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import ShareIcon from '@mui/icons-material/Share';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import styles from './changelog.module.css';
import Chip from '@mui/material/Chip';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import {Box} from '@mui/material';


interface Commit {
  hash: string;
  date: string;
  message: string;
  author: string;
}

interface ProjectStats {
  totalCommits: number;
  contributors: string[];
  lastUpdate: string;
  activeBranches: number;
}

const CommitMessage: React.FC<{ message: string }> = ({ message }) => {
  const parts = message.split(':');
  if (parts.length < 2) return <Typography variant="h6">{message}</Typography>;
  
  return (
    <Typography variant="h6" component="div">
      <strong>{parts[0]}:</strong>{parts.slice(1).join(':')}
    </Typography>
  );
};

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

const StatsCard = styled(Card)({
  background: 'rgba(255, 255, 255, 0.35) !important',
  backdropFilter: 'blur(10px)',
  padding: '20px',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
  }
});

const DateText = styled(Typography)({
  fontSize: '1.2rem',
  fontFamily: 'Maple Mono',
  color: 'rgba(0, 0, 0, 0.6)',
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  whiteSpace: 'nowrap',
});

const TimelineCard = styled(Card)({
  background: 'transparent !important',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  // border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
});

const CommitCard = styled(Card)({
  background: 'rgba(255, 255, 255, 0.2) !important',
  backdropFilter: 'blur(8px)',
  border:'none',
  fontFamily: 'Maple Mono !important',
  borderRadius: '12px',
  transition: 'transform 0.2s ease-in-out',
  width: 'fit-content',
  maxWidth: '400px',
  '& .MuiTypography-root': {
    fontFamily: 'Maple Mono !important'
  },
  '&:hover': {
    transform: 'translateY(-2px)',
  }
});

const TimelineDotStyled = styled(TimelineDot)({
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.1)',
    transition: 'transform 0.2s ease-in-out',
  },
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

const ChangelogPage: React.FC = () => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProjectStats>({
    totalCommits: 0,
    contributors: [],
    lastUpdate: '',
    activeBranches: 0
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/git-history').then(res => res.json()),
      fetch('/api/project-stats').then(res => res.json())
    ])
      .then(([commitsData, statsData]) => {
        setCommits(commitsData);
        setStats(statsData);
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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.parallaxBackground} />
      <div className={styles.content}>

        {/* 项目统计 */}
        {/* <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <StatsCard>
              <Statistic 
                title={<Typography variant="subtitle2">总提交次数</Typography>}
                value={stats.totalCommits} 
                prefix={<CodeOutlined />} 
              />
            </StatsCard>
          </Col>
          <Col xs={24} md={6}>
            <StatsCard>
              <Statistic 
                title={<Typography variant="subtitle2">贡献者数量</Typography>}
                value={stats.contributors.length} 
                prefix={<TeamOutlined />} 
              />
            </StatsCard>
          </Col>
          <Col xs={24} md={6}>
            <StatsCard>
              <Statistic 
                title={<Typography variant="subtitle2">活跃分支</Typography>}
                value={stats.activeBranches} 
                prefix={<BranchesOutlined />} 
              />
            </StatsCard>
          </Col>
          <Col xs={24} md={6}>
            <StatsCard>
              <Statistic 
                title={<Typography variant="subtitle2">最后更新</Typography>}
                value={new Date(stats.lastUpdate).toLocaleDateString('zh-CN')} 
                prefix={<ClockCircleOutlined />} 
              />
            </StatsCard>
          </Col>
        </Row> */}

        <TimelineCard sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom sx={{fontSize:'1.7rem', textAlign:'center', fontWeight:'bold'}}>
          < ClockCircleOutlined /> 更新日志
        </Typography>
        <CardContent>
          <Timeline position="alternate">
            {commits.map((commit, index) => (
              <TimelineItem key={commit.hash}>
                <TimelineSeparator>
                  <Tooltip 
                    title="点击查看提交详情" 
                    placement={index % 2 === 0 ? "right" : "left"}
                    arrow
                  >
                    <TimelineDotStyled 
                      color={getCommitColor(commit.message)}
                      onClick={() => handleCommitClick(commit.hash)}
                    />
                  </Tooltip>
                  {index !== commits.length - 1 && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent 
                  sx={{ 
                    position: 'relative', 
                    py: '12px',
                    // 根据索引调整对齐方式
                    display: 'flex',
                    justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end'
                  }}
                >
                  <DateText
                    sx={{
                      [index % 2 === 0 ? 'right' : 'left']: '100%',
                      [index % 2 === 0 ? 'marginRight' : 'marginLeft']: '20px',
                    }}
                  >
                    {new Date(commit.date).toLocaleDateString('zh-CN')}
                  </DateText>
                  
                  <CommitCard variant="outlined">
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {(() => {
                        const { type, details } = parseCommitMessage(commit.message);
                        return (
                          <>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                color: 'rgba(0, 0, 0, 0.85)', // 黑色文字
                                fontWeight: 600,
                                mb: 0.5,
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: getBackgroundColor(commit.message),
                                fontSize: '0.85rem',
                              }}
                            >
                              {type}
                            </Typography>
                            {details && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'rgba(0, 0, 0, 0.45)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mb: 1
                                }}
                              >
                                {/* 限制消息的长度 */}
                                {details.length > 200 ? `${details.substring(0, 200)}...` : details}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
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
                          </>
                        );
                      })()}
                    </CardContent>
                  </CommitCard>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </CardContent>
      </TimelineCard>
      </div>
    </div>
  );
};

export default ChangelogPage;

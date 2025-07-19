/**
 * 动画控制面板组件
 * 提供动画播放、暂停、步骤导航等功能
 */

import React from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Tooltip,
  Paper,
  Stack,
  Chip
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  SkipNext,
  SkipPrevious,
  FastForward,
  FastRewind,
  Replay
} from '@mui/icons-material';
import { AnimationState } from '../../lib/bplus-tree/animationManager';

interface AnimationControlsProps {
  animationState: AnimationState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onJumpToStep: (step: number) => void;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
  onJumpToNextBreakpoint?: () => void;
  onJumpToPreviousBreakpoint?: () => void;
  breakpoints?: number[];
  disabled?: boolean;
}

const AnimationControls: React.FC<AnimationControlsProps> = ({
  animationState,
  onPlay,
  onPause,
  onStop,
  onStepForward,
  onStepBackward,
  onJumpToStep,
  onSpeedChange,
  onReset,
  onJumpToNextBreakpoint,
  onJumpToPreviousBreakpoint,
  breakpoints = [],
  disabled = false
}) => {
  const { currentStep, totalSteps, isPlaying, isPaused, speed } = animationState;

  // 格式化速度显示
  const formatSpeed = (value: number): string => {
    return `${value}ms`;
  };

  // 处理步骤滑块变化
  const handleStepSliderChange = (_event: Event, newValue: number | number[]): void => {
    if (typeof newValue === 'number') {
      onJumpToStep(newValue);
    }
  };

  // 处理速度滑块变化
  const handleSpeedSliderChange = (_event: Event, newValue: number | number[]): void => {
    if (typeof newValue === 'number') {
      onSpeedChange(newValue);
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        backgroundColor: 'var(--background-paper)',
        border: '1px solid var(--border-color)'
      }}
    >
      <Stack spacing={2}>
        {/* 标题和状态 */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="var(--primary-text)">
            动画控制
          </Typography>
          <Chip 
            label={isPlaying ? (isPaused ? '已暂停' : '播放中') : '已停止'}
            color={isPlaying ? (isPaused ? 'warning' : 'success') : 'default'}
            size="small"
          />
        </Box>

        {/* 主控制按钮 */}
        <Box display="flex" justifyContent="center" gap={1}>
          <Tooltip title="重置">
            <IconButton 
              onClick={onReset} 
              disabled={disabled}
              color="primary"
            >
              <Replay />
            </IconButton>
          </Tooltip>

          <Tooltip title="上一个断点">
            <IconButton 
              onClick={onJumpToPreviousBreakpoint} 
              disabled={disabled || !onJumpToPreviousBreakpoint}
              color="primary"
            >
              <FastRewind />
            </IconButton>
          </Tooltip>

          <Tooltip title="上一步">
            <IconButton 
              onClick={onStepBackward} 
              disabled={disabled || currentStep <= 0}
              color="primary"
            >
              <SkipPrevious />
            </IconButton>
          </Tooltip>

          {isPlaying && !isPaused ? (
            <Tooltip title="暂停">
              <IconButton 
                onClick={onPause} 
                disabled={disabled}
                color="primary"
                sx={{ backgroundColor: 'var(--warning-light)' }}
              >
                <Pause />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="播放">
              <IconButton 
                onClick={onPlay} 
                disabled={disabled || currentStep >= totalSteps}
                color="primary"
                sx={{ backgroundColor: 'var(--success-light)' }}
              >
                <PlayArrow />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="停止">
            <IconButton 
              onClick={onStop} 
              disabled={disabled || !isPlaying}
              color="primary"
            >
              <Stop />
            </IconButton>
          </Tooltip>

          <Tooltip title="下一步">
            <IconButton 
              onClick={onStepForward} 
              disabled={disabled || currentStep >= totalSteps}
              color="primary"
            >
              <SkipNext />
            </IconButton>
          </Tooltip>

          <Tooltip title="下一个断点">
            <IconButton 
              onClick={onJumpToNextBreakpoint} 
              disabled={disabled || !onJumpToNextBreakpoint}
              color="primary"
            >
              <FastForward />
            </IconButton>
          </Tooltip>
        </Box>

        {/* 步骤进度 */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="var(--secondary-text)">
              步骤进度
            </Typography>
            <Typography variant="body2" color="var(--secondary-text)">
              {currentStep} / {totalSteps}
            </Typography>
          </Box>
          
          <Slider
            value={currentStep}
            min={0}
            max={totalSteps}
            step={1}
            onChange={handleStepSliderChange}
            disabled={disabled}
            marks={breakpoints.map(bp => ({ value: bp, label: '' }))}
            sx={{
              '& .MuiSlider-mark': {
                backgroundColor: 'var(--warning-main)',
                height: 8,
                width: 2
              },
              '& .MuiSlider-markActive': {
                backgroundColor: 'var(--warning-main)'
              }
            }}
          />
        </Box>

        {/* 动画速度 */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="var(--secondary-text)">
              动画速度
            </Typography>
            <Typography variant="body2" color="var(--secondary-text)">
              {formatSpeed(speed)}
            </Typography>
          </Box>
          
          <Slider
            value={speed}
            min={100}
            max={2000}
            step={100}
            onChange={handleSpeedSliderChange}
            disabled={disabled}
            marks={[
              { value: 100, label: '快' },
              { value: 500, label: '中' },
              { value: 1000, label: '慢' },
              { value: 2000, label: '很慢' }
            ]}
          />
        </Box>

        {/* 断点信息 */}
        {breakpoints.length > 0 && (
          <Box>
            <Typography variant="body2" color="var(--secondary-text)" mb={1}>
              断点位置: {breakpoints.length} 个
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {breakpoints.slice(0, 10).map((bp, index) => (
                <Chip
                  key={bp}
                  label={bp}
                  size="small"
                  variant={currentStep === bp ? 'filled' : 'outlined'}
                  color={currentStep === bp ? 'primary' : 'default'}
                  onClick={() => onJumpToStep(bp)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
              {breakpoints.length > 10 && (
                <Chip
                  label={`+${breakpoints.length - 10}`}
                  size="small"
                  variant="outlined"
                  color="default"
                />
              )}
            </Box>
          </Box>
        )}

        {/* 帮助信息 */}
        <Box>
          <Typography variant="caption" color="var(--secondary-text)">
            💡 提示：使用断点功能可以快速跳转到关键操作步骤
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export default AnimationControls;

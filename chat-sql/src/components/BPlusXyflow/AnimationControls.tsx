/**
 * 动画控制面板组件
 * 提供动画播放、暂停、步骤导航等功能
 */

import React from "react";
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Tooltip,
  Paper,
  Stack,
  Chip,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  Stop,
  SkipNext,
  SkipPrevious,
  FastForward,
  FastRewind,
  Replay,
} from "@mui/icons-material";
import { AnimationState } from "../../lib/bplusLib/animationManager";

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
  disabled = false,
}) => {
  const { currentStep, totalSteps, isPlaying, isPaused, speed } =
    animationState;

  // 格式化速度显示
  const formatSpeed = (value: number): string => {
    return `${value}ms`;
  };

  // 处理步骤滑块变化
  const handleStepSliderChange = (
    _event: Event,
    newValue: number | number[],
  ): void => {
    if (typeof newValue === "number") {
      onJumpToStep(newValue);
    }
  };

  // 处理速度滑块变化
  const handleSpeedSliderChange = (
    _event: Event,
    newValue: number | number[],
  ): void => {
    if (typeof newValue === "number") {
      onSpeedChange(newValue);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        backgroundColor: "var(--background-paper)",
        border: "1px solid var(--border-color)",
      }}
    >
      <Stack spacing={2}>
        {/* 动画速度 */}
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
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
              { value: 100, label: "快" },
              { value: 500, label: "中" },
              { value: 1000, label: "慢" },
              { value: 2000, label: "很慢" },
            ]}
            sx={{
              color: "var(--secondary-text)", // 控制滑块轨道、滑块本体颜色
              "& .MuiSlider-markLabel": {
                color: "var(--primary-text)", // 控制 mark 的文字颜色
              },
              "& .MuiSlider-mark": {
                backgroundColor: "var(--secondary-text)", // 控制小圆点的颜色（可选）
              },
            }}
          />
        </Box>

        {/* 断点信息 */}
        {/* {breakpoints.length > 0 && (
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
        )} */}

        {/* 帮助信息 */}
        <Box>
          <Typography variant="caption" color="var(--secondary-text)">
            💡 ：调节动画速度可以调整可视化的效果
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export default AnimationControls;

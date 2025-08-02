/**
 * 动画管理器
 * 负责管理指令序列的执行、步骤导航和动画控制
 */

import { BPlusCommand } from "./commands";

export interface AnimationState {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  isPaused: boolean;
  speed: number; // 毫秒
}

export interface AnimationCallbacks {
  onStepChange?: (step: number, command: BPlusCommand | null) => void;
  onStateChange?: (state: AnimationState) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export class AnimationManager {
  private commands: BPlusCommand[] = [];
  private currentStep: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private speed: number = 500; // 默认500ms
  private callbacks: AnimationCallbacks = {};
  private animationTimer: NodeJS.Timeout | null = null;

  // 用于跟踪最后执行的操作
  public lastOperation: "insert" | "delete" | "reset" | "initial" = "initial";
  public lastKey?: number;

  constructor(callbacks?: AnimationCallbacks) {
    this.callbacks = callbacks || {};
  }

  /**
   * 设置回调
   */
  public setCallbacks(callbacks: AnimationCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * 加载指令序列
   */
  public loadCommands(commands: BPlusCommand[]): void {
    this.commands = commands;
    this.currentStep = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.clearTimer();
    this.notifyStateChange();
  }

  /**
   * 播放所有动画
   */
  public async playAll(): Promise<void> {
    if (this.commands.length === 0) return;

    this.isPlaying = true;
    this.isPaused = false;
    this.notifyStateChange();

    try {
      while (
        this.currentStep < this.commands.length &&
        this.isPlaying &&
        !this.isPaused
      ) {
        await this.executeCurrentStep();
        this.currentStep++;
        this.notifyStepChange();

        // 如果不是Step指令，等待动画时间
        const currentCommand = this.commands[this.currentStep - 1];
        if (currentCommand.type !== "Step") {
          await this.wait(this.speed);
        }
      }

      if (this.currentStep >= this.commands.length) {
        this.isPlaying = false;
        this.notifyStateChange();
        this.callbacks.onComplete?.();
      }
    } catch (error) {
      this.isPlaying = false;
      this.isPaused = false;
      this.notifyStateChange();
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * 暂停动画
   */
  public pause(): void {
    this.isPaused = true;
    this.clearTimer();
    this.notifyStateChange();
  }

  /**
   * 恢复动画
   */
  public resume(): void {
    if (this.isPlaying && this.isPaused) {
      this.isPaused = false;
      this.notifyStateChange();
      this.playAll(); // 继续播放
    }
  }

  /**
   * 停止动画
   */
  public stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.clearTimer();
    this.notifyStateChange();
  }

  /**
   * 前进一步
   */
  public async stepForward(): Promise<void> {
    if (this.currentStep >= this.commands.length) return;

    try {
      await this.executeCurrentStep();
      this.currentStep++;
      this.notifyStepChange();
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * 后退一步
   */
  public async stepBackward(): Promise<void> {
    if (this.currentStep <= 0) return;

    this.currentStep--;
    this.notifyStepChange();

    // 重新执行到当前步骤
    await this.jumpToStep(this.currentStep);
  }

  /**
   * 跳转到指定步骤
   */
  public async jumpToStep(step: number): Promise<void> {
    if (step < 0 || step > this.commands.length) return;

    this.currentStep = 0;
    this.notifyStepChange();

    try {
      // 执行到目标步骤
      while (this.currentStep < step) {
        await this.executeCurrentStep();
        this.currentStep++;
      }
      this.notifyStepChange();
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * 设置动画速度
   */
  public setSpeed(speed: number): void {
    this.speed = Math.max(100, Math.min(2000, speed)); // 限制在100-2000ms之间
    this.notifyStateChange();
  }

  /**
   * 获取当前状态
   */
  public getState(): AnimationState {
    return {
      currentStep: this.currentStep,
      totalSteps: this.commands.length,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      speed: this.speed,
    };
  }

  /**
   * 获取当前指令
   */
  public getCurrentCommand(): BPlusCommand | null {
    if (this.currentStep > 0 && this.currentStep <= this.commands.length) {
      return this.commands[this.currentStep - 1];
    }
    return null;
  }

  /**
   * 获取指定步骤的指令
   */
  public getCommandAtStep(step: number): BPlusCommand | null {
    if (step >= 0 && step < this.commands.length) {
      return this.commands[step];
    }
    return null;
  }

  /**
   * 获取所有Step指令的位置（用于断点导航）
   */
  public getStepBreakpoints(): number[] {
    const breakpoints: number[] = [];
    this.commands.forEach((command, index) => {
      if (command.type === "Step") {
        breakpoints.push(index);
      }
    });
    return breakpoints;
  }

  /**
   * 跳转到下一个断点
   */
  public async jumpToNextBreakpoint(): Promise<void> {
    const breakpoints = this.getStepBreakpoints();
    const nextBreakpoint = breakpoints.find((bp) => bp > this.currentStep);

    if (nextBreakpoint !== undefined) {
      await this.jumpToStep(nextBreakpoint);
    } else {
      // 如果没有下一个断点，跳转到最后
      await this.jumpToStep(this.commands.length);
    }
  }

  /**
   * 跳转到上一个断点
   */
  public async jumpToPreviousBreakpoint(): Promise<void> {
    const breakpoints = this.getStepBreakpoints();
    const previousBreakpoint = breakpoints
      .reverse()
      .find((bp) => bp < this.currentStep);

    if (previousBreakpoint !== undefined) {
      await this.jumpToStep(previousBreakpoint);
    } else {
      // 如果没有上一个断点，跳转到开始
      await this.jumpToStep(0);
    }
  }

  /**
   * 重置到开始状态
   */
  public reset(): void {
    this.currentStep = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.clearTimer();
    this.notifyStepChange();
    this.notifyStateChange();
  }

  /**
   * 执行当前步骤的指令
   */
  private async executeCurrentStep(): Promise<void> {
    if (this.currentStep >= this.commands.length) return;

    const command = this.commands[this.currentStep];

    // 这里不直接执行指令，而是通过回调通知外部执行
    // 这样保持了动画管理器的纯净性
    this.callbacks.onStepChange?.(this.currentStep, command);
  }

  /**
   * 等待指定时间
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.animationTimer = setTimeout(resolve, ms);
    });
  }

  /**
   * 清除定时器
   */
  private clearTimer(): void {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }
  }

  /**
   * 通知步骤变化
   */
  private notifyStepChange(): void {
    const command = this.getCurrentCommand();
    this.callbacks.onStepChange?.(this.currentStep, command);
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange(): void {
    this.callbacks.onStateChange?.(this.getState());
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    this.stop();
    this.clearTimer();
    this.commands = [];
    this.callbacks = {};
  }
}

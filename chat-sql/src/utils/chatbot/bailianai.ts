// 百炼平台ChatBot工具函数

import axios, { AxiosError } from "axios";
import {
  BailianAIRequest,
  BailianAIResponse,
  ChatRequest,
  ChatResponse,
  StreamChatResponse,
  SessionInfo,
  BailianAIAPIError,
  ErrorType,
  APICallOptions,
  DEFAULT_BAILIAN_CONFIG,
} from "@/types/chatBotTypes/bailianai";

/**
 * 会话管理器类
 */
export class SessionManager {
  private sessions: Map<string, SessionInfo> = new Map();
  private readonly maxSessions: number = 100;
  private readonly sessionTimeout: number = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 创建新会话
   */
  createSession(): string {
    const sessionId = this.generateSessionId();
    const sessionInfo: SessionInfo = {
      sessionId,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      messageCount: 0,
    };

    this.sessions.set(sessionId, sessionInfo);
    this.cleanupExpiredSessions();

    return sessionId;
  }

  /**
   * 更新会话信息
   */
  updateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastUsedAt = new Date().toISOString();
      session.messageCount += 1;
    }
  }

  /**
   * 获取会话信息
   */
  getSession(sessionId: string): SessionInfo | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * 获取所有活跃会话
   */
  getActiveSessions(): SessionInfo[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 清理过期会话
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      const lastUsed = new Date(session.lastUsedAt).getTime();
      if (now - lastUsed > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach((sessionId) => {
      this.sessions.delete(sessionId);
    });

    // 如果会话数量超过限制，删除最旧的会话
    if (this.sessions.size > this.maxSessions) {
      const sortedSessions = Array.from(this.sessions.entries()).sort(
        ([, a], [, b]) =>
          new Date(a.lastUsedAt).getTime() - new Date(b.lastUsedAt).getTime(),
      );

      const toDelete = sortedSessions.slice(
        0,
        this.sessions.size - this.maxSessions,
      );
      toDelete.forEach(([sessionId]) => {
        this.sessions.delete(sessionId);
      });
    }
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 全局会话管理器实例
 */
export const sessionManager = new SessionManager();

/**
 * ChatBot API客户端类
 */
export class ChatBotAPIClient {
  private readonly apiKey: string;
  private readonly appId: string;
  private readonly baseUrl: string;

  constructor(apiKey?: string, appId?: string) {
    this.apiKey = apiKey || process.env.DASHSCOPE_API_KEY || "";
    this.appId =
      appId || process.env.BAILIAN_APP_ID || "6533b3711b8143068af6b09b98a3323c";
    this.baseUrl = DEFAULT_BAILIAN_CONFIG.baseUrl || "";

    if (!this.apiKey) {
      throw new BailianAIAPIError(
        "API密钥未配置",
        ErrorType.AUTHENTICATION_ERROR,
      );
    }
  }

  /**
   * 发送聊天消息
   */
  async sendMessage(
    message: string,
    sessionId?: string,
    options?: APICallOptions,
  ): Promise<ChatResponse> {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          sessionId,
          parameters: {
            stream: false,
          },
        } as ChatRequest),
        signal: options?.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ChatResponse = await response.json();

      // 更新会话信息
      if (result.success && result.data?.sessionId) {
        sessionManager.updateSession(result.data.sessionId);
      }

      return result;
    } catch (error) {
      console.error("发送消息失败:", error);
      throw new BailianAIAPIError(
        error instanceof Error ? error.message : "发送消息失败",
        ErrorType.NETWORK_ERROR,
      );
    }
  }

  /**
   * 发送流式聊天消息
   */
  async sendStreamMessage(
    message: string,
    sessionId?: string,
    onChunk?: (chunk: StreamChatResponse) => void,
    options?: APICallOptions,
  ): Promise<string> {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          sessionId,
          parameters: {
            stream: true,
          },
        } as ChatRequest),
        signal: options?.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应流");
      }

      let fullText = "";
      let finalSessionId = sessionId;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data: StreamChatResponse = JSON.parse(line.slice(6));

                if (data.type === "chunk" && data.data) {
                  fullText += data.data.text;
                  if (data.data.sessionId) {
                    finalSessionId = data.data.sessionId;
                  }
                }

                onChunk?.(data);

                if (data.type === "done") {
                  break;
                }

                if (data.type === "error") {
                  throw new Error(data.error?.message || "流式响应错误");
                }
              } catch (parseError) {
                console.warn("解析流式数据失败:", parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // 更新会话信息
      if (finalSessionId) {
        sessionManager.updateSession(finalSessionId);
      }

      return fullText;
    } catch (error) {
      console.error("发送流式消息失败:", error);
      throw new BailianAIAPIError(
        error instanceof Error ? error.message : "发送流式消息失败",
        ErrorType.NETWORK_ERROR,
      );
    }
  }

  /**
   * 创建新会话
   */
  createSession(): string {
    return sessionManager.createSession();
  }

  /**
   * 获取会话信息
   */
  getSession(sessionId: string): SessionInfo | undefined {
    return sessionManager.getSession(sessionId);
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    return sessionManager.deleteSession(sessionId);
  }
}

/**
 * 工具函数：验证API配置
 */
export function validateAPIConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.DASHSCOPE_API_KEY) {
    errors.push("缺少环境变量: DASHSCOPE_API_KEY");
  }

  if (!process.env.BAILIAN_APP_ID) {
    errors.push("缺少环境变量: BAILIAN_APP_ID");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 工具函数：格式化错误消息
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof BailianAIAPIError) {
    return `[${error.type}] ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "未知错误";
}

/**
 * 工具函数：检查网络连接
 */
export async function checkNetworkConnection(): Promise<boolean> {
  try {
    const response = await fetch("https://dashscope.aliyuncs.com", {
      method: "HEAD",
      mode: "no-cors",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 默认导出ChatBot API客户端实例
 */
export default ChatBotAPIClient;

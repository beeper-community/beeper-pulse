/**
 * Notification types and interfaces
 */

export interface NotificationPayload {
  title: string;
  message: string;
  url?: string;
  type: "release" | "digest" | "status" | "alert";
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  provider: string;
  error?: string;
  timestamp: Date;
}

export interface NotificationConfig {
  discord?: {
    webhookUrl: string;
    username?: string;
    avatarUrl?: string;
  };
  slack?: {
    webhookUrl: string;
    channel?: string;
    username?: string;
  };
  webhook?: {
    url: string;
    headers?: Record<string, string>;
    method?: "POST" | "PUT";
  };
  email?: {
    apiKey: string;
    from: string;
    to: string[];
    provider: "resend" | "sendgrid";
  };
}

export interface NotificationProvider {
  name: string;
  send(payload: NotificationPayload): Promise<NotificationResult>;
}

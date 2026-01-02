/**
 * @module types/api
 * Strict TypeScript types for backend API requests and responses.
 */

// --- Generic Success/Error Types ---

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
  requestId?: string;
  count?: number;
  meta?: Record<string, unknown> | null;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: unknown[];
    requestId?: string;
  };
}

// --- Auth Types ---

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberDevice?: boolean;
}

export interface LoginSuccessData {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isEmailConfirmed: boolean;
  twoFactorEnabled: boolean;
}

export type LoginSuccessResponse = ApiSuccessResponse<LoginSuccessData>;

export type TwoFactorRequiredResponse = ApiSuccessResponse<{ userId: string }>;

export interface ConfirmTwoFactorRequest {
  userId: string;
  code: string;
}

export interface ResendConfirmationRequest {
  email: string;
}

export interface RequestPasswordReset {
  email: string;
}

export interface ResetPassword {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export type ValidateResetTokenResponse = ApiSuccessResponse<{ email: string }>;

export interface Session {
  tokenId?: string;
  createdAt?: string;
  expiresAt?: string;
  userAgent?: string;
  ipAddress?: string;
}

export type SessionsResponse = ApiSuccessResponse<{ sessions: Session[]; count: number }>;

// --- Message Types ---

export interface Message {
  id: string;
  key: string;
  type: string;
  category: string;
  value: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Message list response structure.
 * NOTE: The API returns messages as a direct array in 'data', not nested under 'data.messages'.
 * The 'count' field is at the top level, not inside 'data'.
 */
export interface MessageListResponse {
  success: true;
  count: number;
  data: Message[]; // Direct array, not { messages: Message[] }
  requestId?: string;
}

/**
 * Single message response structure.
 * NOTE: The API returns the Message object directly in 'data', not wrapped in { message: Message }.
 * Example: { "success": true, "data": { "id": "...", "key": "...", ... }, "requestId": "..." }
 */
export type MessageResponse = ApiSuccessResponse<Message>;

export interface CreateMessageRequest {
  key: string;
  type: string;
  category: string;
  value: string;
  description?: string | null;
}

export interface UpdateMessageRequest {
  key: string;
  type: string;
  category: string;
  value: string;
  description?: string | null;
}

// --- System Types ---

export interface HealthData {
  timestamp: string;
  environment: string;
}

export type HealthResponse = ApiSuccessResponse<HealthData>;

export interface MetricsData {
  timestamp: string;
  data: {
    requests: { total: number; lastMinute: number };
    uptimeSeconds: number;
    memory: { rss: number; heapUsed: number };
  };
}

export type MetricsResponse = ApiSuccessResponse<MetricsData>;

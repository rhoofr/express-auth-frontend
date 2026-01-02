/**
 * @module hooks/useMessages
 * React Query hooks for message endpoints.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useQueryErrorToast } from '@/hooks/useQueryErrorToast';
import { API_ENDPOINTS } from '@/lib/constants';
import type {
  MessageListResponse,
  MessageResponse,
  CreateMessageRequest,
  UpdateMessageRequest,
  ApiErrorResponse,
} from '@/types/api';

const BASE = API_ENDPOINTS.MESSAGES;

function getErrorMessage(error: ApiErrorResponse) {
  return error?.error?.message || 'An unknown error occurred';
}

// Get all messages
export function useMessages() {
  const query = useQuery<MessageListResponse, ApiErrorResponse>({
    queryKey: ['messages'],
    queryFn: () =>
      request<MessageListResponse>({
        url: BASE,
        method: 'GET',
      }),
  });
  useQueryErrorToast(query.error);
  return query;
}

// Get message by key
export function useGetMessageByKey(key: string) {
  const query = useQuery<MessageResponse, ApiErrorResponse>({
    queryKey: ['message', 'key', key],
    queryFn: () =>
      request<MessageResponse>({
        url: `${BASE}/key/${key}`,
        method: 'GET',
      }),
    enabled: !!key,
  });
  useQueryErrorToast(query.error);
  return query;
}

// Get message by ID
export function useGetMessageById(id: string) {
  const query = useQuery<MessageResponse, ApiErrorResponse>({
    queryKey: ['message', 'id', id],
    queryFn: () =>
      request<MessageResponse>({
        url: `${BASE}/${id}`,
        method: 'GET',
      }),
    enabled: !!id,
  });
  useQueryErrorToast(query.error);
  return query;
}

// Create message (admin)
export function useCreateMessage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, ApiErrorResponse, CreateMessageRequest>({
    mutationFn: (data) =>
      request<MessageResponse>({
        url: BASE,
        method: 'POST',
        data,
      }),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Update message (admin)
export function useUpdateMessage(id: string) {
  const toast = useToast();
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, ApiErrorResponse, UpdateMessageRequest>({
    mutationFn: (data) =>
      request<MessageResponse>({
        url: `${BASE}/${id}`,
        method: 'PUT',
        data,
      }),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['message', 'id', id] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Delete message (admin)
export function useDeleteMessage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  return useMutation<void, ApiErrorResponse, string>({
    mutationFn: (id) =>
      request<void>({
        url: `${BASE}/${id}`,
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast.success('Message deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Refresh message cache (admin)
export function useRefreshMessageCache() {
  const toast = useToast();
  return useMutation<{ success: true; message: string; requestId?: string }, ApiErrorResponse, void>({
    mutationFn: () =>
      request<{ success: true; message: string; requestId?: string }>({
        url: `${BASE}/refresh-cache`,
        method: 'POST',
      }),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

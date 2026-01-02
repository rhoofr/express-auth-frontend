/**
 * @module hooks/useQueryErrorToast
 * Utility hook to show a toast for React Query errors.
 */
import { useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import type { ApiErrorResponse } from '@/types/api';

export function useQueryErrorToast(error: ApiErrorResponse | null | undefined) {
  const toast = useToast();
  useEffect(() => {
    if (error) {
      toast.error(error.error?.message || 'An unknown error occurred');
    }
  }, [error, toast]);
}

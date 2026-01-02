/**
 * @module components/ConfirmDialog
 * Reusable confirmation dialog for destructive actions.
 * Uses shadcn/ui AlertDialog for a better user experience than native confirm().
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  /** Trigger element (usually a button) */
  trigger: ReactNode;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: string;
  /** Text for confirm button (defaults to "Continue") */
  confirmText?: string;
  /** Text for cancel button (defaults to "Cancel") */
  cancelText?: string;
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Whether the action is in progress (disables confirm button) */
  isLoading?: boolean;
  /** Optional className for the trigger wrapper */
  className?: string;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  onConfirm,
  isLoading = false,
  className,
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild className={className}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

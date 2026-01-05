/**
 * @module components/UserRoleDialog
 * Dialog for changing user roles (admin only).
 * Uses shadcn/ui AlertDialog for confirmation.
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
import type { User } from '@/types/api';

interface UserRoleDialogProps {
  /** Trigger element (usually a button) */
  trigger: ReactNode;
  /** User whose role is being changed */
  user: User;
  /** New role to assign */
  newRole: 'user' | 'admin';
  /** Callback when user confirms role change */
  onConfirm: (userId: string, newRole: 'user' | 'admin') => void;
  /** Whether the action is in progress (disables confirm button) */
  isLoading?: boolean;
}

export function UserRoleDialog({ trigger, user, newRole, onConfirm, isLoading = false }: UserRoleDialogProps) {
  const currentRole = user.role;
  const isPromotion = newRole === 'admin';

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isPromotion ? 'Promote to Admin' : 'Demote to User'}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to change <span className='font-semibold'>{user.email}</span>'s role from{' '}
            <span className='font-semibold capitalize'>{currentRole}</span> to{' '}
            <span className='font-semibold capitalize'>{newRole}</span>?
            {isPromotion && (
              <span className='block mt-2 text-yellow-600 dark:text-yellow-500'>
                This user will have full admin privileges.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(user.id, newRole)} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

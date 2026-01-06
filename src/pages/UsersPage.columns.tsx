/**
 * @module pages/UsersPage.columns
 * Column definitions for the Users data table.
 */
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserRoleDialog } from '@/components/UserRoleDialog';
import type { User } from '@/types/api';

interface ColumnContext {
  currentUserId: string | undefined;
  onRoleChange: (userId: string, newRole: 'user' | 'admin') => void;
  isUpdating: boolean;
}

export function createColumns(context: ColumnContext): ColumnDef<User>[] {
  const { currentUserId, onRoleChange, isUpdating } = context;

  return [
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='hover:bg-transparent p-0'>
            Email
            <ArrowUpDown className='ml-2 size-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const isCurrentUser = currentUserId === row.original.id;
        return (
          <div className='flex items-center gap-2'>
            <span className='font-medium'>{row.getValue('email')}</span>
            {isCurrentUser && (
              <Badge variant='outline' className='text-xs'>
                You
              </Badge>
            )}
          </div>
        );
      },
      filterFn: (row, _columnId, filterValue) => {
        const query = String(filterValue).toLowerCase().trim();
        const email = row.original.email.toLowerCase();
        const name = row.original.full_name?.toLowerCase() || '';
        const role = row.original.role.toLowerCase();
        return email.includes(query) || name.includes(query) || role.includes(query);
      },
    },
    {
      accessorKey: 'full_name',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='hover:bg-transparent p-0'>
            Name
            <ArrowUpDown className='ml-2 size-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const name = row.getValue('full_name') as string | null;
        return <span className='text-muted-foreground'>{name || 'No name'}</span>;
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='hover:bg-transparent p-0'>
            Role
            <ArrowUpDown className='ml-2 size-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const role = row.getValue('role') as 'user' | 'admin';
        return (
          <Badge variant={role === 'admin' ? 'default' : 'secondary'} className='text-xs capitalize'>
            {role}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUser = currentUserId === user.id;
        const isAdmin = user.role === 'admin';
        const canChangeRole = !isCurrentUser;

        if (!canChangeRole) {
          return <span className='text-xs text-muted-foreground'>—</span>;
        }

        return (
          <div className='flex gap-2'>
            {isAdmin ? (
              <UserRoleDialog
                trigger={
                  <Button variant='outline' size='sm' disabled={isUpdating}>
                    <ArrowDownCircle className='size-4 mr-2' />
                    Demote
                  </Button>
                }
                user={user}
                newRole='user'
                onConfirm={onRoleChange}
                isLoading={isUpdating}
              />
            ) : (
              <UserRoleDialog
                trigger={
                  <Button variant='default' size='sm' disabled={isUpdating}>
                    <ArrowUpCircle className='size-4 mr-2' />
                    Promote
                  </Button>
                }
                user={user}
                newRole='admin'
                onConfirm={onRoleChange}
                isLoading={isUpdating}
              />
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

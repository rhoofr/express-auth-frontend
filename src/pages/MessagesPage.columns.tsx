/**
 * @module pages/MessagesPage.columns
 * Column definitions for the Messages data table.
 */
import type { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Message } from '@/types/api';

interface ColumnContext {
  isAdmin: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: (id: string) => boolean;
}

export function createMessageColumns(ctx: ColumnContext): ColumnDef<Message>[] {
  return [
    {
      accessorKey: 'key',
      header: 'Key',
      cell: ({ row }) => <span className='font-mono'>{row.original.key}</span>,
      meta: { width: '35%' },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant='outline' className='text-xs'>
          {row.original.type}
        </Badge>
      ),
      meta: { width: '7%' },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant='secondary' className='text-xs'>
          {row.original.category}
        </Badge>
      ),
      meta: { width: '7%' },
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => (
        <span className='truncate block max-w-sm text-xs text-muted-foreground'>{row.original.value}</span>
      ),
      meta: { width: '45%' },
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        if (!ctx.isAdmin) return null;
        const { id, key } = row.original;
        return (
          <div className='flex gap-1'>
            <Button
              variant='outline'
              size='icon'
              className='size-7'
              title='Edit message'
              aria-label={`Edit ${key}`}
              onClick={() => ctx.onEdit(id)}>
              <Edit className='size-4' />
            </Button>
            <ConfirmDialog
              trigger={
                <Button
                  variant='destructive'
                  size='icon'
                  className='size-7'
                  title='Delete message'
                  aria-label={`Delete ${key}`}
                  disabled={ctx.isDeleting(id)}>
                  <Trash2 className='size-4' />
                </Button>
              }
              title='Delete Message'
              description={`Are you sure you want to delete "${key}"? This action cannot be undone.`}
              confirmText='Delete'
              onConfirm={() => ctx.onDelete(id)}
              isLoading={ctx.isDeleting(id)}
            />
          </div>
        );
      },
      meta: { width: '7%' },
    },
  ];
}

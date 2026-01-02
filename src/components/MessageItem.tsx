/**
 * @module components/MessageItem
 * Display individual message card with edit/delete actions (admin only).
 * Compact single-line layout on md+ screens.
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { useDeleteMessage } from '@/hooks/useMessages';
import type { Message } from '@/types/api';

interface MessageItemProps {
  message: Message;
  isAdmin: boolean;
}

export function MessageItem({ message, isAdmin }: MessageItemProps) {
  const navigate = useNavigate();
  const deleteMessage = useDeleteMessage();

  const handleDelete = (e: React.MouseEvent) => {
    // Prevent card click navigation when clicking delete button
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete message "${message.key}"?`)) {
      return;
    }

    deleteMessage.mutate(message.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    // Prevent card click navigation when clicking edit button
    e.stopPropagation();
    navigate(`/messages/${message.id}/edit`);
  };

  const handleCardClick = () => {
    navigate(`/messages/${message.id}`);
  };

  return (
    <div
      className='border border-border rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors group'
      onClick={handleCardClick}>
      {/* Mobile Layout (stacked) */}
      <div className='flex md:hidden flex-col gap-2'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='text-xs font-medium text-muted-foreground'>Key:</span>
              <span className='text-sm font-semibold truncate'>{message.key}</span>
            </div>
            <div className='flex items-center gap-2 mt-1'>
              <span className='text-xs font-medium text-muted-foreground'>Type:</span>
              <Badge variant='outline' className='text-xs'>
                {message.type}
              </Badge>
            </div>
          </div>
          {isAdmin && (
            <div className='flex gap-1'>
              <Button
                variant='outline'
                size='icon'
                onClick={handleEdit}
                className='size-7'
                title='Edit message'
                aria-label={`Edit ${message.key}`}>
                <Edit className='size-3.5' />
              </Button>
              <Button
                variant='destructive'
                size='icon'
                onClick={handleDelete}
                disabled={deleteMessage.isPending}
                className='size-7'
                title='Delete message'
                aria-label={`Delete ${message.key}`}>
                <Trash2 className='size-3.5' />
              </Button>
            </div>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-medium text-muted-foreground'>Category:</span>
          <Badge variant='secondary' className='text-xs'>
            {message.category}
          </Badge>
        </div>
        <div className='flex items-start gap-2'>
          <span className='text-xs font-medium text-muted-foreground'>Value:</span>
          <span className='text-xs text-muted-foreground line-clamp-2 flex-1'>{message.value}</span>
        </div>
      </div>

      {/* Desktop Layout (single line) */}
      <div className='hidden md:flex items-center gap-4'>
        {/* Key  style={{ width: '200px' }} */}
        <div className='flex items-center gap-1.5 min-w-0 shrink-0 w-2/5'>
          <span className='text-xs font-medium text-muted-foreground whitespace-nowrap'>Key:</span>
          <span className='text-sm font-medium truncate'>{message.key}</span>
        </div>

        {/* Type */}
        <div className='flex items-center gap-1.5 shrink-0 w-1/12'>
          <span className='text-xs font-medium text-muted-foreground whitespace-nowrap'>Type:</span>
          <Badge variant='outline' className='text-xs'>
            {message.type}
          </Badge>
        </div>

        {/* Category */}
        <div className='flex items-center gap-1.5 shrink-0 w-1/12'>
          <span className='text-xs font-medium text-muted-foreground whitespace-nowrap'>Category:</span>
          <Badge variant='secondary' className='text-xs'>
            {message.category}
          </Badge>
        </div>

        {/* Value */}
        <div className='flex items-center gap-1.5 flex-1 min-w-0'>
          <span className='text-xs font-medium text-muted-foreground whitespace-nowrap'>Value:</span>
          <span className='text-sm truncate'>{message.value}</span>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className='flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0'>
            <Button
              variant='outline'
              size='icon'
              onClick={handleEdit}
              className='size-7'
              title='Edit message'
              aria-label={`Edit ${message.key}`}>
              <Edit className='size-3.5' />
            </Button>
            <Button
              variant='destructive'
              size='icon'
              onClick={handleDelete}
              disabled={deleteMessage.isPending}
              className='size-7'
              title='Delete message'
              aria-label={`Delete ${message.key}`}>
              <Trash2 className='size-3.5' />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @module pages/MessageDetailPage
 * View single message details (authenticated users).
 */
import { useNavigate, useParams } from 'react-router-dom';
import { useGetMessageById, useDeleteMessage } from '@/hooks/useMessages';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react';

export default function MessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const { data, isLoading } = useGetMessageById(id || '');
  const deleteMessage = useDeleteMessage();

  const handleDelete = () => {
    if (!id || !confirm('Are you sure you want to delete this message?')) return;
    deleteMessage.mutate(id, {
      onSuccess: () => navigate(-1),
    });
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-100'>
        <Loader2 className='size-8 animate-spin text-primary' />
      </div>
    );
  }

  // Access message directly from data.data (which is Message)
  const message = data?.data;

  if (!message) {
    return (
      <div className='mx-auto max-w-4xl space-y-6 px-4'>
        <Button variant='outline' onClick={() => navigate('/messages')}>
          <ArrowLeft className='size-4 mr-2' />
          Back to Messages
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Message not found</CardTitle>
            <CardDescription>The message you're looking for doesn't exist or has been deleted.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-4xl space-y-6 px-4'>
      {/* Header with Back Button */}
      <div className='flex items-center justify-between'>
        <Button variant='outline' onClick={() => navigate('/messages')}>
          <ArrowLeft className='size-4 mr-2' />
          Back to Messages
        </Button>

        {isAdmin && (
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => navigate(`/messages/${id}/edit`)}>
              <Edit className='size-4 mr-2' />
              Edit
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={deleteMessage.isPending}>
              <Trash2 className='size-4 mr-2' />
              {deleteMessage.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )}
      </div>

      {/* Message Details Card */}
      <Card className='gap-3'>
        <CardHeader>
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-1'>
              <CardTitle className='text-2xl'>{message.key}</CardTitle>
              <CardDescription>Message details and configuration</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          <div className='pt-4 border-t border-border space-y-6'>
            {/* Key Field */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>Key</span>
              </div>
              <p className='text-base font-medium'>{message.key}</p>
            </div>

            {/* Type Field */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>Type</span>
              </div>
              <Badge variant='outline' className='text-sm'>
                {message.type}
              </Badge>
            </div>

            {/* Category Field */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>Category</span>
              </div>
              <Badge variant='secondary' className='text-sm'>
                {message.category}
              </Badge>
            </div>

            {/* Value Field */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>Value</span>
              </div>
              <p className='text-base leading-relaxed'>{message.value}</p>
            </div>

            {/* Description Field (Optional) */}
            {message.description && (
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
                    Description
                  </span>
                </div>
                <p className='text-base text-muted-foreground leading-relaxed italic'>{message.description}</p>
              </div>
            )}

            {/* Metadata */}
            {(message.created_at || message.updated_at) && (
              <div className='pt-4 border-t border-border space-y-3'>
                {message.created_at && (
                  <div className='flex items-start gap-3'>
                    <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-25'>
                      Created
                    </span>
                    <span className='text-sm text-muted-foreground'>
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {message.updated_at && (
                  <div className='flex items-start gap-3'>
                    <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-25'>
                      Last Updated
                    </span>
                    <span className='text-sm text-muted-foreground'>
                      {new Date(message.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

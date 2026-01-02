/**
 * @module pages/MessagesPage
 * List all messages (authenticated users).
 */
import { useNavigate } from 'react-router-dom';
import { useListMessages } from '@/hooks/useMessages';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { MessageItem } from '@/components/MessageItem';

export default function MessagesPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const { data, isLoading } = useListMessages();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-100'>
        <Loader2 className='size-8 animate-spin text-primary' />
      </div>
    );
  }

  // Access messages directly from data.data (which is Message[])
  const messages = data?.data || [];
  const messageCount = data?.count || 0;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Messages</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            {messageCount} {messageCount === 1 ? 'message' : 'messages'} total
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/messages/new')}>
            <Plus className='size-4 mr-2' />
            Create Message
          </Button>
        )}
      </div>

      <div className='grid gap-4'>
        {messages.length === 0 ? (
          <div className='text-center py-12 border border-dashed border-border rounded-lg'>
            <p className='text-muted-foreground'>No messages found.</p>
            {isAdmin && (
              <Button variant='outline' className='mt-4' onClick={() => navigate('/messages/new')}>
                Create your first message
              </Button>
            )}
          </div>
        ) : (
          messages.map((message) => <MessageItem key={message.id} message={message} isAdmin={isAdmin} />)
        )}
      </div>
    </div>
  );
}

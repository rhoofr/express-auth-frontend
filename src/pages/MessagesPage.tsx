/**
 * @module pages/MessagesPage
 * List all messages (authenticated users).
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '@/hooks/useMessages';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { MessageItem } from '@/components/MessageItem';
import { SearchBar } from '@/components/SearchBar';

export default function MessagesPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const { data, isLoading } = useMessages();

  // Local state for search query
  const [searchQuery, setSearchQuery] = useState('');

  // Memoize allMessages to prevent useMemo dependency issues
  const allMessages = useMemo(() => data?.data || [], [data?.data]);
  const totalCount = data?.count || 0;

  // Filter messages based on search query (case-insensitive, searches key and value)
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) {
      return allMessages;
    }

    const query = searchQuery.toLowerCase().trim();

    return allMessages.filter((message) => {
      const keyMatch = message.key.toLowerCase().includes(query);
      const valueMatch = message.value.toLowerCase().includes(query);
      return keyMatch || valueMatch;
    });
  }, [allMessages, searchQuery]);

  const filteredCount = filteredMessages.length;
  const isSearchActive = searchQuery.trim().length > 0;

  // Loading state check AFTER all hooks
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-100'>
        <Loader2 className='size-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='flex items-start justify-between gap-4'>
        <div className='flex-1 min-w-0'>
          <h1 className='text-3xl font-bold'>Messages</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            {isSearchActive ? (
              <>
                {filteredCount} {filteredCount === 1 ? 'result' : 'results'} found ({totalCount} total)
              </>
            ) : (
              <>
                {totalCount} {totalCount === 1 ? 'message' : 'messages'} total
              </>
            )}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/messages/new')} className='shrink-0'>
            <Plus className='size-4 mr-2' />
            Create Message
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder='Search by key or value...'
        className='max-w-md'
      />

      {/* Messages List */}
      <div className='grid gap-3'>
        {filteredMessages.length === 0 ? (
          <div className='text-center py-12 border border-dashed border-border rounded-lg'>
            {isSearchActive ? (
              <>
                <p className='text-muted-foreground'>No messages found matching "{searchQuery}".</p>
                <Button variant='outline' className='mt-4' onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <p className='text-muted-foreground'>No messages found.</p>
                {isAdmin && (
                  <Button variant='outline' className='mt-4' onClick={() => navigate('/messages/new')}>
                    Create your first message
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          filteredMessages.map((message) => <MessageItem key={message.id} message={message} isAdmin={isAdmin} />)
        )}
      </div>
    </div>
  );
}

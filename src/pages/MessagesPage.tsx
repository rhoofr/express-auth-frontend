/**
 * @module pages/MessagesPage
 * List all messages (authenticated users) in a compact data table.
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages, useDeleteMessage } from '@/hooks/useMessages';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { DataTable } from '@/components/DataTable';
import { createMessageColumns } from './MessagesPage.columns';
import type { Message } from '@/types/api';

export default function MessagesPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const { data, isLoading } = useMessages();
  const deleteMessage = useDeleteMessage();

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

  // Handlers for edit/delete
  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/messages/${id}/edit`);
    },
    [navigate]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMessage.mutate(id);
    },
    [deleteMessage]
  );

  const isDeleting = useCallback(
    (id: string) => deleteMessage.variables === id && deleteMessage.isPending,
    [deleteMessage.variables, deleteMessage.isPending]
  );

  // Columns for DataTable
  const columns = useMemo(
    () =>
      createMessageColumns({
        isAdmin,
        onEdit: handleEdit,
        onDelete: handleDelete,
        isDeleting,
      }),
    [isAdmin, handleEdit, handleDelete, isDeleting]
  );

  // Handler for double-clicking a row
  const handleRowDoubleClick = (message: Message) => {
    navigate(`/messages/${message.id}`);
  };

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
      <div className='flex items-start justify-between gap-4 mb-2'>
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

      {/* Messages Data Table */}
      <DataTable
        columns={columns}
        data={filteredMessages}
        searchColumn='key'
        searchValue={searchQuery}
        pageSize={10}
        onRowDoubleClick={handleRowDoubleClick}
      />
    </div>
  );
}

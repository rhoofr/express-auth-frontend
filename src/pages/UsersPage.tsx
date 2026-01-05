/**
 * @module pages/UsersPage
 * Admin-only page for managing user roles.
 * Displays list of all users with ability to promote/demote between user and admin roles.
 * Uses TanStack Table for efficient, compact display.
 */
import { useState, useMemo, useCallback } from 'react';
import { useListUsers, useUpdateUserRole } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
import { SearchBar } from '@/components/SearchBar';
import { DataTable } from '@/components/DataTable';
import { Loader2, Users } from 'lucide-react';
import { createColumns } from './UsersPage.columns';

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const { data, isLoading } = useListUsers();
  const updateRoleMutation = useUpdateUserRole();

  // Local state for search
  const [searchQuery, setSearchQuery] = useState('');

  // Memoize users list
  const allUsers = useMemo(() => data?.data || [], [data?.data]);
  const totalCount = data?.count || 0;

  // Handle role change - wrapped in useCallback to stabilize reference
  const handleRoleChange = useCallback(
    (userId: string, newRole: 'user' | 'admin') => {
      updateRoleMutation.mutate({ userId, role: newRole });
    },
    [updateRoleMutation]
  );

  // Create columns with context
  const columns = useMemo(
    () =>
      createColumns({
        currentUserId: currentUser?.id,
        onRoleChange: handleRoleChange,
        isUpdating: updateRoleMutation.isPending,
      }),
    [currentUser?.id, handleRoleChange, updateRoleMutation.isPending]
  );

  // Filter users based on search query (client-side for all fields)
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return allUsers;
    }

    const query = searchQuery.toLowerCase().trim();

    return allUsers.filter((user) => {
      const emailMatch = user.email.toLowerCase().includes(query);
      const nameMatch = user.full_name?.toLowerCase().includes(query);
      const roleMatch = user.role.toLowerCase().includes(query);
      return emailMatch || nameMatch || roleMatch;
    });
  }, [allUsers, searchQuery]);

  const filteredCount = filteredUsers.length;
  const isSearchActive = searchQuery.trim().length > 0;

  // Loading state
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Loader2 className='size-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='mb-2'>
        <div className='flex items-center gap-3 mb-2'>
          <Users className='size-8 text-primary' />
          <h1 className='text-3xl font-bold'>User Management</h1>
        </div>
        <p className='text-sm text-muted-foreground'>
          {isSearchActive ? (
            <>
              {filteredCount} {filteredCount === 1 ? 'result' : 'results'} found ({totalCount} total users)
            </>
          ) : (
            <>
              {totalCount} {totalCount === 1 ? 'user' : 'users'} total
            </>
          )}
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder='Search by email, name, or role...'
        className='max-w-md'
      />

      {/* Users Data Table */}
      <DataTable columns={columns} data={filteredUsers} searchColumn='email' searchValue={searchQuery} pageSize={9} />
    </div>
  );
}

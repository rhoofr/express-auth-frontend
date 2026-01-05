/**
 * @module pages/UsersPage
 * Admin-only page for managing user roles.
 * Displays list of all users with ability to promote/demote between user and admin roles.
 */
import { useState, useMemo } from 'react';
import { useListUsers, useUpdateUserRole } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/SearchBar';
import { UserRoleDialog } from '@/components/UserRoleDialog';
import { Loader2, Users, ShieldCheck, User as UserIcon, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { User } from '@/types/api';

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const { data, isLoading } = useListUsers();
  const updateRoleMutation = useUpdateUserRole();

  // Local state for search
  const [searchQuery, setSearchQuery] = useState('');

  // Memoize users list
  const allUsers = useMemo(() => data?.data || [], [data?.data]);
  const totalCount = data?.count || 0;

  // Filter users based on search query
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

  // Handle role change
  const handleRoleChange = (userId: string, newRole: 'user' | 'admin') => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  // Render user card
  const renderUserCard = (user: User) => {
    const isCurrentUser = currentUser?.id === user.id;
    const isAdmin = user.role === 'admin';
    const canChangeRole = !isCurrentUser; // Can't change own role

    return (
      <Card key={user.id} className='hover:shadow-md transition-shadow'>
        <CardContent className='p-6'>
          <div className='flex items-start justify-between gap-4'>
            {/* User Info */}
            <div className='flex items-start gap-4 flex-1 min-w-0'>
              {/* Avatar */}
              <div
                className={`size-12 rounded-full flex items-center justify-center shrink-0 ${
                  isAdmin ? 'bg-primary/10' : 'bg-muted'
                }`}>
                {isAdmin ? (
                  <ShieldCheck className='size-6 text-primary' />
                ) : (
                  <UserIcon className='size-6 text-muted-foreground' />
                )}
              </div>

              {/* Details */}
              <div className='flex-1 min-w-0 space-y-2'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <h3 className='font-semibold text-lg truncate'>{user.full_name || 'No name'}</h3>
                  {isCurrentUser && (
                    <Badge variant='outline' className='text-xs'>
                      You
                    </Badge>
                  )}
                </div>
                <p className='text-sm text-muted-foreground truncate'>{user.email}</p>
                <Badge variant={isAdmin ? 'default' : 'secondary'} className='text-xs capitalize'>
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            {canChangeRole && (
              <div className='flex gap-2 shrink-0'>
                {isAdmin ? (
                  <UserRoleDialog
                    trigger={
                      <Button variant='outline' size='sm' disabled={updateRoleMutation.isPending}>
                        <ArrowDownCircle className='size-4 mr-2' />
                        Demote to User
                      </Button>
                    }
                    user={user}
                    newRole='user'
                    onConfirm={handleRoleChange}
                    isLoading={updateRoleMutation.isPending}
                  />
                ) : (
                  <UserRoleDialog
                    trigger={
                      <Button variant='default' size='sm' disabled={updateRoleMutation.isPending}>
                        <ArrowUpCircle className='size-4 mr-2' />
                        Promote to Admin
                      </Button>
                    }
                    user={user}
                    newRole='admin'
                    onConfirm={handleRoleChange}
                    isLoading={updateRoleMutation.isPending}
                  />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
      <div>
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

      {/* Users List */}
      <div className='grid gap-4'>
        {filteredUsers.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Users Found</CardTitle>
              <CardDescription>
                {isSearchActive ? `No users found matching "${searchQuery}".` : 'No users available in the system.'}
              </CardDescription>
            </CardHeader>
            {isSearchActive && (
              <CardContent>
                <Button variant='outline' onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </CardContent>
            )}
          </Card>
        ) : (
          filteredUsers.map(renderUserCard)
        )}
      </div>
    </div>
  );
}

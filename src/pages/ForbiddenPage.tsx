/**
 * @module pages/ForbiddenPage
 * Page shown when user tries to access a resource they don't have permission for.
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4'>
      <div className='max-w-md w-full text-center space-y-6'>
        <div className='flex justify-center'>
          <ShieldAlert className='size-20 text-red-500' />
        </div>
        <h1 className='text-4xl font-extrabold text-gray-900 dark:text-white'>403</h1>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>Access Denied</h2>
        <p className='text-gray-600 dark:text-gray-400'>
          You don't have permission to access this page. This area is restricted to administrators only.
        </p>
        <div className='flex gap-4 justify-center'>
          <Button onClick={() => navigate('/')} variant='default'>
            Go to Home
          </Button>
          <Button onClick={() => navigate(-1)} variant='outline'>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

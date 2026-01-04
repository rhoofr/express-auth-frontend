/**
 * @module pages/NotFoundPage
 * Page shown when user navigates to a non-existent route.
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className='mx-auto max-w-lg space-y-6 px-4'>
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <AlertCircle className='size-5 text-yellow-500' />
            <CardTitle>404 - Page Not Found</CardTitle>
          </div>
          <CardDescription>
            The page you're looking for doesn't exist. It may have been moved or deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            <Button onClick={() => navigate('/')} variant='default' className='flex-1'>
              Go to Home
            </Button>
            <Button onClick={() => navigate(-1)} variant='outline' className='flex-1'>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

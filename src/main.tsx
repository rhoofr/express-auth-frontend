/**
 * @module main
 * App entry point. Sets up theme and global providers.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import { ThemeProvider } from '@/lib/theme';
import { ReactQueryProvider } from '@/lib/queryClient';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TOAST_POSITION, TOAST_DURATION } from '@/lib/constants';
import App from './App.tsx';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactQueryProvider>
      <ThemeProvider>
        <App />
        <Toaster
          position={TOAST_POSITION}
          toastOptions={{
            className: 'bg-background text-foreground border border-border shadow-lg',
            duration: TOAST_DURATION,
          }}
        />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </ReactQueryProvider>
  </StrictMode>
);

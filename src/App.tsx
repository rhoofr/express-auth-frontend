/**
 * @module App
 * App routing and top-level component wiring.
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useContext } from 'react';
import { ThemeContext } from '@/lib/theme-context';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import ForbiddenPage from '@/pages/ForbiddenPage';
import MessagesPage from '@/pages/MessagesPage';
import MessageDetailPage from '@/pages/MessageDetailPage';
import CreateMessagePage from '@/pages/CreateMessagePage';
import EditMessagePage from '@/pages/EditMessagePage';
import ProfilePage from '@/pages/ProfilePage';

const routes = [
  { path: '/', label: 'Home', protected: false },
  { path: '/messages', label: 'Messages', protected: true },
  { path: '/profile', label: 'Profile', protected: true },
];

function App() {
  const themeCtx = useContext(ThemeContext);
  return (
    <Router>
      <Navbar routes={routes} theme={themeCtx?.theme} setTheme={themeCtx?.setTheme} />
      <main className='container mx-auto px-4 py-8'>
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<HomePage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/forbidden' element={<ForbiddenPage />} />

          {/* Protected Routes - Require Authentication */}
          <Route
            path='/profile'
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/messages'
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/messages/:id'
            element={
              <ProtectedRoute>
                <MessageDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Require Authentication + Admin Role */}
          <Route
            path='/messages/new'
            element={
              <AdminRoute>
                <CreateMessagePage />
              </AdminRoute>
            }
          />
          <Route
            path='/messages/:id/edit'
            element={
              <AdminRoute>
                <EditMessagePage />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;

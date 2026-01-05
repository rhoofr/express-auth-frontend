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
import RegisterPage from '@/pages/RegisterPage';
import ForbiddenPage from '@/pages/ForbiddenPage';
import NotFoundPage from '@/pages/NotFoundPage';
import MessagesPage from '@/pages/MessagesPage';
import MessageDetailPage from '@/pages/MessageDetailPage';
import CreateMessagePage from '@/pages/CreateMessagePage';
import EditMessagePage from '@/pages/EditMessagePage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import UsersPage from '@/pages/UsersPage';

const routes = [
  { path: '/', label: 'Home', protected: false },
  { path: '/messages', label: 'Messages', protected: true },
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
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
          <Route path='/reset-password' element={<ResetPasswordPage />} />
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
            path='/settings'
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/change-password'
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
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
            path='/users'
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
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

          {/* Catch-All Route - Must be last */}
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;

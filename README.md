# Express Auth Frontend

A modern, secure authentication frontend built with React 19, TypeScript, and Vite. This application provides a complete user authentication experience with features like email verification, two-factor authentication (2FA), password management, and admin role management.

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.18-06B6D4?style=flat&logo=tailwindcss)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Design Principles](#design-principles)
- [API Integration](#api-integration)
- [License](#license)

## Features

### Authentication & Security

- ✅ **Secure Login/Registration** - Email and password authentication with validation
- ✅ **Email Verification** - Confirm email addresses before account activation
- ✅ **Two-Factor Authentication (2FA)** - Optional email-based 2FA with device remembering
- ✅ **Password Management** - Change password, forgot password, and reset flows
- ✅ **Session Management** - Logout from current device or all devices
- ✅ **JWT Token Handling** - Automatic token refresh with httpOnly cookies
- ✅ **Protected Routes** - Role-based access control (user/admin)

### User Interface

- ✅ **Responsive Design** - Mobile-first, works on all screen sizes
- ✅ **Dark Mode** - System-aware theme with manual toggle
- ✅ **Modern UI Components** - Built with shadcn/ui component library
- ✅ **Real-time Feedback** - Toast notifications for user actions
- ✅ **Loading States** - Skeleton loaders and spinners for async operations
- ✅ **Form Validation** - Client-side validation with helpful error messages

### Admin Features

- ✅ **User Management** - View and manage all registered users
- ✅ **Role Management** - Promote/demote users between user and admin roles
- ✅ **Message Management** - CRUD operations for system messages
- ✅ **Data Tables** - Sortable, filterable tables with search functionality

### Developer Experience

- ✅ **TypeScript** - Full type safety across the application
- ✅ **React Query** - Efficient data fetching with caching and automatic refetching
- ✅ **Zod Validation** - Runtime type checking for forms
- ✅ **Path Aliases** - Clean imports with `@/` prefix
- ✅ **ESLint** - Code quality and consistency enforcement
- ✅ **Hot Module Replacement** - Fast refresh during development

## Tech Stack

### Core

- **[React 19](https://react.dev/)** - UI library with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vite.dev/)** - Next-generation build tool
- **[React Router](https://reactrouter.com/)** - Client-side routing

### UI & Styling

- **[TailwindCSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality component primitives
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible components
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library

### Data Management

- **[TanStack Query](https://tanstack.com/query)** - Async state management
- **[Zustand](https://github.com/pmndrs/zustand)** - Lightweight state management
- **[Axios](https://axios-http.com/)** - Promise-based HTTP client

### Forms & Validation

- **[React Hook Form](https://react-hook-form.com/)** - Performant form library
- **[Zod](https://zod.dev/)** - Schema validation
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Validation resolver

### Developer Tools

- **[ESLint](https://eslint.org/)** - Linting and code quality
- **[React Query DevTools](https://tanstack.com/query/latest/docs/framework/react/devtools)** - Query debugging

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (or yarn/pnpm equivalent)
- **Backend API** - This frontend requires the [express-auth-typescript](https://github.com/yourusername/express-auth-typescript) backend running

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/express-auth-frontend.git
   cd express-auth-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure your backend API URL (see [Environment Variables](#environment-variables))

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:5004

# Optional: Enable debug mode
VITE_DEBUG=false
```

**Note:** Environment variables must be prefixed with `VITE_` to be exposed to the client.

## Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Type-check TypeScript files
npm run type-check

# Lint code with ESLint
npm run lint

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Project Structure

```
express-auth-frontend/
├── .github/
│   └── copilot-instructions.md    # GitHub Copilot configuration
├── docs/
│   ├── app-description.md         # Comprehensive API documentation
│   └── openapi.yaml               # OpenAPI specification
├── public/                        # Static assets
├── src/
│   ├── assets/                    # Images, fonts, etc.
│   ├── components/                # Reusable React components
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── AdminRoute.tsx         # Admin route guard
│   │   ├── ConfirmDialog.tsx      # Confirmation modal
│   │   ├── DataTable.tsx          # Generic table component
│   │   ├── Navbar.tsx             # Navigation bar
│   │   ├── ProtectedRoute.tsx     # Auth route guard
│   │   ├── SearchBar.tsx          # Search input
│   │   └── UserRoleDialog.tsx     # User role management
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts             # Authentication hooks
│   │   ├── useMessages.ts         # Message management hooks
│   │   └── useToast.ts            # Toast notification hook
│   ├── lib/                       # Utility functions
│   │   ├── api.ts                 # Axios configuration
│   │   ├── constants.ts           # App constants
│   │   ├── queryClient.ts         # React Query setup
│   │   ├── theme.tsx              # Theme provider
│   │   └── utils.ts               # Helper functions
│   ├── pages/                     # Page components
│   │   ├── ChangePasswordPage.tsx
│   │   ├── CreateMessagePage.tsx
│   │   ├── EditMessagePage.tsx
│   │   ├── ForbiddenPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── MessageDetailPage.tsx
│   │   ├── MessagesPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── UsersPage.tsx
│   ├── store/                     # Zustand state stores
│   │   └── auth.ts                # Auth state management
│   ├── types/                     # TypeScript type definitions
│   │   └── api.ts                 # API response types
│   ├── App.tsx                    # Root component with routing
│   ├── index.css                  # Global styles & Tailwind
│   └── main.tsx                   # Application entry point
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
├── components.json                # shadcn/ui configuration
├── eslint.config.js               # ESLint configuration
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── tsconfig.app.json              # TypeScript config (app)
├── tsconfig.json                  # TypeScript base config
├── tsconfig.node.json             # TypeScript config (node)
└── vite.config.ts                 # Vite configuration
```

## Key Features

### Authentication Flow

1. **Registration**

   - User registers with email, password, and full name
   - Validation ensures password strength (8+ chars, uppercase, number, special char)
   - Confirmation email sent with verification link
   - User must verify email before logging in

2. **Login**

   - Email and password authentication
   - Optional "Remember Device" for 30 days (skips 2FA)
   - If 2FA enabled, user receives verification code via email
   - JWT tokens (access + refresh) set as httpOnly cookies

3. **Two-Factor Authentication (2FA)**

   - Optional email-based 2FA
   - 6-digit verification code valid for 10 minutes
   - Device remembering feature (30 days)
   - Enable/disable in Settings page

4. **Password Management**

   - **Change Password**: Update password while logged in
   - **Forgot Password**: Request password reset email
   - **Reset Password**: Set new password via email link
   - Three-tier reset flow for security

5. **Session Management**
   - Logout from current device
   - Logout from all devices
   - Automatic token refresh on expiration
   - Session list view (coming soon)

### Protected Routes

Routes are protected based on authentication and role:

- **Public Routes**: Login, Register, Forgot Password, Reset Password
- **Protected Routes**: Home, Profile, Settings, Messages
- **Admin Routes**: Users Management, Message CRUD operations

### Admin Features

Administrators have additional capabilities:

- **User Management**

  - View all registered users
  - Promote users to admin role
  - Demote admins to user role
  - Cannot modify own role

- **Message Management**
  - Create, read, update, delete system messages
  - Messages used for user-facing notifications
  - Centralized message service integration

## Design Principles

### 1. Type Safety First

- Strict TypeScript mode enabled
- Zod schemas for runtime validation
- No `any` types allowed
- Type-safe API responses

### 2. Responsive by Default

- Mobile-first design approach
- Works seamlessly on all screen sizes
- Touch-friendly UI elements
- Adaptive layouts

### 3. Accessibility

- ARIA labels and roles
- Semantic HTML
- Keyboard navigation support
- Screen reader friendly

### 4. Performance

- Code splitting with React Router
- Lazy loading of components
- React Query caching strategy
- Optimized bundle size

### 5. Consistency

- shadcn/ui design system
- Unified color scheme
- Consistent spacing and typography
- Reusable component patterns

### 6. Security

- httpOnly cookies for tokens
- No token storage in localStorage
- XSS attack prevention
- CSRF protection via sameSite cookies

## API Integration

This frontend communicates with the [express-auth-typescript](https://github.com/yourusername/express-auth-typescript) backend API.

### Key Integration Points

1. **Axios Configuration**

   - Base URL from environment variable
   - `withCredentials: true` for cookie handling
   - Automatic token refresh interceptor
   - Error response normalization

2. **React Query Setup**

   - Stale time: 5 minutes
   - Cache time: 10 minutes
   - Retry logic for failed requests
   - Automatic background refetching

3. **Authentication State**
   - Zustand store for user data
   - Persistent state across page reloads
   - Synchronized with API responses
   - Automatic cleanup on logout

### API Documentation

For detailed API documentation, see:

- [`docs/app-description.md`](docs/app-description.md) - Comprehensive integration guide
- [`docs/openapi.yaml`](docs/openapi.yaml) - OpenAPI specification
- Backend API docs: `http://localhost:5004/docs` (when backend is running)

## Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

The build output will be in the `dist/` directory. Deploy this directory to your hosting service (Vercel, Netlify, AWS S3, etc.).

### Production Environment Variables

Create a `.env.production` file:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Set environment variables in Vercel settings
4. Deploy automatically on push to main branch

### Netlify

1. Connect your Git repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables
5. Deploy

### Docker

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [TanStack Query](https://tanstack.com/query) for excellent data fetching
- Express Auth TypeScript backend team

## Support

For questions or issues:

- Open an issue on GitHub
- Check [docs/app-description.md](docs/app-description.md) for API details
- Review the [OpenAPI specification](docs/openapi.yaml)

---

**Note:** This is a personal learning project and is not accepting contributions or pull requests at this time.

**Built with ❤️ using React, TypeScript, and Vite**

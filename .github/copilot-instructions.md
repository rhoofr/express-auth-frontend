# Copilot Instructions for express-auth-frontend

## Project Overview

- **Type:** React 19 + TypeScript + Vite + TailwindCSS
- **Frontend Only:** This repo is a frontend React project that connects to a RESTful Node.js/Express backend (backend code is not in this repo).
- **Routing:** Uses React Router (`react-router`) for client-side routing.
- **UI Components:** Uses [shadcn/ui](https://ui.shadcn.com/) for component primitives and design system.
- **Structure:** All app code is in `src/`. Entry point is `src/main.tsx`, which renders `App` from `src/App.tsx`.
- **Styling:** Uses TailwindCSS (see `src/index.css`). Animations via `tw-animate-css`.
- **Component Aliases:** Path aliases (e.g., `@/lib/utils`) are set in `tsconfig.json` and `vite.config.ts`.
- **Component Registry:** `components.json` configures UI conventions and aliases (e.g., `ui`, `lib`, `hooks`).

## Guiding Principles

1. **Type Safety First**: Leverage TypeScript's strict mode for all components and utilities
2. **Responsive by Default**: All components must work seamlessly on mobile, tablet, and desktop
3. **Accessibility**: Follow ARIA standards and semantic HTML practices
4. **Performance**: Strive for fast load times and efficient rendering using Vite and React best practices
5. **Consistency**: Use shadcn/ui components and semantic color classes for uniform design
6. **Clean Architecture**: Separate concerns with clear directory structure and path aliases
7. **Design**: Maintain visual harmony and user experience consistency using modern design principles

## Key Workflows

- **Development:**
  - Start dev server: `npm run dev` (Vite, HMR enabled)
  - Build: `npm run build` (TypeScript + Vite)
  - Preview build: `npm run preview`
  - Lint: `npm run lint` (ESLint, see `eslint.config.js`)
- **Type Checking:** Strict TypeScript settings in `tsconfig.app.json` and `tsconfig.node.json`.
- **No backend/server code** in this repo.

## Patterns & Conventions

- **API Communication:**
  - Use **Axios** as the preferred HTTP client to interact with the RESTful Express backend.
  - Place Axios API utilities in `src/lib/` or `src/api/` (if present).
  - Centralize Axios configuration (e.g., base URL, interceptors) in a single file if needed.
- **Routing:** Define routes using React Router in `src/` (typically in `App.tsx` or a dedicated routes file). Use `<Routes>`, `<Route>`, and navigation hooks/components.
- **Component Imports:** Use path aliases (e.g., `@/components/Button`).
- **shadcn/ui:** Import UI primitives from `@/components/ui/` or as configured in `components.json`.
- **Utility Functions:** Place in `src/lib/` (see `utils.ts` for example of Tailwind/clsx merge pattern).
- **Styling:**
  - Use Tailwind utility classes in JSX.
  - Custom CSS variables and themes are defined in `src/index.css`.
  - Dark mode supported via `.dark` class.
- **Icons:** Use `lucide-react` (see `components.json`).
- **React Query:** Use `@tanstack/react-query` for async data (if needed).

## File and code generation rules

- When producing or changing files:
  - Provide the full file content in the PR / assistant response.
  - Add a concise module header comment at top of new files including module name (e.g., `@module services/auth.service`).
  - Don't change or remove existing comments unless they are incorrect or outdated.
  - When giving installs for shadcn don't give the old command that gives me this error "The 'shadcn-ui' package is deprecated. Please use the 'shadcn' package instead". The correct command is like this "npx shadcn@latest add dropdown-menu button". I repeat, don't use "npx shadcn-ui add dropdown-menu button". Understood?
- Avoid the use of `any` type; prefer strict typing.
- Don't generate code that gives TypeScript errors under the current strict settings or linting errors.
- When you import a type make sure it does not give the error "'SomeType' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled."
- When providing "Explanation of Changes" on changes given in chat, be concise and only mention the most relevant details.

## Integration Points

- **Vite Plugins:**
  - `@vitejs/plugin-react` for React HMR
  - `@tailwindcss/vite` for Tailwind integration
- **ESLint:** Flat config, includes React hooks and refresh plugins. See `eslint.config.js` for details.

## Examples

- **Axios API Utility:**

  ```ts
  // src/lib/api.ts
  import axios from 'axios';

  const api = axios.create({
    baseURL: '/api', // adjust as needed
    withCredentials: true,
  });

  export async function getUser() {
    const res = await api.get('/user');
    return res.data;
  }
  ```

- **Route Definition:**

  ```tsx
  // src/App.tsx
  import { Routes, Route } from 'react-router';
  import Home from '@/components/Home';
  import Login from '@/components/Login';

  function App() {
    return (
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
      </Routes>
    );
  }
  ```

- **shadcn/ui Component Usage:**
  ```tsx
  import { Button } from '@/components/ui/button';
  <Button variant='outline'>Click me</Button>;
  ```
- **Utility function:** `src/lib/utils.ts` provides a `cn` function for merging class names with Tailwind.

## Special Notes

- **Do not add Node.js/Express code**—this is a frontend-only project.
- **Follow strict typing and linting rules** as enforced by configs.
- **Update path aliases** in both `tsconfig.*.json` and `vite.config.ts` if new aliases are added.
- **When in doubt about API endpoints or backend contracts, ask for clarification or refer to backend API docs which can be found at: http://localhost:5004/docs.**

---

If any conventions or workflows are unclear, ask the user for clarification or examples from their codebase.

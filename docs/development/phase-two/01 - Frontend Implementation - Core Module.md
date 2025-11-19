# TASK: Frontend Implementation - Core Module & Foundation

#ticobot #phase-two #frontend

## Description

Implement the TicoBot frontend foundation using Next.js 16 App Router with a feature-based modular architecture (Level 3). This task focuses on:
- Project setup and configuration
- Core module implementation (design system, shared components)
- Folder structure following the architecture
- App Router pages scaffolding
- i18n setup for Spanish

**Architecture Reference**: `docs/development/requirements/architecture/05-frontend-architecture.md`

## Why?

A solid frontend foundation ensures:
- **Consistency**: Shared design system components used across all modules
- **Scalability**: Feature modules can be added incrementally
- **Developer Experience**: Clear structure, TypeScript types, linting
- **Performance**: Optimized Next.js configuration
- **Accessibility**: WCAG 2.1 Level AA compliance from the start

## Deliverables

### 1. Project Setup

- [ ] Initialize Next.js 16 project with App Router
  ```bash
  pnpm create next-app@latest frontend --typescript --tailwind --app --src-dir
  ```
- [ ] Configure TypeScript (`tsconfig.json`)
- [ ] Set up TailwindCSS with custom theme
- [ ] Configure ESLint + Prettier
- [ ] Add husky + lint-staged for git hooks
- [ ] Configure path aliases (`@/`, `@modules/`, etc.)

### 2. Folder Structure

Create the complete modular structure:

```
frontend/
├── public/
│   ├── images/
│   │   ├── party-logos/
│   │   └── icons/
│   └── fonts/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (root)/
│   │   │   ├── page.tsx          # Home
│   │   │   └── layout.tsx
│   │   ├── compare/
│   │   │   └── page.tsx
│   │   ├── chat/
│   │   │   └── page.tsx
│   │   ├── explorer/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── not-found.tsx
│   │   └── layout.tsx            # Root layout
│   ├── assets/
│   │   └── styles/
│   │       └── globals.css
│   ├── modules/
│   │   └── core/
│   │       ├── components/
│   │       │   ├── layout/
│   │       │   └── feedback/
│   │       ├── design-system/
│   │       ├── hooks/
│   │       ├── lib/
│   │       └── utils/
│   ├── config/
│   │   ├── env.ts
│   │   ├── routes.ts
│   │   └── constants.ts
│   ├── i18n/
│   │   ├── es.json
│   │   └── locales.ts
│   └── types/
│       └── global.d.ts
├── .env.local
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 3. Core Module - Design System Components

Implement all design system components using shadcn/ui as base:

- [ ] **Button**
  - Variants: primary, secondary, ghost, link
  - Sizes: sm, md, lg
  - States: default, hover, active, disabled, loading
  - TypeScript props interface

- [ ] **Input**
  - Types: text, search, email, password
  - States: default, focus, error, disabled
  - With label, helper text, error message

- [ ] **Select**
  - Single select
  - Multi-select
  - With search/filter
  - Keyboard navigation

- [ ] **Card**
  - Header, body, footer sections
  - Variants: default, bordered, elevated
  - Responsive

- [ ] **Modal/Dialog**
  - Backdrop with click-outside to close
  - ESC key to close
  - Focus trap
  - Accessible (ARIA)

- [ ] **Table**
  - Sortable columns
  - Pagination
  - Row selection
  - Responsive (horizontal scroll on mobile)

- [ ] **Badge**
  - Variants: default, success, warning, error, info
  - Sizes: sm, md, lg

- [ ] **Tooltip**
  - Positions: top, right, bottom, left
  - Accessible (ARIA)

- [ ] **Loading Spinner**
  - Sizes: sm, md, lg
  - Colors: primary, accent, white

- [ ] **Toast Notifications**
  - Types: success, error, warning, info
  - Auto-dismiss after 5s
  - Stacked notifications
  - Close button

### 4. Core Module - Layout Components

- [ ] **Header**
  - Logo
  - Navigation links (Home, Comparar, Chat, Explorar)
  - Mobile: Hamburger menu
  - Desktop: Horizontal nav
  - Active route indicator

- [ ] **Footer**
  - Credits
  - Links (TSE website, GitHub)
  - Version number

- [ ] **Page Layout Wrapper**
  - Max-width container
  - Padding/margins
  - Responsive

### 5. Core Module - Hooks

- [ ] **useBreakpoint**
  ```typescript
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  ```

- [ ] **useLocalStorage**
  ```typescript
  const [value, setValue] = useLocalStorage('key', defaultValue);
  ```

- [ ] **useDebounce**
  ```typescript
  const debouncedValue = useDebounce(value, 500);
  ```

### 6. Core Module - Utils

- [ ] **cn() - className merger**
  ```typescript
  import { cn } from '@/modules/core/utils/cn';
  cn('text-red-500', condition && 'font-bold');
  ```

- [ ] **format() - Formatting utilities**
  ```typescript
  formatDate(date, 'DD/MM/YYYY')
  formatNumber(1234567, 'es-CR')
  formatFileSize(1024000) // "1 MB"
  ```

- [ ] **validation() - Form validation**
  ```typescript
  validateEmail(email)
  validateRequired(value)
  validateMinLength(value, 3)
  ```

### 7. Configuration Files

- [ ] **env.ts** - Environment variables with validation
  ```typescript
  export const env = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    // ... validate all env vars
  };
  ```

- [ ] **routes.ts** - Route definitions
  ```typescript
  export const routes = {
    home: '/',
    compare: '/compare',
    chat: '/chat',
    explorer: '/explorer',
    admin: '/admin',
  };
  ```

- [ ] **constants.ts** - App constants
  ```typescript
  export const PARTIES = [...];
  export const MAX_COMPARISON_PARTIES = 4;
  ```

### 8. Internationalization (i18n)

- [ ] Create Spanish translations file (`i18n/es.json`)
  ```json
  {
    "nav.home": "Inicio",
    "nav.compare": "Comparar",
    "nav.chat": "Chat",
    "nav.explorer": "Explorar",
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.search": "Buscar",
    ...
  }
  ```

- [ ] i18n utility functions
  ```typescript
  const t = useTranslation();
  t('nav.home') // "Inicio"
  ```

### 9. App Router Pages (Scaffolding)

Create basic page structure for all routes:

- [ ] **Home Page** (`app/(root)/page.tsx`)
  - Hero section
  - Quick search placeholder
  - Party grid placeholder

- [ ] **Compare Page** (`app/compare/page.tsx`)
  - Comparison view placeholder
  - "Coming soon" message

- [ ] **Chat Page** (`app/chat/page.tsx`)
  - Chat interface placeholder
  - "Coming soon" message

- [ ] **Explorer Page** (`app/explorer/page.tsx`)
  - Document grid placeholder
  - "Coming soon" message

- [ ] **Admin Page** (`app/admin/page.tsx`)
  - Dashboard placeholder
  - "Coming soon" message

- [ ] **404 Page** (`app/not-found.tsx`)
  - Custom 404 design

- [ ] **Root Layout** (`app/layout.tsx`)
  - HTML lang="es"
  - Metadata (title, description)
  - Google Fonts (Inter)
  - Header + Footer
  - Toast container

### 10. TailwindCSS Configuration

- [ ] Custom theme with design system colors
  ```typescript
  theme: {
    extend: {
      colors: {
        primary: { /* ... */ },
        accent: { /* ... */ },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        // ...
      },
    },
  }
  ```

- [ ] Custom utilities if needed
- [ ] Responsive breakpoints

### 11. Testing Setup

- [ ] Install Vitest + React Testing Library
- [ ] Configure test environment
- [ ] Example component test
- [ ] Example hook test
- [ ] Run tests in CI (GitHub Actions)

### 12. Accessibility Setup

- [ ] Install `eslint-plugin-jsx-a11y`
- [ ] Configure accessibility linting rules
- [ ] Add `jest-axe` for accessibility testing
- [ ] Document accessibility patterns

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5+
- **Styling**: TailwindCSS 3+
- **Components**: shadcn/ui (customized)
- **State**: Zustand (for later modules)
- **Data Fetching**: SWR (for later modules)
- **Forms**: React Hook Form (for later modules)
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier
- **Package Manager**: pnpm

## Design System Reference

Use Figma mockups from Issue #9 as reference for:
- Colors (neutral palette)
- Typography (Inter font)
- Spacing scale
- Component variants
- Responsive behavior

## Related Documentation

- **Architecture**: `docs/development/requirements/architecture/05-frontend-architecture.md`
- **Figma Mockups**: GitHub Issue #9
- **Backend API**: To be defined (mock initially)

## Dependencies

- #9 Frontend Design & UI/UX Planning (Figma mockups inform implementation)
- Backend API (can be mocked initially)

## Testing Checklist

- [ ] All components render without errors
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with no warnings
- [ ] All components are keyboard accessible
- [ ] All components have proper ARIA labels
- [ ] Color contrast ratios meet WCAG AA (use axe DevTools)
- [ ] Components work on mobile, tablet, desktop
- [ ] Unit tests pass for all utilities and hooks
- [ ] Lighthouse accessibility score > 90

## Next Steps

After Phase 2.1 completion, proceed to:
- **Phase 2.2**: Documents Module Implementation
- **Phase 2.3**: Search Module Implementation
- **Phase 2.4**: Comparison Module Implementation
- **Phase 2.5**: Chat Module Implementation
- **Phase 2.6**: Admin Module Implementation

## Success Criteria

- [ ] Project runs locally without errors (`pnpm dev`)
- [ ] All core components implemented and documented
- [ ] All pages scaffolded with basic layout
- [ ] TypeScript strict mode enabled, no errors
- [ ] Linting configured and passing
- [ ] Responsive on all breakpoints (320px, 768px, 1024px+)
- [ ] Accessibility audit passes (Lighthouse > 90)
- [ ] Spanish i18n working for all UI text
- [ ] Unit tests written and passing
- [ ] Ready for feature module development

## Notes

- Use shadcn/ui as base, customize with TicoBot design system
- Focus on accessibility from the start (keyboard nav, ARIA, contrast)
- Keep components simple and reusable
- Mock API responses until backend is ready
- Document component props and usage
- Spanish-first: All UI text in Spanish from the start

## GitHub Issue

- **Issue**: [#12](https://github.com/juanpredev13/ticobot/issues/12)

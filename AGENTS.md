# AGENTS.md

This file provides guidance to agentic coding agents working with the TicoBot codebase.

## Project Structure

TicoBot is a pnpm monorepo with TypeScript:
- `backend/` - Node.js API and data processing (ES modules)
- `frontend/` - Next.js 16 app router application  
- `shared/` - Shared TypeScript types and interfaces
- `docs/` - Project documentation organized by phase

## Build & Development Commands

### Root Level Commands
```bash
# Install dependencies across all packages
pnpm install

# Run both backend and frontend in parallel
pnpm dev

# Build all packages
pnpm build

# Type check all packages
pnpm type-check

# Test all packages
pnpm test

# Validate (type-check + build)
pnpm validate

# Clean build artifacts
pnpm clean
```

### Package-Specific Commands
```bash
# Backend development
pnpm --filter backend dev
pnpm --filter backend test
pnpm --filter backend type-check

# Frontend development  
pnpm --filter frontend dev
pnpm --filter frontend build
pnpm --filter frontend type-check

# Shared package
pnpm --filter shared build
pnpm --filter shared test
```

### Testing Single Files
```bash
# Backend single test
pnpm --filter backend test -- path/to/test.spec.ts

# With coverage
pnpm --filter backend test:coverage -- path/to/test.spec.ts

# UI mode
pnpm --filter backend test:ui
```

### Scripts & Utilities
Backend has many utility scripts:
- `test:ingestion` - Test PDF ingestion pipeline
- `admin:create` - Create admin user
- `audit:database` - Database health check
- Various analysis and migration scripts in `scripts/`

## Code Style Guidelines

### TypeScript Configuration
- **Backend**: ES2022, NodeNext modules, strict mode enabled
- **Frontend**: ES6+, ESNext modules, JSX with React
- **Shared**: ES2022, ESNext modules, strict mode enabled

### Import Patterns
```typescript
// Use .js extensions for ES modules in backend/shared
import { env } from '../config/env.js';
import type { JWTPayload } from '../types/common.js';

// Frontend uses Next.js path aliases
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

### Naming Conventions
- **Files**: kebab-case (e.g., `password-utils.ts`, `jwt-utils.ts`)
- **Classes**: PascalCase (e.g., `ProviderFactory`, `RAGPipeline`)
- **Functions/Variables**: camelCase (e.g., `generateAccessToken`, `verifyToken`)
- **Interfaces**: Prefix with `I` (e.g., `ILLMProvider`, `IVectorStore`)
- **Types**: PascalCase (e.g., `LLMMessage`, `GenerationOptions`)

### Error Handling
```typescript
// Always validate required configuration
if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured');
}

// Use specific error types with try/catch
try {
  const decoded = jwt.verify(token, secret);
  return decoded;
} catch (error) {
  if (error instanceof jwt.TokenExpiredError) {
    throw new Error('Token has expired');
  }
  if (error instanceof jwt.JsonWebTokenError) {
    throw new Error('Invalid token');
  }
  throw new Error('Token verification failed');
}
```

### Interface Design (Ports & Adapters)
```typescript
// Define clear contracts with JSDoc
export interface ILLMProvider {
  generateCompletion(
    messages: LLMMessage[],
    options?: GenerationOptions
  ): Promise<LLMResponse>;
  
  generateStreamingCompletion(
    messages: LLMMessage[], 
    options?: GenerationOptions
  ): AsyncIterableIterator<string>;
  
  getContextWindow(): number;
  getModelName(): string;
  supportsFunctionCalling(): boolean;
}
```

### React/Next.js Patterns
- Use Server Components by default
- Client components marked with `'use client'`
- Styling with TailwindCSS and `cn()` utility
- Forms with React Hook Form + Zod validation
- Data fetching with TanStack Query

### Type Safety
- Strict TypeScript enabled everywhere
- Use `type` imports for type-only imports
- Prefer interfaces for object shapes that might be extended
- Use Zod for runtime validation

### Package Management
- **Package Manager**: pnpm (version 10.22.0+)
- **Node Version**: 20.0.0+
- Always use workspace filters for package-specific commands
- Shared types imported from `@ticobot/shared`

## Architecture Notes

The codebase follows Clean Architecture with:
- **Domain Layer**: Business logic in shared types/interfaces
- **Application Layer**: Use cases for ingestion, search, chat
- **Infrastructure Layer**: Provider implementations (LLM, vector stores, databases)
- **Presentation Layer**: API routes and React components

All providers implement their respective interfaces, enabling runtime swapping without modifying business logic.
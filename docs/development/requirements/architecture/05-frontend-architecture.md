# Frontend Architecture - Feature-Based Modular Structure

## Overview

TicoBot's frontend follows a **feature-based modular architecture** (Level 3), organizing code by business features/modules rather than technical layers. This approach provides clear boundaries for different aspects of the application and makes it easy to locate, modify, or remove features.

**Framework**: Next.js 16 App Router + TypeScript
**Styling**: TailwindCSS
**Component Library**: shadcn/ui (customized)
**State Management**: React Context + Zustand
**Data Fetching**: SWR / React Query

---

## Project Structure

```
frontend/
├── public/
│   ├── images/
│   │   ├── party-logos/          # Political party logos
│   │   └── icons/                # Custom icons
│   └── fonts/                    # Custom fonts (Spanish characters)
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (root)/
│   │   │   ├── page.tsx          # Home page
│   │   │   └── layout.tsx        # Root layout
│   │   ├── compare/
│   │   │   └── page.tsx          # Comparison page
│   │   ├── chat/
│   │   │   └── page.tsx          # Chat/RAG page
│   │   ├── explorer/
│   │   │   └── page.tsx          # Document explorer
│   │   ├── admin/
│   │   │   └── page.tsx          # Admin dashboard
│   │   └── api/                  # API routes (if needed)
│   ├── assets/
│   │   ├── images/
│   │   └── styles/
│   │       └── globals.css       # Global styles
│   ├── modules/
│   │   ├── core/                 # Shared/common module
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   └── Navigation.tsx
│   │   │   │   └── feedback/
│   │   │   │       ├── Loading.tsx
│   │   │   │       ├── ErrorBoundary.tsx
│   │   │   │       └── Toast.tsx
│   │   │   ├── design-system/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── Tooltip.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useBreakpoint.ts
│   │   │   │   ├── useLocalStorage.ts
│   │   │   │   └── useDebounce.ts
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts
│   │   │   │   └── constants.ts
│   │   │   └── utils/
│   │   │       ├── cn.ts            # className utility
│   │   │       ├── format.ts
│   │   │       └── validation.ts
│   │   ├── documents/            # Document management
│   │   │   ├── components/
│   │   │   │   ├── DocumentCard.tsx
│   │   │   │   ├── DocumentGrid.tsx
│   │   │   │   ├── DocumentList.tsx
│   │   │   │   ├── DocumentDetail.tsx
│   │   │   │   ├── PartyBadge.tsx
│   │   │   │   └── PDFViewer.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useDocuments.ts
│   │   │   │   ├── useDocument.ts
│   │   │   │   └── useDocumentFilters.ts
│   │   │   ├── services/
│   │   │   │   └── documents-api.ts
│   │   │   ├── states/
│   │   │   │   └── documents-store.ts
│   │   │   ├── types/
│   │   │   │   └── document.types.ts
│   │   │   └── utils/
│   │   │       ├── document-filters.ts
│   │   │       └── party-colors.ts
│   │   ├── search/               # Search & filtering
│   │   │   ├── components/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── SearchFilters.tsx
│   │   │   │   ├── FilterSidebar.tsx
│   │   │   │   ├── SearchResults.tsx
│   │   │   │   ├── ResultCard.tsx
│   │   │   │   └── Pagination.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSearch.ts
│   │   │   │   ├── useSearchFilters.ts
│   │   │   │   └── useSearchHistory.ts
│   │   │   ├── services/
│   │   │   │   └── search-api.ts
│   │   │   ├── states/
│   │   │   │   └── search-store.ts
│   │   │   ├── types/
│   │   │   │   └── search.types.ts
│   │   │   └── utils/
│   │   │       ├── search-parser.ts
│   │   │       └── highlight.ts
│   │   ├── comparison/           # Comparative analysis
│   │   │   ├── components/
│   │   │   │   ├── ComparisonView.tsx
│   │   │   │   ├── PartySelector.tsx
│   │   │   │   ├── ComparisonTable.tsx
│   │   │   │   ├── ComparisonCard.tsx
│   │   │   │   ├── DifferenceHighlight.tsx
│   │   │   │   └── SourceCitation.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useComparison.ts
│   │   │   │   ├── usePartySelection.ts
│   │   │   │   └── useComparisonSync.ts
│   │   │   ├── services/
│   │   │   │   └── comparison-api.ts
│   │   │   ├── states/
│   │   │   │   └── comparison-store.ts
│   │   │   ├── types/
│   │   │   │   └── comparison.types.ts
│   │   │   └── utils/
│   │   │       ├── comparison-logic.ts
│   │   │       └── scroll-sync.ts
│   │   ├── chat/                 # RAG Chat interface
│   │   │   ├── components/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── ChatHistory.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── QuestionInput.tsx
│   │   │   │   ├── AnswerDisplay.tsx
│   │   │   │   ├── SourcesList.tsx
│   │   │   │   ├── TypingIndicator.tsx
│   │   │   │   └── ModelSelector.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useChat.ts
│   │   │   │   ├── useChatHistory.ts
│   │   │   │   ├── useChatStream.ts
│   │   │   │   └── useModelSelection.ts
│   │   │   ├── services/
│   │   │   │   └── chat-api.ts
│   │   │   ├── states/
│   │   │   │   └── chat-store.ts
│   │   │   ├── types/
│   │   │   │   └── chat.types.ts
│   │   │   └── utils/
│   │   │       ├── message-formatter.ts
│   │   │       └── citation-parser.ts
│   │   └── admin/                # Admin dashboard
│   │       ├── components/
│   │       │   ├── Dashboard.tsx
│   │       │   ├── HealthMetrics.tsx
│   │       │   ├── IngestionStatus.tsx
│   │       │   ├── ErrorLogs.tsx
│   │       │   ├── UsageStats.tsx
│   │       │   ├── ProviderConfig.tsx
│   │       │   ├── ManualIngestion.tsx
│   │       │   └── SystemAlerts.tsx
│   │       ├── hooks/
│   │       │   ├── useSystemHealth.ts
│   │       │   ├── useIngestionStatus.ts
│   │       │   └── useProviderConfig.ts
│   │       ├── services/
│   │       │   ├── admin-api.ts
│   │       │   └── monitoring.ts
│   │       ├── states/
│   │       │   └── admin-store.ts
│   │       ├── types/
│   │       │   └── admin.types.ts
│   │       └── utils/
│   │           ├── metrics-formatter.ts
│   │           └── log-parser.ts
│   ├── config/
│   │   ├── env.ts                # Environment config
│   │   ├── routes.ts             # Route definitions
│   │   └── providers.ts          # Provider configs
│   ├── i18n/                     # Internationalization
│   │   ├── es.json               # Spanish translations
│   │   └── locales.ts
│   └── types/
│       └── global.d.ts           # Global TypeScript types
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Module Breakdown

### 1. Core Module

**Purpose**: Shared components, design system, utilities, and hooks used across all modules.

**Key Components**:
- **Layout**: Header, Footer, Navigation
- **Design System**: Button, Input, Card, Modal, Table, Select, Badge, Tooltip
- **Feedback**: Loading, ErrorBoundary, Toast

**Key Hooks**:
- `useBreakpoint()` - Responsive breakpoint detection
- `useLocalStorage()` - Persist data to localStorage
- `useDebounce()` - Debounce user input

**Key Utils**:
- `cn()` - Merge Tailwind classes
- `format()` - Date, number, currency formatting
- `validation()` - Form validation helpers

**When to use**: For any shared functionality needed by multiple modules.

---

### 2. Documents Module

**Purpose**: Manage government plan documents (PDFs), display metadata, and enable exploration.

**Key Features**:
- Display grid/list of all 20 political party documents
- Show document metadata (party, candidate, pages, file size)
- Filter by party, year, status
- Download original PDFs
- View document details

**Key Components**:
- `DocumentCard` - Display document with party logo, metadata
- `DocumentGrid` - Grid layout of document cards
- `DocumentList` - List layout with more details
- `DocumentDetail` - Full document page with metadata
- `PartyBadge` - Display party name with neutral color
- `PDFViewer` - Embed PDF viewer

**API Calls**:
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/download` - Download PDF

**State Management**:
```typescript
interface DocumentsStore {
  documents: Document[];
  filters: DocumentFilters;
  isLoading: boolean;
  error: string | null;
  setFilters: (filters: DocumentFilters) => void;
  fetchDocuments: () => Promise<void>;
}
```

---

### 3. Search Module

**Purpose**: Semantic search across all government plans with filtering capabilities.

**Key Features**:
- Full-text and semantic search
- Filter by party, topic, page
- Search history
- Highlighted search results
- Pagination

**Key Components**:
- `SearchBar` - Main search input with autocomplete
- `SearchFilters` - Advanced filter controls
- `FilterSidebar` - Collapsible sidebar with filters
- `SearchResults` - Display search results
- `ResultCard` - Individual result with highlighted text
- `Pagination` - Navigate through results

**API Calls**:
- `POST /api/search` - Execute search query
- `GET /api/search/suggestions` - Autocomplete suggestions

**State Management**:
```typescript
interface SearchStore {
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  totalResults: number;
  currentPage: number;
  isSearching: boolean;
  history: string[];
  setQuery: (query: string) => void;
  search: () => Promise<void>;
}
```

---

### 4. Comparison Module

**Purpose**: Compare proposals from 2-4 political parties side-by-side.

**Key Features**:
- Select 2-4 parties to compare
- Side-by-side comparison view
- Highlight differences
- Filter by topic
- Synchronized scrolling
- Export comparison

**Key Components**:
- `ComparisonView` - Main comparison interface
- `PartySelector` - Choose parties to compare (max 4)
- `ComparisonTable` - Tabular comparison view
- `ComparisonCard` - Card-based comparison
- `DifferenceHighlight` - Highlight text differences
- `SourceCitation` - Show sources with page numbers

**API Calls**:
- `POST /api/compare` - Get comparison data
- `POST /api/compare/export` - Export comparison to PDF

**State Management**:
```typescript
interface ComparisonStore {
  selectedParties: string[];        // Max 4 parties
  topic: string | null;
  comparisonData: ComparisonResult;
  isLoading: boolean;
  addParty: (partyId: string) => void;
  removeParty: (partyId: string) => void;
  setTopic: (topic: string) => void;
  fetchComparison: () => Promise<void>;
}
```

**Special Features**:
- **Scroll Sync**: When user scrolls one column, others scroll too
- **Difference Detection**: Automatically highlight where parties differ
- **Topic Filtering**: Only show sections about specific topics (e.g., "educación", "salud")

---

### 5. Chat Module

**Purpose**: RAG-powered chat interface for asking questions about government plans.

**Key Features**:
- Natural language questions
- Streaming responses
- Source citations with every answer
- Chat history
- Model selection (OpenAI, Claude, Gemini)
- "I don't know" handling

**Key Components**:
- `ChatInterface` - Main chat UI
- `ChatHistory` - Display conversation
- `MessageBubble` - Individual message (user/assistant)
- `QuestionInput` - User input with suggestions
- `AnswerDisplay` - Format assistant answers
- `SourcesList` - Show sources used for answer
- `TypingIndicator` - Show when AI is thinking
- `ModelSelector` - Choose LLM provider

**API Calls**:
- `POST /api/chat/message` - Send message, get response
- `POST /api/chat/stream` - Streaming response
- `GET /api/chat/sessions/:id` - Get chat history

**State Management**:
```typescript
interface ChatStore {
  sessionId: string | null;
  messages: Message[];
  isStreaming: boolean;
  currentModel: string;
  sendMessage: (content: string) => Promise<void>;
  streamMessage: (content: string) => AsyncGenerator<string>;
  setModel: (model: string) => void;
  clearHistory: () => void;
}
```

**Special Features**:
- **Streaming**: Real-time token streaming like ChatGPT
- **Sources**: Always show which party plans were used
- **Groundedness**: Never hallucinate, only use provided context
- **Model Switching**: Change LLM provider mid-conversation

---

### 6. Admin Module

**Purpose**: Monitor system health, manage ingestion, configure providers, view usage stats.

**Key Features**:
- System health dashboard
- Ingestion status monitoring
- Error logs
- Usage statistics (queries, costs)
- Manual re-ingestion
- Provider configuration

**Key Components**:
- `Dashboard` - Overview dashboard
- `HealthMetrics` - CPU, memory, API status
- `IngestionStatus` - Progress of PDF ingestion
- `ErrorLogs` - System errors and warnings
- `UsageStats` - Query counts, token usage, costs
- `ProviderConfig` - Configure LLM/vector providers
- `ManualIngestion` - Trigger PDF re-ingestion
- `SystemAlerts` - Critical alerts

**API Calls**:
- `GET /api/admin/health` - System health
- `GET /api/admin/ingestion` - Ingestion status
- `GET /api/admin/logs` - Error logs
- `GET /api/admin/stats` - Usage statistics
- `POST /api/admin/ingest` - Trigger ingestion
- `PUT /api/admin/providers` - Update provider config

**State Management**:
```typescript
interface AdminStore {
  health: SystemHealth;
  ingestionStatus: IngestionStatus;
  logs: ErrorLog[];
  stats: UsageStats;
  isLoading: boolean;
  refreshHealth: () => Promise<void>;
  triggerIngestion: (pdfUrls: string[]) => Promise<void>;
  updateProviderConfig: (config: ProviderConfig) => Promise<void>;
}
```

**Access Control**: Protected route, requires authentication (future feature).

---

## Design System

### Color Palette (Neutral & Non-Partisan)

```typescript
// Tailwind config
colors: {
  // Primary (neutral blue-gray)
  primary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  // Accent (neutral teal for actions)
  accent: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
}
```

**Design Principle**: Avoid colors associated with Costa Rican political parties. Use neutral grays, blues, and teals.

---

### Typography (Spanish-Optimized)

```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Courier New', 'monospace'],
}
```

**Requirements**:
- Support accented characters: á, é, í, ó, ú, ñ, ¿, ¡
- Clear hierarchy: h1-h6, body, caption
- Readable at all sizes (mobile to desktop)

---

### Spacing & Layout

```typescript
spacing: {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
}

screens: {
  sm: '640px',   // Mobile
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px',
}
```

---

## State Management Strategy

### Local Component State
**Use for**: UI-only state (modals, dropdowns, form inputs)
**Tool**: React `useState`, `useReducer`

### Module State
**Use for**: Feature-specific state (search results, chat messages)
**Tool**: Zustand stores within each module

### Global State
**Use for**: App-wide state (user preferences, theme, selected providers)
**Tool**: React Context or Zustand

### Server State
**Use for**: Data from API (documents, search results)
**Tool**: SWR or React Query for caching, revalidation

---

## Routing Structure

```typescript
// app/ directory structure (App Router)
app/
├── (root)/
│   ├── page.tsx              // Home: /
│   └── layout.tsx            // Root layout
├── compare/
│   └── page.tsx              // Comparison: /compare
├── chat/
│   └── page.tsx              // Chat: /chat
├── explorer/
│   └── page.tsx              // Explorer: /explorer
├── admin/
│   └── page.tsx              // Admin: /admin (protected)
└── not-found.tsx             // 404 page
```

---

## Accessibility (WCAG 2.1 Level AA)

### Keyboard Navigation
- All interactive elements accessible via keyboard
- Logical tab order
- Skip navigation links
- Focus indicators visible

### Screen Readers
- Semantic HTML (`<nav>`, `<main>`, `<article>`)
- ARIA labels where needed
- Alt text for images
- Descriptive link text

### Color Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Don't rely on color alone

### Touch Targets
- Minimum 44×44px touch targets
- Adequate spacing between interactive elements

---

## Performance Considerations

### Code Splitting
- Each module is lazy-loaded
- Route-based code splitting (Next.js automatic)
- Component-level lazy loading for large components

### Image Optimization
- Next.js `<Image>` component
- WebP format with fallbacks
- Lazy loading images below fold

### Bundle Size
- Tree-shaking unused code
- Analyze bundle with `next/bundle-analyzer`
- Keep core bundle < 200KB gzipped

### Caching Strategy
- SWR for API data caching
- Cache search results (5 min TTL)
- Offline support for chat history

---

## Advantages of This Structure

✅ **Feature Isolation**: Each module is self-contained, easy to understand and modify
✅ **Scalability**: Add new modules without affecting existing ones
✅ **Team Collaboration**: Different developers can work on different modules
✅ **Code Reusability**: Core module provides shared functionality
✅ **Business Alignment**: Modules map to real-world features (search, chat, comparison)
✅ **Maintainability**: Easy to locate and fix bugs within a specific feature
✅ **Testing**: Each module can be tested independently

---

## Example: Adding a New Module

Let's say we want to add a "Favorites" feature:

```
modules/
└── favorites/
    ├── components/
    │   ├── FavoritesList.tsx
    │   ├── FavoriteButton.tsx
    │   └── FavoritesModal.tsx
    ├── hooks/
    │   ├── useFavorites.ts
    │   └── useFavoriteToggle.ts
    ├── services/
    │   └── favorites-api.ts
    ├── states/
    │   └── favorites-store.ts
    ├── types/
    │   └── favorites.types.ts
    └── utils/
        └── favorites-sync.ts
```

Everything related to favorites is in one place!

---

## Next Steps

After defining this frontend architecture:
1. **Task 1.9**: Create Figma mockups following this structure
2. **Phase 2**: Implement modules incrementally
3. **Phase 3**: Integrate with backend API
4. **Phase 4**: Usability testing and refinement

# TASK: Frontend Design & UI/UX Planning (Figma Mockups)

#ticobot #backlog

## Description

Design the complete user experience and create **Figma mockups** for all critical screens. This is a pure design task focused on UI/UX, visual design, and user flows.

**Note**: Frontend implementation is tracked separately (see Next Steps).

Deliverables:
- User-facing interfaces (search, compare, chat)
- Admin dashboard
- Mobile-responsive layouts (3 breakpoints)
- Spanish language UI text
- Accessibility annotations (WCAG 2.1 Level AA)

## Why?

A well-designed frontend ensures:
- Users can easily accomplish their goals (compare proposals, get answers)
- Political neutrality is maintained in visual design
- Mobile users have equal access
- Spanish-speaking audience feels native experience
- Accessibility standards are met
- Development team has clear design specification

## Deliverables

### Figma Mockups
- [ ] **Home/Landing Page**
  - Hero section explaining the platform
  - Quick search bar
  - Featured comparisons or popular topics
  - List of all 20 political parties
- [ ] **Comparative Search Interface** (PRIMARY USE CASE)
  - Search/filter controls (by party, topic, keyword)
  - Side-by-side comparison view (2-4 parties)
  - Highlighted relevant text passages
  - Source citations with page numbers
  - Links to original PDFs
- [ ] **Chat/Q&A Interface (RAG)**
  - Question input field
  - Chat history
  - Answer display with sources
  - Source citations (party, page, PDF link)
  - "I don't know" state when no evidence
- [ ] **Document Explorer**
  - Grid/list of all government plans
  - Filter by party
  - Document metadata (party, candidate, pages)
  - Download original PDF button
  - Ingestion status indicator
- [ ] **Admin Dashboard**
  - System health metrics
  - Ingestion status monitoring
  - Error logs
  - Usage statistics (queries, costs)
  - Manual re-ingestion triggers
  - Provider configuration panel

### Design System Documentation
- [ ] **Color Palette**
  - Neutral, non-partisan colors
  - Ensure no party colors dominate
  - Accessibility contrast ratios (WCAG AA)
- [ ] **Typography**
  - Spanish language font selection
  - Support for accented characters (á, é, í, ó, ú, ñ, ¿, ¡)
  - Clear hierarchy (headings, body, captions)
- [ ] **Spacing & Layout System**
  - Grid system
  - Spacing scale (4px, 8px, 16px, etc.)
  - Container widths
- [ ] **Components Library**
  - Buttons (primary, secondary, ghost)
  - Input fields (search, text, select)
  - Cards (party card, result card)
  - Tables (comparison table)
  - Navigation (header, footer)
  - Modals/dialogs

### User Flow Diagrams
- [ ] User journey: Finding and comparing proposals
- [ ] User journey: Asking questions and getting answers
- [ ] User journey: Exploring all government plans
- [ ] Admin journey: Monitoring system and triggering re-ingestion

### Responsive Design
- [ ] Mobile layouts (320px - 768px)
- [ ] Tablet layouts (768px - 1024px)
- [ ] Desktop layouts (1024px+)
- [ ] Touch-friendly interaction patterns

### Accessibility (WCAG 2.1 Level AA)
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Color contrast compliance
- [ ] Focus indicators
- [ ] Alternative text for images
- [ ] Semantic HTML structure

### Spanish Language UI
- [ ] All interface text in Spanish
- [ ] Navigation labels
- [ ] Button text
- [ ] Form labels and placeholders
- [ ] Error messages
- [ ] Empty states
- [ ] Loading states

## Related Documentation

- `docs/development/requirements/02-core-features-and-capabilities.md` - Feature definitions
- `docs/development/requirements/01-project-goals-and-objectives.md` - Target audience
- `CLAUDE.md` - Tech stack (Next.js, TailwindCSS)

## Design Principles

### Political Neutrality
- **No party bias**: Equal visual treatment for all parties
- **Neutral colors**: Avoid colors associated with specific parties
- **Equal prominence**: All parties shown with same importance
- **Objective presentation**: No editorializing in UI

### Spanish Language First
- **Native Spanish**: Not translated from English
- **Costa Rican context**: Use local terminology
- **Clear communication**: Simple, direct language

### Accessibility
- **Inclusive design**: Usable by everyone regardless of ability
- **Keyboard first**: Don't rely only on mouse/touch
- **Screen reader friendly**: Semantic HTML, ARIA labels
- **High contrast**: Readable by vision-impaired users

### Mobile Responsive
- **Mobile first**: Design for mobile, enhance for desktop
- **Touch targets**: Minimum 44px touch target size
- **Performance**: Fast loading on slow connections

## Tools & Resources

### Design Tools
- **Figma** (primary design tool)
- **Contrast Checker** for accessibility
- **Spanish language style guide**

### Inspiration
- Government transparency platforms
- Election information websites
- Comparison tools (e.g., product comparison sites)

### Design References
- Costa Rica government websites (TSE, gobierno.cr)
- Spanish-language web design best practices
- Accessible design patterns (ARIA Authoring Practices)

## Testing

- [ ] Design reviewed with target users (Spanish speakers)
- [ ] Accessibility audit completed
- [ ] Mobile usability tested
- [ ] Political neutrality validated
- [ ] All user flows walkthrough completed

## Dependencies

- Task 1.1: Requirements & Scope Definition (completed)
- Task 1.3: System Architecture Overview (defines data available for UI)

## Next Steps

After completion, proceed to:
- **Frontend Implementation**: Tracked separately in GitHub issue (Phase 2.1)
- Component development following modular architecture
- Integration with backend API
- Usability testing with target users

## Related Issues

- **Design (this task)**: GitHub Issue #9
- **Frontend Implementation**: GitHub Issue #12 (Phase 2.1)

## Implementation Notes

### Component Hierarchy (Preliminary)

```
App
├─ Layout
│   ├─ Header
│   │   ├─ Logo
│   │   ├─ Navigation
│   │   └─ LanguageSelector (future)
│   └─ Footer
├─ Pages
│   ├─ HomePage
│   │   ├─ Hero
│   │   ├─ QuickSearch
│   │   └─ PartyGrid
│   ├─ ComparePage
│   │   ├─ SearchFilters
│   │   ├─ PartySelector
│   │   ├─ ComparisonView
│   │   └─ SourceCitations
│   ├─ ChatPage
│   │   ├─ QuestionInput
│   │   ├─ ChatHistory
│   │   ├─ AnswerDisplay
│   │   └─ Sources
│   ├─ ExplorerPage
│   │   ├─ DocumentGrid
│   │   ├─ FilterSidebar
│   │   └─ DocumentCard
│   └─ AdminPage
│       ├─ HealthMetrics
│       ├─ IngestionStatus
│       ├─ ErrorLogs
│       └─ ProviderConfig
└─ Components (shared)
    ├─ Button
    ├─ Input
    ├─ Card
    ├─ Table
    ├─ Modal
    └─ Loading
```

### Key UX Considerations

**Comparison View**:
- Allow comparing 2-4 parties simultaneously
- Highlight differences clearly
- Show source page numbers
- Enable filtering by topic
- Support scrolling sync between columns

**Chat Interface**:
- Familiar chat pattern (like ChatGPT)
- Clear distinction between user questions and AI answers
- Always show sources with answers
- Indicate when answer is uncertain

**Document Explorer**:
- Visual cards for each party (with party logo if available)
- Quick filters (by party, by topic)
- Clear indication of which documents are indexed
- One-click PDF download

**Admin Dashboard**:
- Real-time status indicators
- Error notifications
- Quick actions (re-ingest, clear cache)
- Cost monitoring
- Provider health checks

### Spanish UI Text Examples

| English | Spanish |
|---------|---------|
| Compare Proposals | Comparar Propuestas |
| Ask a Question | Hacer una Pregunta |
| Search | Buscar |
| Filter by Party | Filtrar por Partido |
| Government Plans 2026 | Planes de Gobierno 2026 |
| Presidential Candidate | Candidato/a Presidencial |
| Page | Página |
| Source | Fuente |
| Loading... | Cargando... |
| No results found | No se encontraron resultados |

## Success Criteria

- [ ] All 5 critical screens designed in Figma
- [ ] Responsive layouts for mobile, tablet, desktop
- [ ] Design system documented
- [ ] User flows clearly defined
- [ ] Accessibility guidelines documented
- [ ] Spanish language text finalized
- [ ] Design reviewed and approved by stakeholders
- [ ] Design ready for developer handoff

---
inclusion: auto
---

# Post-Task Code Validation

After completing each task in the implementation plan, validate the code against the following checklist before marking the task as done.

## Syntax and Type Safety

- Run `npx tsc --noEmit` to verify there are no TypeScript compilation errors
- Ensure all files use strict TypeScript (`strict: true` in tsconfig.json)
- No `any` types unless explicitly justified with a comment
- All function parameters and return types are explicitly typed
- All interfaces from `src/types/index.ts` are used correctly

## Framework and Library Compliance

### React 19
- Use functional components only (no class components)
- Use React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) properly
- No direct DOM manipulation — use refs when necessary
- Components follow single responsibility principle

### Tailwind CSS v4
- Use utility classes for all styling (no inline styles except for dynamic values like phase colors)
- Use the design system tokens defined in the Tailwind config (colors, spacing, border-radius)
- Responsive design uses Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- No custom CSS files unless for complex animations or calendar-specific styles

### Zustand 5
- Stores use the `persist` middleware for localStorage sync
- Store actions are pure functions that update state immutably
- Use selectors to minimize re-renders (`useStore(state => state.field)`)
- Handle `QuotaExceededError` in persist middleware `onRehydrateStorage`

### React Router v7
- Use `HashRouter` (not `BrowserRouter`) for GitHub Pages compatibility
- Routes use lazy loading where appropriate
- Navigation uses `useNavigate()` hook or `<Link>` components

### date-fns 4
- Import only specific functions (tree-shaking): `import { addDays } from 'date-fns'`
- Use ISO date strings (YYYY-MM-DD) for all date storage
- Never use `new Date()` for date logic — use date-fns functions

### Recharts 2
- Charts are responsive (use `<ResponsiveContainer>`)
- Chart colors match the design system phase colors
- Charts include proper axes labels and legends

### vite-plugin-pwa
- Service Worker uses NetworkFirst strategy with cache fallback
- manifest.json has all required fields (name, short_name, icons, theme_color, etc.)
- PWA is installable (manifest valid, service worker registered)

## Code Quality

- No console.log statements in production code (use only in development)
- Error handling follows the design document's error strategy
- All user-facing text uses the i18n `t()` function — no hardcoded strings
- Accessibility: all interactive elements have proper ARIA attributes and keyboard support
- Components are exported with proper naming (PascalCase for components, camelCase for hooks/utils)

## Testing

- Property-based tests use `fast-check` with minimum 100 iterations
- Each property test includes a comment referencing the design property number
- Unit tests cover edge cases and empty states
- Test files follow the naming convention: `*.property.test.ts` and `*.unit.test.ts`

## Validation Command

Run this sequence after each task to confirm compliance:

```bash
npx tsc --noEmit && npx vitest run --reporter=verbose
```

If tests are not yet written for the current task, at minimum verify:
```bash
npx tsc --noEmit
```

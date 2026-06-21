# Cycle Tracker — Menstrual Cycle Tracking PWA

A progressive web application for menstrual cycle tracking. Built with React 19, TypeScript 5, Vite 6, Tailwind CSS v4, Zustand 5, date-fns 4, and Recharts 2. Fully frontend — no backend, all data persists in localStorage.

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 3. Build for production

```bash
npm run build
```

The output is generated in the `dist/` folder. You can preview it locally:

```bash
npm run preview
```

## Testing

### Run all tests (single run)

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run a specific test file

```bash
npx vitest --run src/lib/__tests__/cycle.property.test.ts
```

### Type checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

## Clearing Cache / Resetting App Data

The app stores all data in the browser's `localStorage`. To start fresh with a clean state:

### Option 1: Browser DevTools (recommended)

1. Open the app in your browser
2. Open DevTools (`F12` or `Ctrl+Shift+I` / `Cmd+Option+I`)
3. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
4. In the left panel, expand **Local Storage**
5. Right-click the app's origin and select **Clear**

### Option 2: Console command

Open the browser console and run:

```javascript
localStorage.clear();
location.reload();
```

### Option 3: Clear specific keys only

The app uses these localStorage keys:

| Key | Content |
|-----|---------|
| `app-cycles` | All cycle data (active + history) |
| `app-symptoms` | All daily symptom logs |
| `app-settings` | User preferences (cycle length, theme, locale, etc.) |
| `app-onboarding` | Whether onboarding was completed |

To clear a specific area:

```javascript
// Clear only cycle data
localStorage.removeItem('app-cycles');

// Clear only symptom logs
localStorage.removeItem('app-symptoms');

// Reset settings to defaults
localStorage.removeItem('app-settings');

// Reset onboarding
localStorage.removeItem('app-onboarding');

// Reload to re-initialize
location.reload();
```

### Clearing the Service Worker cache (PWA)

If you need to clear the cached PWA assets (e.g., to test a fresh install or offline behavior):

1. Open DevTools → **Application** tab
2. Go to **Service Workers** in the left panel
3. Click **Unregister** on the active service worker
4. Go to **Cache Storage** and delete all caches (right-click → Delete)
5. Hard-reload the page (`Ctrl+Shift+R` / `Cmd+Shift+R`)

Or via console:

```javascript
// Unregister service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Reload
location.reload();
```

## Project Structure

```
src/
├── pages/           # Route-level page components
├── components/      # UI components (layout, calendar, forms, charts, dashboard, shared)
├── store/           # Zustand stores with localStorage persistence
├── lib/             # Pure business logic modules
├── lib/__tests__/   # Property-based and unit tests
├── hooks/           # Custom React hooks
├── i18n/            # Internationalization (English + Spanish)
└── types/           # TypeScript interfaces and types
```

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 19 | UI framework |
| TypeScript 5 | Type safety |
| Vite 6 | Build tool & dev server |
| Tailwind CSS v4 | Styling (CSS-first config) |
| Zustand 5 | State management + localStorage persistence |
| date-fns 4 | Date calculations |
| Recharts 2 | Charts and data visualization |
| Vitest | Test runner |
| fast-check | Property-based testing |
| vite-plugin-pwa | PWA / offline support |

# Implementation Plan: Menstrual Cycle Tracker

## Overview

Implementation of a menstrual cycle tracking PWA, 100% frontend, with React 19, TypeScript 5, Vite 6, Tailwind CSS v4, Zustand 5, date-fns 4, and Recharts 2. The app persists data in localStorage, predicts cycle phases, logs symptoms, generates recommendations, and works offline.

## Tasks

- [-] 1. Project setup and base structure
  - [-] 1.1 Initialize Vite project with React + TypeScript and configure dependencies
    - Create project with `npm create vite@latest` using template `react-ts`
    - Install dependencies: `react-router-dom@^7`, `zustand@^5`, `date-fns@^4`, `recharts@^2`
    - Install devDependencies: `tailwindcss@^4`, `@tailwindcss/vite@^4`, `vite-plugin-pwa@^0.21`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `fast-check`
    - Configure `vite.config.ts` with React, Tailwind, and PWA plugins
    - Configure `vitest.config.ts` with jsdom environment and globals
    - Configure `tsconfig.json` with strict mode and paths
    - _Requirements: 8.1, 8.3, 8.4_

  - [~] 1.2 Create folder structure and define base types (`src/types/index.ts`)
    - Create folders: `src/pages/`, `src/components/layout/`, `src/components/calendar/`, `src/components/forms/`, `src/components/charts/`, `src/components/dashboard/`, `src/components/shared/`, `src/store/`, `src/lib/`, `src/hooks/`, `src/lib/__tests__/`
    - Implement all interfaces and types from the design: `Cycle`, `CyclePhases`, `DateRange`, `SymptomLog`, `PhysicalSymptoms`, `EmotionalSymptoms`, `HormonalSymptoms`, `FlowLevel`, `MucusType`, `AppSettings`, `Recommendation`, `PhaseSummary`, `PhaseData`, `ValidationResult`, `ImportResult`
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.8, 1.9, 2.2, 9.1_

  - [~] 1.3 Configure Tailwind CSS v4 with the design system (colors, typography, spacing)
    - Configure color tokens: primary pink (#EE6B8A), coral (#FA6364), amber (#FFB04C), mint green (#4ECDC4), lavender (#9B7ED8), backgrounds and text
    - Configure Inter typography with the defined scale (H1-H3, body, labels, numbers)
    - Configure border-radius, shadows, and transitions from the design system
    - _Requirements: 10.5, 10.6, 10.7_

- [ ] 2. Business logic modules (`src/lib/`)
  - [~] 2.1 Implement `src/lib/cycle.ts` — phase prediction and cycle calculations
    - Implement `predictPhases(startDate, cycleLength, periodDuration, lutealPhaseDays)`: calculates the 4 phases according to the design algorithm
    - Implement `calculateAverageCycleLength(cycles, count)`: arithmetic mean clamped to [26, 30]
    - Implement `getCurrentPhase(date, cycle)`: determines current phase
    - Implement `detectAnomalies(cycles, averageLength)`: cycles with deviation > 7 days
    - Implement `calculateTrend(cycles)`: compares average of last 3 vs previous 3
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 7.4, 7.6_

  - [ ]* 2.2 Write property tests for `cycle.ts` (Properties 3, 4)
    - **Property 3: Cycle phase prediction invariants** — For any valid configuration, phases must cover all days without gaps or overlap, luteal phase must be 14 days, ovulation 3 days, and menstrual the configured duration
    - **Validates: Requirements 2.1, 2.3, 2.4, 2.5**
    - **Property 4: Average cycle length calculation** — For any array of 3+ cycles, the average must be the rounded arithmetic mean clamped to [26, 30]
    - **Validates: Requirements 2.6, 2.8**

  - [~] 2.3 Implement `src/lib/pregnancy.ts` — pregnancy probability
    - Implement `calculatePregnancyProbability(targetDate, cycleStartDate, cycleLength, lutealPhaseDays)`: returns 'high', 'medium', or 'low' based on distance to ovulation day
    - Implement `canShowPregnancyProbability(activeCycle)`: verifies if there is sufficient data
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7_

  - [ ]* 2.4 Write property test for `pregnancy.ts` (Property 8)
    - **Property 8: Pregnancy probability classification** — For any day of the cycle, correctly classify: 'high' if |distance| ≤ 2, 'medium' if distance between -5 and -3, 'low' for the rest
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [~] 2.5 Implement `src/lib/symptoms.ts` — symptom summary and grouping
    - Implement `generatePhaseSummary(logs, phases)`: groups symptoms by phase, calculates averages excluding days without logs
    - Implement `hasEnoughDataForSummary(logs, cycle)`: requires minimum 7 days with logs
    - Implement `calculateAverageSymptoms(logs, startDate, endDate)`: physical and emotional averages
    - _Requirements: 4.1, 4.2, 4.4, 4.6_

  - [ ]* 2.6 Write property tests for `symptoms.ts` (Properties 5, 6)
    - **Property 5: Phase summary generation** — Correct averages per phase, null if no data, requires 7+ days
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.6**
    - **Property 6: Recommendation generation by intensity** — Only symptoms ≥ 3, maximum 5, grouped and sorted by intensity
    - **Validates: Requirements 5.1, 5.6**

  - [~] 2.7 Implement `src/lib/recommendations.ts` — wellness recommendations
    - Implement `RECOMMENDATIONS_MAP`: minimum 3 recommendations per physical symptom, covering at least 2 categories (physical, natural, pharmaceutical)
    - Implement `getRecommendations(log)`: generates recommendations for symptoms ≥ 3, maximum 5, sorted by descending intensity
    - Implement `getMenstrualPhaseRecommendations()`: maximum 3 preventive recommendations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

  - [ ]* 2.8 Write property test for `recommendations.ts` (Property 7)
    - **Property 7: Recommendations map completeness** — For each physical symptom key, RECOMMENDATIONS_MAP must have ≥ 3 recommendations covering ≥ 2 categories
    - **Validates: Requirements 5.2, 5.3**

  - [~] 2.9 Implement `src/lib/storage.ts` — validation, export, and import
    - Implement `validateStorageData(data)`: validates structure against defined types
    - Implement `exportAllData(format)`: exports to JSON or CSV with filename including date
    - Implement `importData(jsonString)`: validates structure before overwriting, returns error if invalid
    - Implement `checkStorageAvailability()`: checks available space in localStorage
    - _Requirements: 9.4, 9.5, 9.6, 9.7_

  - [ ]* 2.10 Write property tests for `storage.ts` (Properties 1, 2, 13, 14, 15)
    - **Property 1: SymptomLog round-trip** — Saving and retrieving produces an identical object
    - **Validates: Requirements 1.3, 1.7**
    - **Property 2: Input range validation** — Accepts valid values, rejects invalid ones
    - **Validates: Requirements 1.4, 1.8, 1.9**
    - **Property 13: Export/import round-trip** — Exporting and importing restores equivalent state
    - **Validates: Requirements 9.4, 9.5**
    - **Property 14: Invalid import safety** — Invalid JSON returns error without modifying data
    - **Validates: Requirements 9.7**
    - **Property 15: Phase to color mapping** — Each phase returns its correct hex color
    - **Validates: Requirements 3.1**

  - [ ]* 2.11 Write property tests for history (Properties 9, 10, 11, 12)
    - **Property 9: History average calculation** — Arithmetic mean of the last min(6, N) cycles
    - **Validates: Requirements 7.2, 7.8**
    - **Property 10: Anomaly detection** — Identifies cycles with |duration - average| > 7
    - **Validates: Requirements 7.4**
    - **Property 11: Variation between consecutive cycles** — Signed difference between adjacent pairs
    - **Validates: Requirements 7.5**
    - **Property 12: Trend classification** — Shortening/lengthening/stable based on average difference
    - **Validates: Requirements 7.6**

- [~] 3. Checkpoint — Verify business logic
  - Ensure all tests pass, ask the user if there are any questions.

- [ ] 4. Zustand stores with localStorage persistence
  - [~] 4.1 Implement `src/store/useSettingsStore.ts`
    - Create store with `settings` state (defaults: cycle 28, menstruation 5, luteal 14, light theme, first day Monday) and `onboardingComplete`
    - Implement actions: `updateSettings`, `completeOnboarding`, `exportData`, `importData`, `resetToDefaults`
    - Configure `persist` middleware with key "app-settings"
    - _Requirements: 9.1, 9.2, 9.3, 2.2, 2.7_

  - [~] 4.2 Implement `src/store/useCycleStore.ts`
    - Create store with `cycles` state and `activeCycleId`
    - Implement actions: `startNewCycle`, `endCurrentCycle`, `recalculatePhases`, `getActiveCycle`, `getCycleHistory`, `getAverageCycleLength`, `getAnomalies`, `getTrend`
    - Configure `persist` middleware with key "app-cycles"
    - Handle `QuotaExceededError` in the persist middleware
    - _Requirements: 2.1, 2.6, 2.8, 7.1, 7.2, 7.4, 7.6, 9.1, 9.2, 1.10_

  - [~] 4.3 Implement `src/store/useSymptomStore.ts`
    - Create store with `logs` state (SymptomLog[])
    - Implement actions: `saveLog`, `getLogByDate`, `getLogsByDateRange`, `deleteLog`
    - Configure `persist` middleware with key "app-symptoms"
    - Handle persistence error while retaining data in state
    - _Requirements: 1.3, 1.7, 9.1, 9.2, 1.10_

  - [ ]* 4.4 Write unit tests for the stores
    - Persistence round-trip test (save and restore from localStorage)
    - Default values initialization test
    - Cycle actions test (start, end, recalculate)
    - localStorage error handling test
    - _Requirements: 9.1, 9.2, 9.3, 1.3, 1.7_

- [ ] 5. Custom Hooks
  - [~] 5.1 Implement `src/hooks/useCurrentPhase.ts`
    - Returns current phase, cycle day, days until next phase, and phase color
    - Uses `useCycleStore` and `useSettingsStore` internally
    - _Requirements: 2.1, 3.1_

  - [~] 5.2 Implement `src/hooks/usePregnancyProbability.ts`
    - Returns probability level ('high' | 'medium' | 'low' | null) and `canShow`
    - Uses `calculatePregnancyProbability` and `canShowPregnancyProbability` from `lib/pregnancy.ts`
    - _Requirements: 6.1, 6.7_

  - [~] 5.3 Implement `src/hooks/useResponsive.ts`
    - Detects breakpoints: isMobile (≤768px), isTablet (≤1024px), isDesktop (>1024px)
    - Uses `window.matchMedia` with change listener
    - _Requirements: 10.1, 10.2, 3.7, 3.8_

- [ ] 6. Internationalization (i18n) module
  - [~] 6.1 Create translation files and i18n hook (`src/i18n/`)
    - Create `src/i18n/es.ts` with Spanish translations for all UI text: navigation labels, phase names, symptom names, flow/mucus options, recommendation text, error messages, empty states, button labels
    - Create `src/i18n/en.ts` with equivalent English translations
    - Create `src/i18n/index.ts` with `useTranslation()` hook that reads locale from `useSettingsStore` and returns `t(key)` function
    - Detect browser language on first load and set locale to 'en' or 'es' accordingly
    - _Requirements: 12.1, 12.2, 12.5_

  - [~] 6.2 Integrate i18n into settings store
    - Add `locale: 'en' | 'es'` field to AppSettings type (default: 'es')
    - Add `setLocale` action to `useSettingsStore`
    - Persist locale in localStorage with other settings
    - Update Settings page to include language selector
    - _Requirements: 12.3, 12.4_

  - [ ]* 6.3 Write property test for locale switching (Property 16)
    - **Property 16: Language switching preserves app state** — Switching locale must update all UI keys without errors, not modify user data, and persist the new locale
    - **Validates: Requirements 12.3, 12.4, 12.6**

- [ ] 7. Shared components and layout
  - [~] 7.1 Implement shared components (`src/components/shared/`)
    - `Button.tsx`: primary, secondary, and ghost variants with design system styles
    - `Card.tsx`: container with shadow, border-radius 16px, padding 20px
    - `Badge.tsx`: pills with border-radius 9999px and phase colors
    - `Modal.tsx`: overlay with backdrop, border-radius 20px, 0.25s animation
    - `Toast.tsx`: success/error notifications with auto-dismiss
    - All with accessibility: focus visible, aria-labels, keyboard navigation
    - _Requirements: 10.5, 10.7, 10.8, 10.9_

  - [~] 7.2 Implement main layout (`src/components/layout/`)
    - `Layout.tsx`: structure with sidebar (>1024px) or hamburger menu (≤1024px)
    - `Sidebar.tsx`: fixed 280px navigation, items with hover/active states, order: Dashboard, Calendar, Log, History, Settings
    - `MobileMenu.tsx`: overlay panel with backdrop, closes on selection or outside click, hamburger button minimum 44x44px
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.10_

  - [~] 7.3 Configure routing with HashRouter (`src/App.tsx`)
    - Configure `HashRouter` with routes: `/` (Dashboard), `/calendar`, `/log`, `/history`, `/insights/:cycleId`, `/settings`
    - Wrap with `Layout.tsx`
    - Create placeholder components for each page
    - _Requirements: 10.4_

- [~] 8. Checkpoint — Verify structure and navigation
  - Ensure all tests pass and navigation works, ask the user if there are any questions.

- [ ] 9. Pages and functional components
  - [~] 9.1 Implement Dashboard page (`src/pages/Dashboard.tsx`)
    - `CyclePhaseCard.tsx`: shows current phase, cycle day, remaining days with phase color
    - `PregnancyBadge.tsx`: probability badge with colors by level, non-dismissible medical disclaimer
    - `RecommendationCards.tsx`: cards with contextual recommendations (max 5) and preventive ones during menstrual phase (max 3)
    - `QuickStats.tsx`: quick statistics for current cycle
    - _Requirements: 2.1, 5.1, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [~] 9.2 Implement Calendar page (`src/pages/Calendar.tsx`)
    - `MonthView.tsx`: full month view (>768px) with cells colored by phase
    - `WeekView.tsx`: weekly view (≤768px)
    - `DayCell.tsx`: individual cell with phase color, pink border for current day, indicator for logged symptoms
    - `Legend.tsx`: color legend (menstrual, follicular, ovulation, luteal)
    - Navigation between months (±12 months), controls disabled at limits
    - Click on day → open log or show detail if data already exists
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [~] 9.3 Implement Daily Log page (`src/pages/DailyLog.tsx`)
    - `SymptomForm.tsx`: complete form with all symptom categories
    - `ScaleInput.tsx`: 0-5 scale selector with visual indicators
    - `SelectInput.tsx`: dropdown for flow and cervical mucus
    - `TagInput.tsx`: tag input with limit of 10 tags, each ≤ 30 chars
    - Real-time range validation (sleep 0-24 step 0.5, weight 30-300, temperature 35-42)
    - Load existing data when selecting a day with a log
    - Persistence error handling with toast and data retention
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [~] 9.4 Implement History page (`src/pages/History.tsx`)
    - Table with completed cycles: start date, end date, duration, menstruation days, anomaly indicator
    - `CycleDurationChart.tsx`: line chart with last 12 cycles
    - `VariationBarChart.tsx`: bar chart with variation between consecutive cycles
    - Overall cycle trend (shortening/lengthening/stable)
    - Averages calculated with last min(6, N) cycles
    - Message when fewer than 2 cycles exist
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [~] 9.5 Implement Insights page (`src/pages/Insights.tsx`)
    - Detailed summary view per cycle: symptoms grouped by phase
    - `SymptomRadarChart.tsx`: radar chart comparing intensity between phases
    - `PhaseSummaryChart.tsx`: bars by symptom category in each phase
    - Navigation between completed cycles
    - Insufficient data warning (<7 days with logs)
    - "No data" indicator for phases without logs
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [~] 9.6 Implement Settings page (`src/pages/Settings.tsx`)
    - Editable fields: cycle duration (26-30), menstruation days (3-7), first day of week, export format
    - Export (JSON/CSV) and import data buttons
    - Recalculate active cycle phases when saving changes
    - Validation and error handling for import
    - Reset to defaults button with confirmation
    - _Requirements: 2.2, 2.7, 2.8, 9.3, 9.4, 9.5, 9.6, 9.7_

- [~] 10. Checkpoint — Verify full functionality
  - Ensure all tests pass and all pages work correctly, ask the user if there are any questions.

- [ ] 11. Sample data and PWA configuration
  - [~] 11.1 Implement `src/lib/seed.ts` — sample data for development
    - Generate 6 simulated cycles with realistic data
    - Generate varied symptom logs for each cycle
    - Function to populate localStorage with sample data (development only)
    - _Requirements: 7.2, 7.3_

  - [~] 11.2 Configure full PWA (manifest.json, service worker, icons)
    - Configure `vite-plugin-pwa` in `vite.config.ts` with NetworkFirst strategy
    - Create `manifest.json`: name, short_name, start_url, display standalone, theme_color #EE6B8A, background_color #F8F9FC, icons 192x192, 512x512, SVG maskable
    - Configure static asset precaching
    - Implement update prompt when a new version is available
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 11.3 Write integration tests
    - Full flow test: log symptoms → view in calendar → view in summary
    - Export/import data test
    - PWA test: valid manifest and service worker registered
    - _Requirements: 8.2, 8.3, 9.4, 9.5_

- [~] 12. Final checkpoint — Verify full integration
  - Ensure all tests pass, PWA works offline, and the app is ready for deploy. Ask the user if there are any questions.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests (fast-check) validate universal correctness properties defined in the design
- Unit tests validate specific examples and edge cases
- The stack is: React 19 + TypeScript 5 + Vite 6 + Tailwind CSS v4 + Zustand 5 + date-fns 4 + Recharts 2
- All persistence is in localStorage, no backend

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.3", "2.5", "2.7", "2.9"] },
    { "id": 3, "tasks": ["2.2", "2.4", "2.6", "2.8", "2.10", "2.11"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4", "5.1", "5.2", "5.3"] },
    { "id": 6, "tasks": ["6.1", "6.2"] },
    { "id": 7, "tasks": ["6.3", "7.1", "7.2"] },
    { "id": 8, "tasks": ["7.3"] },
    { "id": 9, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6"] },
    { "id": 10, "tasks": ["10.1", "11.1", "11.2"] },
    { "id": 11, "tasks": ["11.3"] }
  ]
}
```

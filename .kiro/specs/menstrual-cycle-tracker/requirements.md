# Requirements Document

## Introduction

Progressive web application (PWA) for female menstrual cycle tracking. It allows recording daily symptoms, predicting cycle phases, visualizing a color-coded calendar, generating monthly summaries by phase, offering contextual wellness recommendations, calculating pregnancy probability, and maintaining a complete cycle history with trends and anomalies. The app is 100% frontend, with no backend, and persists data in localStorage.

## Glossary

- **App**: The progressive web application for menstrual cycle tracking
- **Cycle**: Complete period from the first day of menstruation to the day before the start of the next menstruation
- **Menstrual_Phase**: Cycle phase corresponding to bleeding (approximately days 1 to 5)
- **Follicular_Phase**: Phase after menstruation where the follicle matures (approximately days 6 to 13)
- **Ovulation_Phase**: Maximum fertility window around egg release (approximately days 13 to 15)
- **Luteal_Phase**: Phase after ovulation until the start of the next menstruation (approximately days 15 to 28)
- **Daily_Log**: Symptom and data entry corresponding to a specific day
- **Cycle_Length**: Total number of days in the cycle, configurable between 26 and 30 days (28 by default)
- **Fertile_Window**: High pregnancy probability period that includes ovulation and surrounding days
- **Calendar**: Monthly view showing days colored according to the cycle phase
- **Monthly_Summary**: Aggregation of symptoms recorded during a cycle, organized by phase
- **History**: Accumulated record of previous cycles with metrics and trends
- **Recommendation**: Contextual wellness advice based on recorded symptoms
- **PWA**: Progressive Web App, a web application that works offline and can be installed as a native app
- **localStorage**: Browser local storage used to persist all user data

## Requirements

### Requirement 1: Daily Symptom Logging

**User Story:** As a user, I want to log my daily symptoms in a categorized way, so I can track how I feel throughout the cycle.

#### Acceptance Criteria

1. THE App SHALL present a daily logging form with the categories: physical symptoms (cramps, back pain, headache, bloating, breast tenderness, fatigue, nausea, acne), emotional symptoms (mood swings, anxiety, sadness, irritability, energy), hormonal symptoms (menstrual flow, cervical mucus), libido, appetite, sleep hours, weight, and basal temperature
2. WHEN the user selects a day on the calendar, THE App SHALL open the logging form for that specific day, allowing selection of only the current date or past dates
3. WHEN the user completes and saves a daily log, THE App SHALL persist the data in localStorage via the Zustand Persist middleware within a maximum of 1 second after the save action
4. THE App SHALL allow integer values on a numeric scale from 0 to 5 for physical symptoms, emotional symptoms, libido, and appetite, where 0 represents absence of the symptom and 5 represents maximum intensity
5. THE App SHALL allow selecting menstrual flow from the options: none, light, moderate, heavy, spotting
6. THE App SHALL allow selecting cervical mucus from the options: dry, sticky, creamy, egg white, watery
7. WHEN the user accesses a day that already has a log, THE App SHALL load the previously saved data into the form within a maximum of 1 second
8. THE App SHALL allow adding free-text notes with a maximum of 500 characters and up to 10 custom tags per log, each tag with a maximum of 30 characters
9. THE App SHALL allow logging sleep hours as a numeric value between 0 and 24 with 0.5 increments, weight in kilograms between 30.0 and 300.0 with one decimal place, and basal temperature in degrees Celsius between 35.0 and 42.0 with one decimal place, with weight and temperature being optional fields
10. IF persistence to localStorage fails due to insufficient space or a write error, THEN THE App SHALL display an error message indicating that the log could not be saved and keep the entered data in the form without losing it

### Requirement 2: Cycle Phase Prediction

**User Story:** As a user, I want the app to predict my cycle phases, so I know which phase I am in and can plan my routine.

#### Acceptance Criteria

1. WHEN the user records the first day of menstruation, THE App SHALL calculate the dates of the four phases (menstrual, follicular, ovulation, luteal) based on the configured cycle length and display the resulting phases within a maximum of 2 seconds
2. THE App SHALL use a default cycle length of 28 days, configurable between 26 and 30 days in the settings
3. THE App SHALL calculate the luteal phase with a fixed duration of 14 days counted backwards from the end of the cycle
4. THE App SHALL calculate the ovulation window as the 3 days around day 14 before the end of the cycle (ovulation day ± 1 day)
5. THE App SHALL calculate the follicular phase as the days between the end of menstruation and the start of ovulation
6. WHEN the user records the first day of menstruation and data from at least 3 previous complete cycles exists, THE App SHALL recalculate the average cycle length as the arithmetic mean rounded to the nearest integer of the last 3 cycles, limiting the result to the range of 26 to 30 days
7. THE App SHALL allow configuring the menstruation duration between 3 and 7 days, with a default value of 5 days
8. WHEN the user modifies the cycle length or menstruation duration in the settings, THE App SHALL recalculate the phases of the active cycle using the new values and update the view within a maximum of 2 seconds

### Requirement 3: Color-Coded Phase Calendar

**User Story:** As a user, I want to see a monthly calendar with cycle phases marked in different colors, so I can quickly identify which phase I am in and will be in.

#### Acceptance Criteria

1. THE App SHALL display a monthly calendar where each day is colored according to the predicted phase: menstrual in coral red (#FA6364), follicular in amber orange (#FFB04C), ovulation in mint green (#4ECDC4), and luteal in lavender (#9B7ED8)
2. THE App SHALL mark the current day with a 2px border in pink (#EE6B8A), visible regardless of the phase background color of the cell
3. WHEN the user navigates between months (forward or backward), THE App SHALL display the predicted phases for the selected month, allowing navigation up to 12 months in the past and 12 months in the future from the current month
4. WHEN the user clicks on a calendar day that has logged symptoms, THE App SHALL display a panel with the symptom details for that day
5. WHEN the user clicks on a calendar day that has no logged symptoms, THE App SHALL display the symptom logging form with that day's date preselected
6. THE App SHALL display a color legend below the calendar listing the four phases (menstrual, follicular, ovulation, luteal) each with its corresponding color and name
7. WHILE the app is displayed on a screen with width greater than 768px, THE App SHALL show the calendar in full monthly view
8. WHILE the app is displayed on a screen with width of 768px or less, THE App SHALL show the calendar in weekly view
9. IF no cycle data has been recorded, THEN THE App SHALL display the calendar without phase colors and with a message indicating that the user must record their first cycle to see predictions

### Requirement 4: Monthly Symptom Summary by Phase

**User Story:** As a user, I want to see a summary of my symptoms organized by cycle phase, so I can understand patterns in my body.

#### Acceptance Criteria

1. WHEN the user has completed a cycle with symptom logs, THE App SHALL generate a summary that groups symptoms by each phase (menstrual, follicular, ovulation, luteal), calculating the arithmetic mean of intensity (scale 0-5) of all days with logs within each phase
2. THE App SHALL display the summary with average intensity values per symptom category (physical and emotional) in each phase, excluding from the calculation the days without symptom logs within the phase
3. THE App SHALL present the visual summary using radar or bar charts (Recharts) comparing the average symptom intensity across the 4 cycle phases
4. IF a cycle has fewer than 7 days with symptom logs, THEN THE App SHALL display a notice indicating that the data is insufficient to generate a reliable summary, and not generate the average summary for that cycle
5. THE App SHALL allow navigating between summaries of previous completed cycles, showing navigation controls disabled when no additional cycles exist in the corresponding direction
6. IF a cycle phase has no days with symptom logs, THEN THE App SHALL display the phase in the summary indicating that no data is available for that phase, without a numeric average value

### Requirement 5: Contextual Wellness Recommendations

**User Story:** As a user, I want to receive practical advice based on my symptoms, so I can feel better during difficult phases of the cycle.

#### Acceptance Criteria

1. WHEN the user logs physical symptoms with intensity 3 or higher (on a scale of 0-5), THE App SHALL display recommendations to relieve those symptoms within 2 seconds after saving the log, presenting a maximum of 5 recommendations ordered by relevance to the highest-intensity symptom
2. THE App SHALL offer categorized recommendations that include: physical remedies (heating pad, stretching, yoga, rest), natural remedies (herbal teas, nutrition), and generic pharmacological options (common analgesics)
3. THE App SHALL associate at least 3 different recommendations for each of the 8 recordable physical symptom types (cramps, backPain, headache, bloating, breastTenderness, fatigue, nausea, acne), covering at least 2 of the 3 categories defined in criterion 2
4. WHILE the user is in the menstrual phase according to the cycle prediction, THE App SHALL display on the dashboard a maximum of 3 general preventive recommendations for that phase, regardless of whether symptoms have been logged that day
5. THE App SHALL present recommendations in cards within a dedicated section of the dashboard and the daily log detail, without modals or pop-up notifications, allowing the user to ignore them without mandatory interaction
6. IF the user logs more than one physical symptom with intensity 3 or higher on the same day, THEN THE App SHALL group recommendations by symptom and display first those corresponding to the symptom with the highest reported intensity

### Requirement 6: Pregnancy Probability Prediction

**User Story:** As a user, I want to know my pregnancy probability based on the day of the cycle, so I can make informed decisions about family planning.

#### Acceptance Criteria

1. THE App SHALL calculate and display pregnancy probability as one of three levels (high, medium, low) based on the current day's position relative to the estimated ovulation day, where the ovulation day is calculated as cycle length minus configured luteal phase days
2. WHEN the current day is within the fertile window (ovulation day ± 2 days, i.e., 5 days total), THE App SHALL indicate high pregnancy probability displaying a badge with the text "High" and the ovulation phase color (#4ECDC4)
3. WHEN the current day is between 3 and 5 days before the ovulation day (not included in the fertile window), THE App SHALL indicate medium pregnancy probability displaying a badge with the text "Medium" and the follicular phase color (#FFB04C)
4. WHEN the current day is outside the fertile window and outside the pre-ovulatory period of 3 to 5 days, THE App SHALL indicate low pregnancy probability displaying a badge with the text "Low" and secondary text color (#6B7280)
5. THE App SHALL display the pregnancy probability badge with border-radius 9999px both on the dashboard and in the calendar view, differentiated by color according to the probability level
6. THE App SHALL include a visible text disclaimer on the dashboard below the probability indicator, stating that the prediction is an estimate and does not replace contraceptive methods or professional medical advice; this disclaimer must not be dismissible by the user
7. IF the user does not have an active registered cycle (no period start date), THEN THE App SHALL hide the pregnancy probability indicator and not display any level until sufficient data exists to calculate ovulation

### Requirement 7: Cycle History and Trends

**User Story:** As a user, I want to see the complete history of my cycles with metrics and trends, so I can detect patterns or anomalies.

#### Acceptance Criteria

1. THE App SHALL maintain a history of all registered completed cycles, including start date, end date, total duration in days, and number of menstruation days
2. THE App SHALL calculate and display the average duration of the last 6 completed cycles and the average menstruation days of those same cycles
3. THE App SHALL display a line chart (Recharts) showing the duration evolution of the last 12 completed cycles, where the X-axis represents the cycle number and the Y-axis the duration in days
4. WHEN a cycle's duration deviates more than 7 days from the user's average, THE App SHALL mark that cycle as an anomaly with a differentiated visual indicator in the history table and in the line chart
5. THE App SHALL display the variation between consecutive cycles (difference in days with positive or negative sign) in tabular format and as a bar chart
6. THE App SHALL calculate and display the overall cycle trend classified as: "shortening" if the average of the last 3 cycles is at least 2 days less than the average of the 3 preceding ones, "lengthening" if it is at least 2 days more, or "stable" if the difference is less than 2 days
7. IF the user has fewer than 2 registered completed cycles, THEN THE App SHALL display a message indicating that at least 2 complete cycles are needed to generate trends
8. IF the user has fewer than 6 registered completed cycles, THEN THE App SHALL calculate averages and trends using all available completed cycles

### Requirement 8: PWA Support and Offline Functionality

**User Story:** As a user, I want to be able to use the app without an internet connection and have the option to install it as an application, so I have quick and constant access to my information.

#### Acceptance Criteria

1. THE App SHALL function offline after the first complete load of the application, allowing symptom logging, calendar consultation, viewing predictions, and accessing settings without an internet connection, using data stored in localStorage
2. THE App SHALL include a manifest.json file with the fields name, short_name, start_url, display in "standalone" mode, orientation "any", theme_color "#EE6B8A", background_color "#F8F9FC", and icons in sizes 192x192, 512x512, and a maskable SVG icon
3. THE App SHALL register a Service Worker that precaches all static assets generated in the build (HTML, CSS, JavaScript bundles, fonts, and icons) using the Network-first strategy with cache fallback
4. THE App SHALL be installable as an application from the browser on devices that support PWA, meeting the browser's installability criteria (valid manifest, registered Service Worker, served over HTTPS or localhost)
5. WHILE the app is without an internet connection, THE App SHALL continue operating all read and write functionalities in localStorage without showing network errors to the user
6. WHEN a new version of the app is available in cache, THE App SHALL notify the user and allow them to update without losing data stored in localStorage

### Requirement 9: Local Data Persistence

**User Story:** As a user, I want all my data to be stored locally on my device, so I can maintain my privacy and not depend on external servers.

#### Acceptance Criteria

1. THE App SHALL store all data (cycles, symptoms, settings) exclusively in browser localStorage using the keys: "app-cycles" (Cycle[]), "app-symptoms" (SymptomLog[]), "app-settings" (AppSettings), "app-onboarding" (boolean)
2. THE App SHALL automatically synchronize the application state with localStorage on each data change via the Zustand persistence middleware
3. WHEN the user opens the app for the first time, THE App SHALL initialize storage with default values for settings (28-day cycle, 5 days of menstruation, 14-day luteal phase, light theme, Monday as first day of week)
4. THE App SHALL offer functionality to export all data in JSON or CSV format for backup, generating a downloadable file with a name that includes the export date
5. THE App SHALL offer functionality to import previously exported data in JSON format, validating the file structure before overwriting existing data
6. IF data in localStorage is corrupt or not valid according to the defined TypeScript types, THEN THE App SHALL notify the user and offer the option to reset data to default values without losing the remaining intact information
7. IF data import fails due to invalid format, THEN THE App SHALL display a descriptive error message and not modify existing data in localStorage

### Requirement 10: Responsive Design and User Experience

**User Story:** As a user, I want the app to adapt to different screen sizes and have an intuitive and pleasant interface, so I can use it comfortably on both desktop and mobile.

#### Acceptance Criteria

1. WHILE the app is displayed on screens with width greater than 1024px, THE App SHALL show a layout with a fixed navigation sidebar of 280px width on the left side and the main content area occupying the remaining space
2. WHILE the app is displayed on screens with width of 1024px or less, THE App SHALL hide the sidebar and show a hamburger menu button in the header with a minimum touch target area of 44x44px
3. WHEN the user presses the hamburger menu button, THE App SHALL show the navigation panel overlaid on the content with the background overlay defined in the design system, and close when selecting a view or pressing outside the panel
4. THE App SHALL include navigation views in the sidebar in the following order: Dashboard, Calendar, Daily Log, History, and Settings
5. THE App SHALL use the color palette defined in the design system (primary pink #EE6B8A, background #F8F9FC, white cards with subtle shadow)
6. THE App SHALL use Inter typography as the primary font with the typographic scale defined in the design system
7. THE App SHALL apply smooth transitions (0.15s ease for hover/focus, 0.25s ease for modals, 0.35s ease for view changes) on all interactive elements
8. THE App SHALL allow complete keyboard navigation, where all interactive elements are reachable with the Tab key in logical reading order, activatable with Enter or Space, and display a visible focus indicator with the focus ring defined in the design system
9. THE App SHALL comply with minimum WCAG AA color contrast: 4.5:1 ratio for text smaller than 18px and 3:1 ratio for text 18px or larger and for interface elements
10. WHILE the app is displayed on screens with width of 1024px or less, THE App SHALL display all interactive elements (buttons, links, controls) with a minimum touch target area of 44x44px

### Requirement 12: Internationalization (i18n) Support

**User Story:** As a user, I want to use the app in English or Spanish, so that I can interact with the interface in my preferred language.

#### Acceptance Criteria

1. THE App SHALL support two languages: English (en) and Spanish (es), with Spanish as the default language
2. THE App SHALL detect the browser's preferred language and automatically select English or Spanish accordingly on first load
3. WHEN the user changes the language in the settings view, THE App SHALL immediately update all UI text to the selected language without requiring a page reload
4. THE App SHALL persist the selected language preference in localStorage as part of AppSettings
5. THE App SHALL translate all static UI text including navigation labels, form labels, button text, phase names, symptom names, recommendation text, error messages, and empty state messages
6. THE App SHALL NOT translate user-entered data (notes, custom tags) when switching languages

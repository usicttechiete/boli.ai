# Home Page Plan (`app/(tabs)/index.tsx`)

## Overview
The Home page serves as the user's primary dashboard. It provides a personalized greeting, a section to manage their baseline language proficiency ("Known Languages"), and a section to initiate learning a new language ("Learn Language").

## UI Sections

### 1. Header Area
- **Greeting**: "Hello, [User's Name] 👋"
  - Fetch name from the global Auth Context or user profile state.
- **Top padding**: Standard SafeAreaView padding to ensure it respects device notches.

### 2. "Known Languages" Section
- **Title**: "Your Known Languages"
- **State: Empty**:
  - If the user hasn't tested any languages yet, show a friendly placeholder.
    - Example text: "You haven't added any languages yet. Test a language to establish your baseline!"
- **State: Populated**:
  - Render a horizontal scrolling list (`FlatList` or `ScrollView`) or a grid of language cards.
  - Each card should display:
    - Language Name (e.g., "Hindi")
    - Fluency score or a mini indicator of their test result.
- **Action Button**: `[ + Add Language ]`
  - Clicking this opens an action sheet or modal to select a language to test (e.g., English, Hindi, Tamil, Telugu, etc.).
  - Selecting a language routes the user to `app/test/[language].tsx`.

### 3. "Learn Language" Section
- **Title**: "Learn a New Language"
- **Grid Layout**: Display languages in a neat grid (2 columns).
- **Active Languages**: 
  - English, Hindi
  - UI: Bright, clickable cards.
  - Interaction: Clicking routes the user to `app/learn/[language].tsx` (passes the target language as a parameter).
- **Coming Soon Languages**:
  - Tamil, Telugu, Punjabi, Gujarati, Marathi, Japanese, German, French.
  - UI: Greyed out, slightly opaque cards with a small "Coming Soon" badge.
  - Interaction: Disabled, or shows a small toast "This language is coming soon!"

## Data Requirements (TanStack Query / API)
- `GET /api/test/known-languages`
  - Fetches the user's tested languages to populate the "Known Languages" section.

## Design & Styling
- Minimalist and clean.
- Use distinct sizing to separate the "Known Languages" section from "Learn Language".
- Stick to the established color palette (e.g., soft blues, warm whites) avoiding cluttered UI.

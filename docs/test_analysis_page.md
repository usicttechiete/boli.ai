# Test Analysis Page Plan (`app/test/analysis.tsx`)

## Overview
This screen displays the results of the proficiency test. It gives the user a breakdown of their pace, accent, dialect inference, and overall fluency score. This result is automatically saved to the database.

## UI Sections

### 1. Header / Celebration
- "Analysis Complete!"
- Short text: "We've saved your proficiency profile for [Language]."

### 2. Score Cards (Grid Layout)
Use reusable `ScoreCard` components to display the metrics returned from the backend.

- **Fluency Score**: Large circular ring chart (`components/charts/AccuracyRing.tsx`) showing a number 0-100.
  - E.g., "85/100" -> "Highly fluent".
- **Pace (WPM)**:
  - Metric: e.g., "120 WPM".
  - Status: "Perfect pace" or "A bit fast".
- **Dialect inferred**:
  - Shows the regional influence detected by the LLM. 
  - E.g., "North Indian Influence".
- **Accent Feedback**:
  - A short text snippet directly from the LLM.
  - E.g., "Clear pronunciation, strong enunciation on consonants."

### 3. Action Buttons
- **Primary Button**: "Done" -> Navigates user back to `app/(tabs)/index.tsx`, where the Home screen will auto-refresh and display the newly added language.
- **Secondary Button**: "Retest" -> Navigates back to `app/test/[language].tsx` so the user can try again if they stumbled. 
  - *Note: Retesting for the same language should just insert a new record or overwrite the previous one for that specific language and user.*

## State Management
- Read the test results from navigation params (e.g., using `expo-router`'s `useLocalSearchParams`) or read from a `lastTestResult` object in the Zustand `sessionStore`.

# Learn Language Source Selection Page Plan (`app/learn/[language].tsx`)

## Overview
This page acts as a "bridge". When a user wants to learn a new language, BOLI.AI asks them: "Which language do you want to learn *from*?" The options provided must be drawn directly from the user's established "Known Languages" list.

## Route Params
- `language`: The **Target Language** they want to learn (e.g., "English").

## UI Sections

### 1. Header
- Back button.
- Title: "Learn [Target Language]"

### 2. Prompt
- Large text: "Which language would you like to use as your base to learn [Target Language]?"
- Sub-text: "We tailor your course based on your native language structure."

### 3. Source Selection List
- Display a vertical list of buttons, corresponding to the user's "Known Languages" fetched from the backend (`GET /api/test/known-languages`).
- **Edge Case: Empty State**:
  - If the user has 0 known languages recorded, show an alert block:
    - "You must establish a baseline language first!"
    - Button: "Go to Home to Add a Language".
- **Selection**:
  - Tapping a language highlights it or instantly proceeds.

### 4. Continue Action
- Upon selecting a known source language (e.g., Hindi), route the user to the dummy practice flow: `app/learn/practice.tsx?source=hindi&target=english`.

## Data Requirements
- Fetch `known_languages` from React Query / Zustand store. If not loaded, fetch them.

# Add Language Test Page Plan (`app/test/[language].tsx`)

## Overview
 This screen acts as the testing grounds when a user claims they know a language. The app records the user reading a predefined paragraph, verifying their proficiency and calculating their baseline stats.

## Route Params
- `language`: The language they chose to test (e.g., "hindi", "english"). 

## UI Sections

### 1. Header
- Back button (left).
- Title: "Test your [Language]" (center).

### 2. Instructions & Paragraph Card
- Clear instruction: "Please read the paragraph below aloud. Speak naturally!"
- **Sample Paragraph**:
  - A block of text in the target language. 
  - *Note: We will need a constant defining a sample paragraph for each supported test language (English, Hindi, etc.).*
  - Typography: Large, highly legible font.

### 3. Recording Controls
- A prominent, large Microphone button.
- **Pre-recording state**: "Tap to Start".
- **Recording state**: 
  - Microphone pulses/animates (`components/audio/WaveformVisualizer.tsx`).
  - Timer counts up (MM:SS).
  - Button changes to a "Stop" square.
- **Post-recording state**:
  - Hide mic, show a "Submit for Analysis" primary button.
  - Option to "Rerecord" (trash icon).

### 4. Processing State
- Overlay or full screen loading spinner while the audio is being processed by the backend/Sarvam API.
- Text: "Analyzing your speech... measuring pace, accent, and fluency."

## Flow & Logic
1. User taps mic, `expo-av` starts recording.
2. User reads paragraph.
3. User taps stop.
4. User taps "Submit".
5. App calls `POST /api/test/analyze` with the audio `.m4a` file, the `language`, and the expected `promptText`.
6. Upon successful 200 OK response from API, app navigates to `app/test/analysis.tsx`, passing the result data in params or Zustand store.

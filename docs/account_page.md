# Account Page Plan (`app/(tabs)/account.tsx`)

## Overview
A simple settings and profile management page. This replaces the old "Profile" tab and consolidates all user-specific configurations.

## UI Sections

### 1. Profile Header
- Avatar/Icon placeholder.
- User Name (fetched from global state / authentication context).
- "Member since: [Date]".

### 2. Settings List
Use a standard mobile settings list layout (e.g., `FlatList` with chevron right icons).
- **Edit Profile**: (Dummy for now, or just updates name).
- **Notifications**: (Toggle switch for daily reminders).
- **Privacy Policy / About**: Static informational screens or external links.

### 3. Destructive Actions
- **Sign Out Button**: 
  - Distinct styling (e.g., outlined red or soft grey card with red text).
  - Tapping clears Supabase auth state and routes the user out of the `(tabs)` group back to `(auth)/login.tsx`.

## Logic
- The `Sign Out` logic should hit `supabase.auth.signOut()` and update the Zustand auth store (`setUser(null)`), which will automatically trigger the `app/_layout.tsx` auth guard to redirect the user to the login screen.

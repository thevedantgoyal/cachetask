

# ConnectPlus Branded Loading Indicator

## Overview
Add a global, reusable ConnectPlus-branded loading component that replaces all generic spinners and "Loading..." text across the application. The loader will feature the "C" logo mark with a smooth animation, reinforcing brand identity during any wait state.

## What You'll Get
- A polished loading animation featuring the ConnectPlus "C" logo with a rotating ring and pulsing effect
- Consistent loading experience across login, logout, page loads, data fetching, and form submissions
- Two variants: **full-screen overlay** (for auth/navigation) and **inline** (for content areas)
- No existing features removed or UI redesigned

## How It Works
1. During login/logout/auth checks: a full-screen branded overlay appears
2. During data loading on any page: an inline branded spinner replaces skeleton/text loaders
3. During form submissions: buttons show a small branded spinner instead of "Please wait..."

---

## Technical Details

### 1. Create `ConnectPlusLoader` Component
**File:** `src/components/ui/ConnectPlusLoader.tsx`

A reusable component with props:
- `variant`: `"fullscreen"` | `"inline"` | `"button"` (size/layout)
- `message`: optional text below the animation (e.g., "Signing in...")

The animation:
- The "C" logo mark (matching splash screen) centered
- A circular ring animating around it (CSS `animate-spin` with brand color)
- Subtle pulse on the logo itself
- All done with Tailwind + framer-motion (already installed)

### 2. Replace Loading States Across the App

| Location | Current | New |
|---|---|---|
| `ProtectedRoute.tsx` | `animate-pulse "Loading..."` | `ConnectPlusLoader fullscreen` |
| `AdminRoute.tsx` | `animate-pulse "Checking permissions..."` | `ConnectPlusLoader fullscreen` with message |
| `OrganizationRoute.tsx` | `animate-spin border spinner` | `ConnectPlusLoader fullscreen` |
| `AuthPage.tsx` (submit button) | `"Please wait..."` text | `ConnectPlusLoader button` variant inline |
| `ProfilePage.tsx` | `animate-pulse "Loading profile..."` | `ConnectPlusLoader inline` |
| `ReportsPage.tsx` | `animate-spin border spinner` | `ConnectPlusLoader inline` |
| `TasksPage.tsx` | `Loader2 animate-spin` | `ConnectPlusLoader inline` |
| `Index.tsx` | Skeleton cards (kept) | No change -- skeletons are already good UX |
| `NavigationDrawer.tsx` (logout) | No loading state | Add brief `ConnectPlusLoader fullscreen` on sign-out |

### 3. Files Changed

- **Create:** `src/components/ui/ConnectPlusLoader.tsx`
- **Edit:** `src/components/auth/ProtectedRoute.tsx` -- swap loading div
- **Edit:** `src/components/auth/AdminRoute.tsx` -- swap loading div
- **Edit:** `src/components/auth/OrganizationRoute.tsx` -- swap loading div
- **Edit:** `src/pages/AuthPage.tsx` -- use button variant during submit
- **Edit:** `src/pages/ProfilePage.tsx` -- swap loading div
- **Edit:** `src/pages/ReportsPage.tsx` -- swap loading div
- **Edit:** `src/pages/TasksPage.tsx` -- swap Loader2 spinner

### 4. No Changes To
- Existing features, routing, or data logic
- Skeleton loaders on the Dashboard (Index.tsx) -- these are already best-practice
- SplashScreen component -- remains separate as the app boot experience
- Any UI layout or design


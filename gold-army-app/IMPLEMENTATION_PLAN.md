# Gold Army Fitness Club

## Architecture

- `app/`: Expo Router routes grouped by auth, member, trainer, and admin role.
- `components/`: reusable brand, card, badge, stat, button, and navigation primitives.
- `constants/`: design tokens and app configuration.
- `services/`: Axios API client and React Query service boundaries.
- `store/`: persisted Zustand session and UI state.
- `types/`: shared domain contracts.
- `assets/`: logo and media assets.

## Delivery order

1. Foundation, design tokens, providers, session persistence, and role routing.
2. Splash, login, OTP, password recovery, and logout.
3. Member home, membership, attendance, workout, diet, PT, notifications, profile, and progress.
4. Trainer mobile workflow.
5. Admin mobile workflow.
6. Express/MySQL API integration, payments, notifications, testing, and optimization.

The HTML prototype remains the visual source of truth. Production data is loaded through the API layer; the first vertical slice uses clearly marked demo session data only to make the UI navigable before backend credentials exist.

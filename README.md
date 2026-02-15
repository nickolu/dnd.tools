# dnd.tools

Home for Dungeons and Dragons tools for players and dungeon masters.

## Firebase setup

1. In [Firebase Console](https://console.firebase.google.com/), create a project.
2. Add a Web app in that project.
3. In `Authentication > Sign-in method`, enable `Google`.
4. In `Authentication > Settings > Authorized domains`, add your local/dev/prod domains.
5. Copy `.env.example` to `.env.local` and fill values.

Client env vars:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Optional server env vars for API writes/scripts:

- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Run locally

```bash
npm install
npm run dev
```

## Tests

```bash
npm run test
```

## One-time Firestore flow check

This is not part of CI and is intended as a local smoke check.

```bash
npm run check:firestore-flow
```

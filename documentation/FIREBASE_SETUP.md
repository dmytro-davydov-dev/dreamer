# Firebase Setup

This project uses Firebase for two things: **Firestore** (database) and **Anonymous Auth** (per-user data isolation). There is no custom backend — the React client talks directly to Firebase.

---

## Prerequisites

- Node.js ≥ 18
- A Google account
- `firebase-tools` — already in `devDependencies`, run via `npx firebase-tools`

---

## 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `dreamer-prod`) → disable Google Analytics → **Create project**

---

## 2. Enable Firestore

1. In the left sidebar: **Build → Firestore Database**
2. Click **Create database** → choose **Production mode** → pick a region → **Done**

---

## 3. Enable Anonymous Authentication

1. **Build → Authentication → Get started**
2. **Sign-in method** tab → click **Anonymous** → toggle **Enable** → **Save**

---

## 4. Register a Web App & Get Credentials

1. **Project Overview → Add app → Web (`</>`)**
2. Give it a nickname (e.g. `dreamer-web`) → **Register app**
3. Copy the `firebaseConfig` object shown

---

## 5. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values from the config object above:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Set to "true" to use local emulators instead of production Firebase
VITE_USE_FIREBASE_EMULATORS=false
```

> **Never commit `.env`** — it is already in `.gitignore`.

---

## 6. Link the Firebase Project (CLI)

Create `.firebaserc` in the project root:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

---

## 7. Deploy Security Rules

Authenticate the CLI once, then deploy:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

The rules in `firestore.rules` enforce that users can only read/write their own data (`/users/{uid}/...`), and that no API key material is ever persisted to Firestore.

---

## Local Development with Emulators

To develop against local emulators instead of production Firebase:

**Start emulators:**
```bash
npm run emulators
# or: npx firebase-tools emulators:start
```

**Enable emulator mode** — set in `.env`:
```env
VITE_USE_FIREBASE_EMULATORS=true
```

Then start the dev server as normal:
```bash
npm run dev
```

The emulator UI is available at [http://localhost:4000](http://localhost:4000) — you can inspect Firestore documents and Auth users there.

**Emulator ports:**
| Service   | Port |
|-----------|------|
| Firestore | 8080 |
| Auth      | 9099 |
| UI        | 4000 |

> Switch back to `VITE_USE_FIREBASE_EMULATORS=false` to point at production.

---

## Firestore Data Model

All user data lives under `/users/{uid}/` — users can only access their own subtree.

```
/users/{uid}
  /dreams/{dreamId}
    /elements/{elementId}
    /associations/{associationId}
    /hypotheses/{hypothesisId}
    /integration/main
```

See [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) for full field-level schema.

---

## Security Notes

- API keys (OpenAI, etc.) are stored in `localStorage` only — never written to Firestore. The security rules actively block any document containing known key field names.
- The Firebase `apiKey` in `.env` is a **public identifier**, not a secret — it is safe to expose in client-side code. Access is controlled by Firestore security rules and Auth.
- For production, consider enabling [App Check](https://firebase.google.com/docs/app-check) to prevent abuse of the Firebase project.
